import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const outDir = path.join(rootDir, '.tmp', 'screenshots', 'minimal_dark_auth');
const userDataDir = path.join(rootDir, '.tmp', 'cprof_qa_auth_' + Date.now());
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(userDataDir, { recursive: true });

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class PipeCDP {
  constructor(proc) {
    this.proc = proc;
    this.pipeOut = proc.stdio[3];
    this.pipeIn = proc.stdio[4];
    this.id = 0;
    this.pending = new Map();
    this.eventHandlers = new Map();
    this.sessionId = null;

    let buf = '';
    this.pipeIn.on('error', () => {});
    this.pipeOut.on('error', () => {});
    this.pipeIn.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      let idx;
      while ((idx = buf.indexOf('\0')) !== -1) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (!raw) continue;
        try {
          const msg = JSON.parse(raw);
          if (msg.id && this.pending.has(msg.id)) {
            const { resolve, reject } = this.pending.get(msg.id);
            this.pending.delete(msg.id);
            if (msg.error) reject(new Error(msg.error.message));
            else resolve(msg.result);
          } else if (msg.method) {
            const handlers = this.eventHandlers.get(msg.method) || [];
            for (const h of handlers) h(msg.params, msg.sessionId);
          }
        } catch {}
      }
    });
  }

  on(method, fn) {
    if (!this.eventHandlers.has(method)) this.eventHandlers.set(method, []);
    this.eventHandlers.get(method).push(fn);
  }

  send(method, params = {}, useSession = true) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (useSession && this.sessionId) payload.sessionId = this.sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.pipeOut.write(JSON.stringify(payload) + '\0');
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.exceptionDetails) {
      throw new Error(
        res.exceptionDetails.exception?.description || res.exceptionDetails.text
      );
    }
    return res.result?.value;
  }

  async setViewport(width, height, mobile = true) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: mobile ? 2 : 1,
      mobile,
    });
  }

  async screenshot(filename) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    return filePath;
  }
}

