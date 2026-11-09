import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const userDataDir = path.join(rootDir, '.tmp', 'cprof_debug_settings_' + Date.now());
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
}

function buildMockScript() {
  const userId = '00000000-0000-4000-8000-000000000099';
  const nowSec = Math.floor(Date.now() / 1000);
  const todayIso = new Date().toISOString();

  const mockUser = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'tester@ascend.gg',
    email_confirmed_at: todayIso,
    app_metadata: { provider: 'email' },
    user_metadata: { username: 'ShadowHunter' },
    created_at: todayIso,
  };

  const jwtHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const jwtPayload = Buffer.from(
    JSON.stringify({
      aud: 'authenticated',
      exp: nowSec + 86400,
      iat: nowSec,
      sub: userId,
      email: 'tester@ascend.gg',
      role: 'authenticated',
    })
  ).toString('base64url');
  const validJwt = `${jwtHeader}.${jwtPayload}.sig99`;

  const mockSession = {
    access_token: validJwt,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: nowSec + 3600,
    refresh_token: 'fake.refresh',
    user: mockUser,
  };

  return `
    (() => {
      window.localStorage.setItem('ascend_auth_session', JSON.stringify(${JSON.stringify(mockSession)}));
      window.localStorage.setItem('ascend_auth_user', JSON.stringify(${JSON.stringify(mockUser)}));
      window.localStorage.setItem('ascend_auth_storage_source', 'localStorage');
      window.localStorage.setItem(
        'ascend-hunter-storage',
        JSON.stringify({
          state: {
            username: 'ShadowHunter',
            fullName: 'Shadow Hunter',
            hunterClass: 'Warrior',
            level: 7,
            rank: 'C',
            xp: 250,
            xpRequired: 600,
            profileUserId: '${userId}',
            profileLoaded: true,
            profileLoading: false,
            profileError: null,
            stats: { strength: 18, endurance: 15, intelligence: 12, discipline: 16, vitality: 14, wisdom: 12, balance: 14 },
          },
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
            username: 'ShadowHunter',
            full_name: 'Shadow Hunter',
            class: 'Warrior',
            level: 7,
            rank: 'C',
            xp: 250,
            xp_to_next_level: 600,
            strength: 18,
            endurance: 15,
            intelligence: 12,
            discipline: 16,
            vitality: 14,
            wisdom: 12,
            balance: 14
          });
        }
        if (url.includes('/rest/v1/achievements')) return jsonResponse([]);
        if (url.includes('/rest/v1/workout_routines')) return jsonResponse([]);
        if (url.includes('/rest/v1/meal_plans')) return jsonResponse([]);
        if (url.includes('/rest/v1/habits')) return jsonResponse([]);
        if (url.includes('/rest/v1/tasks')) return jsonResponse([]);
        return jsonResponse([]);
      };
    })();
  `;
}

async function run() {
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

  const consoleLogs = [];
  const errors = [];
  cdp.on('Runtime.consoleAPICalled', (p) => {
    consoleLogs.push(`[CONSOLE ${p.type}] ` + p.args.map((a) => a.value ?? a.description).join(' '));
  });
  cdp.on('Runtime.exceptionThrown', (p) => {
    errors.push(`[EXCEPTION] ` + (p.exceptionDetails.exception?.description || p.exceptionDetails.text));
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
    source: buildMockScript(),
  });

  console.log('Navigating directly to https://ascend.app/settings ...');
  await cdp.send('Page.navigate', { url: 'https://ascend.app/settings' });
  await sleep(2500);

  const currentUrl = await cdp.evaluate('window.location.href');
  const headings = await cdp.evaluate('Array.from(document.querySelectorAll("h1, h2, h3")).map(h => h.innerText)');
  const bodySnippet = await cdp.evaluate('document.body.innerText.slice(0, 300)');

  console.log('=== TEST RESULT ===');
  console.log('Current URL:', currentUrl);
  console.log('Headings:', headings);
  console.log('Body snippet:', bodySnippet);
  console.log('Console logs count:', consoleLogs.length);
  if (consoleLogs.length) console.log(consoleLogs.join('\n'));
  console.log('Exceptions count:', errors.length);
  if (errors.length) console.log(errors.join('\n'));

  await cdp.send('Target.detachFromTarget', { sessionId });
  proc.kill('SIGKILL');
  console.log('Done.');
}

run().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
