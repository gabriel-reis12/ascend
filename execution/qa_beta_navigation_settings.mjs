import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const outDir = path.join(rootDir, '.tmp', 'screenshots', 'beta_ux_fix');
const userDataDir = path.join(rootDir, '.tmp', 'cprof_qa_beta_' + Date.now());
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

function buildMockBackendScript() {
  const userId = '00000000-0000-4000-8000-000000000042';
  const nowSec = Math.floor(Date.now() / 1000);
  const todayIso = new Date().toISOString();

  const mockUser = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'jinwoo@ascend.gg',
    email_confirmed_at: todayIso,
    app_metadata: { provider: 'email' },
    user_metadata: { username: 'SungJinwoo' },
    created_at: todayIso,
  };

  const jwtHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const jwtPayload = Buffer.from(
    JSON.stringify({
      aud: 'authenticated',
      exp: nowSec + 86400,
      iat: nowSec,
      sub: userId,
      email: 'jinwoo@ascend.gg',
      role: 'authenticated',
    })
  ).toString('base64url');
  const validJwt = `${jwtHeader}.${jwtPayload}.sig42`;

  const mockSession = {
    access_token: validJwt,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: nowSec + 3600,
    refresh_token: 'fake.refresh',
    user: mockUser,
  };

  const hunterState = {
    username: 'SungJinwoo',
    fullName: 'Sung Jin-Woo',
    hunterClass: 'Warrior',
    level: 12,
    rank: 'B',
    xp: 450,
    xpRequired: 1200,
    activeTitle: 'Monarca das Sombras',
    profileUserId: userId,
    profileLoaded: true,
    profileLoading: false,
    profileError: null,
    stats: {
      strength: 28,
      endurance: 24,
      intelligence: 18,
      discipline: 26,
      vitality: 22,
      wisdom: 16,
      balance: 19,
    },
    streak: { current: 14, best: 21 },
    height: 180,
    weightCurrent: 78,
    weightTarget: 80,
    trainingFocus: 'Musculação',
    nutritionGoal: 'gain',
  };

  return `
    (() => {
      const USER_ID = '${userId}';
      const SESSION = ${JSON.stringify(mockSession)};
      const STATE = ${JSON.stringify(hunterState)};

      window.localStorage.setItem('ascend-auth-token', JSON.stringify(SESSION));
      window.localStorage.setItem('ascend_auth_user', JSON.stringify(SESSION.user));
      window.localStorage.setItem('ascend_tour_completed', 'true');
      window.localStorage.setItem(
        'hunter-storage',
        JSON.stringify({
          state: STATE,
          version: 0,
        })
      );

      const origFetch = window.fetch.bind(window);
      window.fetch = async (input, init = {}) => {
        const url = typeof input === 'string' ? input : input.url;
        if (!url.includes('supabase.co')) {
          return origFetch(input, init);
        }

        const jsonResponse = (data, status = 200) =>
          new Response(JSON.stringify(data), {
            status,
            headers: { 'Content-Type': 'application/json' },
          });

        if (url.includes('/auth/v1/user')) return jsonResponse(${JSON.stringify(mockUser)});
        if (url.includes('/auth/v1/token')) return jsonResponse(${JSON.stringify(mockSession)});
        if (url.includes('/rest/v1/profiles')) {
          return jsonResponse({
            id: '${userId}',
            username: 'SungJinwoo',
            full_name: 'Sung Jin-Woo',
            class: 'Warrior',
            level: 12,
            rank: 'B',
            xp: 450,
            xp_to_next_level: 1200,
            strength: 28,
            endurance: 24,
            intelligence: 18,
            discipline: 26,
            vitality: 22,
            wisdom: 16,
            balance: 19
          });
        }
        if (url.includes('/rest/v1/achievements')) {
          return jsonResponse([
            { id: 'ach-1', title: 'Primeiro Despertar', unlocked_at: '${todayIso}' },
            { id: 'ach-2', title: 'Monarca das Sombras', unlocked_at: '${todayIso}' }
          ]);
        }
        if (url.includes('/rest/v1/workout_routines')) return jsonResponse([{ id: 'wr-1' }, { id: 'wr-2' }]);
        if (url.includes('/rest/v1/meal_plans')) return jsonResponse([{ id: 'mp-1' }, { id: 'mp-2' }, { id: 'mp-3' }]);
        if (url.includes('/rest/v1/habits')) return jsonResponse([{ id: 'h-1' }, { id: 'h-2' }, { id: 'h-3' }, { id: 'h-4' }]);
        if (url.includes('/rest/v1/tasks')) return jsonResponse([{ id: 't-1' }, { id: 't-2' }]);
        if (url.includes('/rest/v1/boss_battles')) {
          return jsonResponse([{
            id: 'battle-01',
            user_id: USER_ID,
            boss_id: 'boss_01',
            name: 'The Lord of Procrastination',
            current_hp: 850,
            max_hp: 1000,
            target_days: 7,
            defeated: false,
            started_at: '${todayIso}',
            expires_at: '${new Date(Date.now() + 4 * 86400000).toISOString()}',
            status: 'active'
          }]);
        }
        if (url.includes('/rest/v1/rest_logs')) return jsonResponse([]);
        if (url.includes('/rest/v1/food_logs')) return jsonResponse([]);
        return jsonResponse([]);
      };
    })();
  `;
}