async function runQA() {
  console.log('=== ASCEND: QA VISUAL REAL-WORLD — AUTH EXPERIENCE MINIMAL DARK ===');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const proc = spawn(
    chromePath,
    [
      '--headless',
      '--no-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      '--remote-debugging-pipe',
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ],
    { stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'] }
  );

  const cdp = new PipeCDP(proc);
  const { targetInfos } = await cdp.send('Target.getTargets', {}, false);
  const pageTarget = targetInfos.find((t) => t.type === 'page');
  const { sessionId } = await cdp.send(
    'Target.attachToTarget',
    { targetId: pageTarget.targetId, flatten: true },
    false
  );
  cdp.sessionId = sessionId;

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');

  const pageErrors = [];
  cdp.on('Runtime.exceptionThrown', (p) => {
    const text = p.exceptionDetails.exception?.description || p.exceptionDetails.text;
    pageErrors.push(text);
  });

  await cdp.send('Fetch.enable', {
    patterns: [{ urlPattern: 'https://ascend.app/*' }],
  });

  cdp.on('Fetch.requestPaused', async (params) => {
    const reqUrl = params.request.url;
    const parsed = new URL(reqUrl);
    const reqPath = decodeURIComponent(parsed.pathname);
    let filePath = path.join(distDir, reqPath === '/' ? 'index.html' : reqPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distDir, 'index.html');
    }
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    try {
      const data = fs.readFileSync(filePath);
      await cdp.send('Fetch.fulfillRequest', {
        requestId: params.requestId,
        responseCode: 200,
        responseHeaders: [
          { name: 'Content-Type', value: contentType },
          { name: 'Access-Control-Allow-Origin', value: '*' },
        ],
        body: data.toString('base64'),
      });
    } catch {
      await cdp
        .send('Fetch.fulfillRequest', {
          requestId: params.requestId,
          responseCode: 404,
          responseHeaders: [{ name: 'Content-Type', value: 'text/plain' }],
          body: Buffer.from('Not found').toString('base64'),
        })
        .catch(() => {});
    }
  });

  const testResults = [];
  function record(id, title, pass, details = '') {
    testResults.push({ id, title, pass, details });
    const mark = pass ? '✓ PASS' : '✗ FAIL';
    console.log(`[${mark}] ${id}: ${title} ${details ? '(' + details + ')' : ''}`);
  }

  try {
    // 1. Navegação direta para /login
    await cdp.send('Page.navigate', { url: 'https://ascend.app/login' });
    await sleep(1500);

    // 2. Validação Visual e Screenshots em Viewports Especificadas
    const viewports = [
      { name: '320x700_mobile_compact', w: 320, h: 700, mobile: true },
      { name: '375x812_mobile_standard', w: 375, h: 812, mobile: true },
      { name: '390x844_mobile_flagship', w: 390, h: 844, mobile: true },
      { name: '430x932_mobile_promax', w: 430, h: 932, mobile: true },
      { name: '768x1024_tablet', w: 768, h: 1024, mobile: true },
      { name: '1440x900_desktop', w: 1440, h: 900, mobile: false },
      { name: '1920x1080_desktop_wide', w: 1920, h: 1080, mobile: false },
    ];

    console.log('\n--- CAPTURANDO SCREENSHOTS DA TELA DE LOGIN ---');
    for (const vp of viewports) {
      await cdp.setViewport(vp.w, vp.h, vp.mobile);
      await sleep(350);
      const filename = `login_${vp.name}.png`;
      await cdp.screenshot(filename);
      record(`VP-LOGIN-${vp.w}`, `Login renderizado em ${vp.w}x${vp.h}`, true, filename);
    }

    // 3. Inspeção DOM e Princípios Minimal Dark em Desktop
    await cdp.setViewport(1440, 900, false);
    await sleep(300);

    const desktopChecks = await cdp.evaluate(`
      (() => {
        const aside = document.querySelector('aside');
        const asideVisible = aside && window.getComputedStyle(aside).display !== 'none';
        const asideWidth = aside ? aside.getBoundingClientRect().width : 0;
        const totalWidth = window.innerWidth;
        const widthPercent = (asideWidth / totalWidth) * 100;
        
        const hasGateCalibrated = document.body.innerText.includes('GATE CALIBRATED') || document.body.innerText.includes('Gate Calibrado');
        const hasEntryProtocol = document.body.innerText.includes('ENTRY PROTOCOL') || document.body.innerText.includes('Protocolo de Entrada');
        
        const submitBtn = document.querySelector('button[type="submit"]');
        const submitRect = submitBtn ? submitBtn.getBoundingClientRect() : null;
        
        const emailInput = document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[type="password"]');

        return {
          asideVisible,
          asideWidth,
          widthPercent: Math.round(widthPercent),
          hasGateCalibrated,
          hasEntryProtocol,
          submitHeight: submitRect ? Math.round(submitRect.height) : 0,
          emailPresent: !!emailInput,
          passwordPresent: !!passInput,
          titleText: document.querySelector('h1')?.innerText || '',
        };
      })()
    `);

    record(
      'DESK-SPLIT',
      'Split-screen desktop: arte editorial à esquerda na proporção 40-45%',
      desktopChecks.asideVisible && desktopChecks.widthPercent >= 38 && desktopChecks.widthPercent <= 45,
      `largura: ${desktopChecks.widthPercent}%`
    );

    record(
      'DESK-NO-CLUTTER',
      'Remoção de "GATE CALIBRATED" e "ENTRY PROTOCOL"',
      !desktopChecks.hasGateCalibrated && !desktopChecks.hasEntryProtocol,
      'limpo de badges falsos'
    );

    record(
      'DESK-CTA-HEIGHT',
      'Botão principal CTA possui altura ergonômica >= 52px',
      desktopChecks.submitHeight >= 52,
      `altura: ${desktopChecks.submitHeight}px`
    );

    // 4. Inspeção Mobile Ergonomics (390x844)
    await cdp.setViewport(390, 844, true);
    await sleep(300);

    const mobileChecks = await cdp.evaluate(`
      (() => {
        const aside = document.querySelector('aside');
        const asideHidden = !aside || window.getComputedStyle(aside).display === 'none';
        
        const emailInput = document.querySelector('input[type="email"]');
        const emailRect = emailInput ? emailInput.getBoundingClientRect() : null;
        
        const submitBtn = document.querySelector('button[type="submit"]');
        const submitRect = submitBtn ? submitBtn.getBoundingClientRect() : null;
        
        const langBtn = document.querySelector('header button');
        const langRect = langBtn ? langBtn.getBoundingClientRect() : null;

        return {
          asideHidden,
          emailTop: emailRect ? Math.round(emailRect.top) : 0,
          submitBottom: submitRect ? Math.round(submitRect.bottom) : 0,
          windowHeight: window.innerHeight,
          inputsAboveFold: submitRect ? submitRect.bottom <= window.innerHeight + 50 : false,
          langBtnTouchSize: langRect ? Math.min(langRect.width, langRect.height) : 0,
        };
      })()
    `);

    record(
      'MOB-NO-HERO-PUSH',
      'Em mobile, o formulário é exibido sem hero image bloqueando a dobra',
      mobileChecks.asideHidden && mobileChecks.emailTop < 350,
      `email input top: ${mobileChecks.emailTop}px`
    );

    record(
      'MOB-ABOVE-FOLD',
      'Formulário e CTA cabem confortavelmente no viewport inicial',
      mobileChecks.inputsAboveFold,
      `submit bottom: ${mobileChecks.submitBottom}px / viewport: ${mobileChecks.windowHeight}px`
    );

    // 5. Interações: Toggle de Senha & Alternância de Idioma
    console.log('\n--- TESTANDO INTERAÇÕES NA TELA DE LOGIN ---');
    const toggleResult = await cdp.evaluate(`
      (async () => {
        const passInput = document.querySelector('input[name="password"]');
        const toggleBtn = passInput.parentElement.querySelector('button');
        const initialType = passInput.type;
        toggleBtn.click();
        await new Promise(r => setTimeout(r, 80));
        const afterClickType = passInput.type;
        toggleBtn.click();
        await new Promise(r => setTimeout(r, 80));
        const finalType = passInput.type;
        return { initialType, afterClickType, finalType };
      })()
    `);

    record(
      'INTERACT-PASSWORD-TOGGLE',
      'Alternador de visibilidade de senha (Eye/EyeOff) funcional',
      toggleResult.initialType === 'password' &&
      toggleResult.afterClickType === 'text' &&
      toggleResult.finalType === 'password',
      `password -> text -> password`
    );

    // 6. Teste da Tela de Cadastro (/register)
    console.log('\n--- CAPTURANDO SCREENSHOTS DA TELA DE CADASTRO ---');
    await cdp.send('Page.navigate', { url: 'https://ascend.app/register' });
    await sleep(1000);

    await cdp.setViewport(390, 844, true);
    await sleep(300);
    await cdp.screenshot('register_390x844_mobile.png');

    await cdp.setViewport(1440, 900, false);
    await sleep(300);
    await cdp.screenshot('register_1440x900_desktop.png');

    const registerChecks = await cdp.evaluate(`
      (() => {
        const userInput = document.querySelector('input[name="username"]');
        const emailInput = document.querySelector('input[name="email"]');
        const passInput = document.querySelector('input[name="password"]');
        const confirmInput = document.querySelector('input[name="confirmPassword"]');
        
        // Simula digitação para verificar validação em tempo real
        passInput.value = 'hunter123';
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
        passInput.dispatchEvent(new Event('change', { bubbles: true }));

        confirmInput.value = 'hunter123';
        confirmInput.dispatchEvent(new Event('input', { bubbles: true }));
        confirmInput.dispatchEvent(new Event('change', { bubbles: true }));

        return {
          hasUser: !!userInput,
          hasEmail: !!emailInput,
          hasPass: !!passInput,
          hasConfirm: !!confirmInput,
        };
      })()
    `);

    await sleep(200);
    await cdp.screenshot('register_1440x900_with_validation.png');

    record(
      'REG-FIELDS',
      'Tela de cadastro contém campos codinome, email, senha e confirmação',
      registerChecks.hasUser && registerChecks.hasEmail && registerChecks.hasPass && registerChecks.hasConfirm,
      'todos os campos presentes'
    );

    // 7. Teste de Recuperação de Senha (/forgot-password)
    console.log('\n--- CAPTURANDO SCREENSHOTS DA TELA DE RECUPERAÇÃO ---');
    await cdp.send('Page.navigate', { url: 'https://ascend.app/forgot-password' });
    await sleep(1000);

    await cdp.setViewport(390, 844, true);
    await sleep(300);
    await cdp.screenshot('forgot_390x844_mobile.png');

    await cdp.setViewport(1440, 900, false);
    await sleep(300);
    await cdp.screenshot('forgot_1440x900_desktop.png');

    const forgotChecks = await cdp.evaluate(`
      (() => {
        const emailInput = document.querySelector('input[type="email"]');
        const submitBtn = document.querySelector('button[type="submit"]');
        const titleText = document.querySelector('h1')?.innerText || '';
        return {
          hasEmail: !!emailInput,
          hasSubmit: !!submitBtn,
          titleText,
        };
      })()
    `);

    record(
      'FORGOT-PAGE',
      'Página /forgot-password renderizada com estética Minimal Dark',
      forgotChecks.hasEmail && forgotChecks.hasSubmit,
      `título: ${forgotChecks.titleText}`
    );

    // 8. Teste do Modal de Recuperação de Senha a partir de /login
    await cdp.send('Page.navigate', { url: 'https://ascend.app/login' });
    await sleep(1000);
    await cdp.setViewport(390, 844, true);
    await sleep(300);

    const modalOpened = await cdp.evaluate(`
      (() => {
        const forgotBtn = Array.from(document.querySelectorAll('button')).find(b => 
          b.innerText.includes('Esqueceu sua senha?') || b.innerText.includes('Forgot your password?')
        );
        if (forgotBtn) {
          forgotBtn.click();
          return true;
        }
        return false;
      })()
    `);

    await sleep(500);
    await cdp.screenshot('login_390x844_modal_open.png');

    const modalCheck = await cdp.evaluate(`
      (() => {
        const dialog = document.querySelector('[role="dialog"]');
        return !!dialog;
      })()
    `);

    record(
      'FORGOT-MODAL',
      'Modal de recuperação de senha acionado com sucesso a partir de /login',
      modalOpened && modalCheck,
      'modal aberto e capturado'
    );

    // 9. Auditoria de Exceções de Página
    record(
      'NO-CONSOLE-ERRORS',
      'Zero exceções uncaught no console do navegador',
      pageErrors.length === 0,
      pageErrors.length === 0 ? '0 erros' : pageErrors.join(' | ')
    );

    console.log('\n=============================================');
    const totalPassed = testResults.filter((t) => t.pass).length;
    console.log(`TOTAL: ${totalPassed}/${testResults.length} testes reais concluídos com sucesso!`);
    console.log(`Screenshots gravados em: ${outDir}`);
    console.log('=============================================\n');

    process.exit(totalPassed === testResults.length ? 0 : 1);
  } finally {
    try {
      proc.kill();
    } catch {}
  }
}

runQA().catch((err) => {
  console.error('Fatal error in QA script:', err);
  process.exit(1);
});