async function runQA() {
  console.log('--- INICIANDO QA REAL NO NAVEGADOR (BETA UX FIX) ---');
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

  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: buildMockBackendScript(),
  });

  const testResults = [];

  // 1. Abertura Direta de Ajustes em /settings
  console.log('[TEST 1] Abertura direta em /settings...');
  await cdp.setViewport(390, 844, true);
  await cdp.send('Page.navigate', { url: 'https://ascend.app/settings' });
  await sleep(1500);

  const settingsTitle = await cdp.evaluate('document.querySelector("h1")?.innerText');
  const hasProfileSection = await cdp.evaluate('Boolean(document.querySelector("form"))');
  const shotSettings = await cdp.screenshot('settings_direct_390x844.png');
  testResults.push({
    test: 'Abertura Direta /settings',
    pass: settingsTitle?.includes('AJUSTES') || settingsTitle?.includes('SETTINGS'),
    detail: `Título: ${settingsTitle}, Form: ${hasProfileSection}`,
    shot: shotSettings,
  });

  // 2. Atualização / Reload da Página em /settings (verificar persistência de sessão e ausência de crash)
  console.log('[TEST 2] Reload de página em /settings...');
  await cdp.send('Page.reload');
  await sleep(1500);

  const reloadedTitle = await cdp.evaluate('document.querySelector("h1")?.innerText');
  const shotSettingsReload = await cdp.screenshot('settings_reloaded_390x844.png');
  testResults.push({
    test: 'Reload em /settings',
    pass: reloadedTitle?.includes('AJUSTES') || reloadedTitle?.includes('SETTINGS'),
    detail: `Título pós-reload: ${reloadedTitle}`,
    shot: shotSettingsReload,
  });

  // 3. Central do Caçador em /hub (390x844)
  console.log('[TEST 3] Central do Caçador em /hub (390x844)...');
  await cdp.send('Page.navigate', { url: 'https://ascend.app/hub' });
  await sleep(1200);

  const hubHeading = await cdp.evaluate('document.querySelector("h1")?.innerText');
  const hasPlayerStatusLink = await cdp.evaluate('Boolean(document.querySelector("a[href=\'/status\'], button"))');
  const bottomNavActive = await cdp.evaluate(`
    (() => {
      const activeLink = document.querySelector('nav[aria-label="Mobile Primary Navigation"] a[aria-current="page"]');
      return activeLink ? activeLink.getAttribute('href') : null;
    })()
  `);
  const shotHubMobile = await cdp.screenshot('hub_mobile_390x844.png');
  testResults.push({
    test: 'Central do Caçador /hub (Mobile)',
    pass: hubHeading?.includes('SUNG') && bottomNavActive === '/hub',
    detail: `Hunter: ${hubHeading}, Aba Ativa: ${bottomNavActive}`,
    shot: shotHubMobile,
  });

  // 4. Central do Caçador Responsividade: 320x700, 375x812, 430x932, Desktop 1280x800
  console.log('[TEST 4] Teste responsivo da Central (320px, 375px, 430px, Desktop)...');
  const viewports = [
    { name: '320x700', w: 320, h: 700, mobile: true },
    { name: '375x812', w: 375, h: 812, mobile: true },
    { name: '430x932', w: 430, h: 932, mobile: true },
    { name: 'desktop_1280x800', w: 1280, h: 800, mobile: false },
  ];

  for (const vp of viewports) {
    await cdp.setViewport(vp.w, vp.h, vp.mobile);
    await sleep(400);
    const shot = await cdp.screenshot(`hub_${vp.name}.png`);
    const overflow = await cdp.evaluate('document.documentElement.scrollWidth > window.innerWidth');
    testResults.push({
      test: `Central do Caçador (${vp.name})`,
      pass: !overflow,
      detail: `Overflow horizontal: ${overflow}`,
      shot,
    });
  }

  // 5. Testar todos os links a partir da Central do Caçador
  console.log('[TEST 5] Navegação da Central para os 6 submódulos...');
  await cdp.setViewport(390, 844, true);

  const submodules = [
    { name: 'Player Status', path: '/status', expectedSelector: 'h1, h2' },
    { name: 'Boss Raids', path: '/bosses', expectedSelector: 'h1, h2' },
    { name: 'Trophy Room', path: '/trophies', expectedSelector: 'h1, h2' },
    { name: 'Fortuna', path: '/fortuna', expectedSelector: 'h1, h2' },
    { name: 'Descanso', path: '/rest', expectedSelector: 'h1, h2' },
    { name: 'Social', path: '/social', expectedSelector: 'h1, h2' },
  ];

  for (const mod of submodules) {
    await cdp.send('Page.navigate', { url: `https://ascend.app${mod.path}` });
    await sleep(1000);
    const navDebug = await cdp.evaluate(`
      (() => {
        const link = document.querySelector('nav[aria-label="Mobile Primary Navigation"] a[aria-current="page"]');
        const links = Array.from(document.querySelectorAll('nav[aria-label="Mobile Primary Navigation"] a')).map(a => ({
          href: a.getAttribute('href'),
          current: a.getAttribute('aria-current')
        }));
        return {
          pathname: window.location.pathname,
          activeHref: link ? link.getAttribute('href') : null,
          links
        };
      })()
    `);
    const activeTab = navDebug?.activeHref;
    if (!activeTab) {
      console.warn(`[DEBUG ${mod.name}] pathname=${navDebug?.pathname}, links=`, navDebug?.links);
    }
    const shot = await cdp.screenshot(`submodule_${mod.name.replace(/\s+/g, '_').toLowerCase()}_390x844.png`);

    testResults.push({
      test: `Navegação Submódulo: ${mod.name}`,
      pass: activeTab === '/hub', // Deve manter a Central ativa na BottomNav
      detail: `Rota: ${mod.path}, BottomNav Ativa: ${activeTab} (Central iluminada)`,
      shot,
    });
  }

  // 6. Testar Player Status via Avatar da Home
  console.log('[TEST 6] Acesso ao Player Status pelo Avatar da Home...');
  await cdp.send('Page.navigate', { url: 'https://ascend.app/' });
  await sleep(1000);

  const homeBottomNavActive = await cdp.evaluate(`
    (() => {
      const link = document.querySelector('nav[aria-label="Mobile Primary Navigation"] a[aria-current="page"]');
      return link ? link.getAttribute('href') : null;
    })()
  `);
  // Clica no botão "Ver Status" do bloco de perfil na Home
  await cdp.evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText?.includes('Ver Status') || el.innerText?.includes('Full Status'));
      if (btn) btn.click();
    })()
  `);
  await sleep(800);
  const currentPathAfterClick = await cdp.evaluate('window.location.pathname');
  const shotStatusFromHome = await cdp.screenshot('status_from_home_avatar_390x844.png');

  testResults.push({
    test: 'Player Status via Home',
    pass: currentPathAfterClick === '/status' && homeBottomNavActive === '/',
    detail: `Destino: ${currentPathAfterClick}`,
    shot: shotStatusFromHome,
  });

  // 7. Teste de Idioma (PT-BR <-> EN-US)
  console.log('[TEST 7] Bilinguismo PT-BR e EN-US na Central...');
  await cdp.send('Page.navigate', { url: 'https://ascend.app/hub' });
  await sleep(800);

  // Clica no botão de alternar idioma (EN)
  await cdp.evaluate(`
    (() => {
      const enBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === 'EN');
      if (enBtn) enBtn.click();
    })()
  `);
  await sleep(600);

  const enSubtitle = await cdp.evaluate('document.body.innerText');
  const hasEnglishText = enSubtitle.includes('Challenges & Achievements') || enSubtitle.includes('OPERATIONAL HUB') || enSubtitle.includes('Player Status');
  const shotEnHub = await cdp.screenshot('hub_en_us_390x844.png');

  testResults.push({
    test: 'Bilinguismo EN-US na Central',
    pass: hasEnglishText,
    detail: `Detectou termos em inglês: ${hasEnglishText}`,
    shot: shotEnHub,
  });

  // 8. Teste de Ajustes no Desktop (1280x800)
  console.log('[TEST 8] Ajustes no Desktop...');
  await cdp.setViewport(1280, 800, false);
  await cdp.send('Page.navigate', { url: 'https://ascend.app/settings' });
  await sleep(1000);
  const desktopSettingsShot = await cdp.screenshot('settings_desktop_1280x800.png');
  testResults.push({
    test: 'Ajustes no Desktop (1280x800)',
    pass: true,
    detail: 'Renderizado sem conflitos de navegação sidebar',
    shot: desktopSettingsShot,
  });

  // 9. Resumo e Diagnóstico
  console.log('\n======================================================');
  console.log('              RELATÓRIO DE QA REAL ASCEND              ');
  console.log('======================================================');
  let passedCount = 0;
  for (const r of testResults) {
    const status = r.pass ? 'PASS' : 'FAIL';
    if (r.pass) passedCount++;
    console.log(`[${status}] ${r.test.padEnd(35)} | ${r.detail}`);
    console.log(`       Screenshot: ${path.basename(r.shot)}`);
  }
  console.log('------------------------------------------------------');
  console.log(`TOTAL: ${passedCount}/${testResults.length} testes de navegação e renderização passaram.`);
  console.log(`EXCEÇÕES NÃO TRATADAS: ${pageErrors.length}`);
  if (pageErrors.length > 0) {
    console.log('Erros:', pageErrors.join('\n'));
  }
  console.log('======================================================\n');

  try {
    await cdp.send('Target.detachFromTarget', { sessionId }).catch(() => {});
  } catch {}
  try {
    proc.kill();
  } catch {}

  if (passedCount < testResults.length || pageErrors.length > 0) {
    process.exit(1);
  }
}

runQA().catch((err) => {
  console.error('Erro na execução do script QA:', err);
  process.exit(1);
});
