import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const outDir = path.join(rootDir, '.tmp', 'screenshots', '048');
const userDataDir = path.join(rootDir, '.tmp', 'cprof_pipe_' + Date.now());
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(userDataDir, { recursive: true });

// Remove temporary test files if present
for (const tmp of ['.tmp/check_hist.mjs', '.tmp/test_hist.html']) {
  const p = path.join(rootDir, tmp);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

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
        } catch {
          // ignore malformed frame
        }
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
  const userId = '00000000-0000-4000-8000-000000000048';
  const nowSec = Math.floor(Date.now() / 1000);
  const todayIso = new Date().toISOString();
  const todayDate = todayIso.slice(0, 10);
  const todayDow = new Date().getDay();

  const mockUser = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'hunter048@ascend.gg',
    email_confirmed_at: todayIso,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { username: 'KaelenVex' },
    created_at: todayIso,
  };

  const jwtHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const jwtPayload = Buffer.from(
    JSON.stringify({
      aud: 'authenticated',
      exp: nowSec + 86400,
      iat: nowSec,
      sub: userId,
      email: 'hunter048@ascend.gg',
      role: 'authenticated',
    })
  ).toString('base64url');
  const validJwt = `${jwtHeader}.${jwtPayload}.sig048`;

  const mockSession = {
    access_token: validJwt,
    token_type: 'bearer',
    expires_in: 86400,
    expires_at: nowSec + 86400,
    refresh_token: 'mock-refresh-048',
    user: mockUser,
  };

  return `
    (() => {
      const USER_ID = ${JSON.stringify(userId)};
      const TODAY_DATE = ${JSON.stringify(todayDate)};
      const TODAY_DOW = ${todayDow};
      const SESSION = ${JSON.stringify(mockSession)};
      const params = new URLSearchParams(window.location.search);
      const scenario = params.get('audit_scenario') || 'default';
      const isUnauth = scenario === 'unauth_login';
      const isOnboarding = scenario === 'journey_a_onboarding';

      if (!window.__ascendMockDb) {
        window.__ascendMockDb = {
          profile: {
            id: USER_ID,
            username: 'KaelenVex',
            full_name: 'Kaelen Vex',
            class: isOnboarding ? null : 'Warrior',
            level: scenario === 'feedback_rankup' ? 5 : 4,
            xp: 180,
            xp_gained_today: 40,
            rank: scenario === 'feedback_rankup' ? 'D' : 'E',
            strength: 16,
            endurance: 14,
            intelligence: 12,
            discipline: 15,
            vitality: 14,
            wisdom: 11,
            balance: 12,
            current_streak: 5,
            best_streak: 9,
            weight_current: 76,
            weight_target: 74,
            height: 178,
            main_goal: 'muscle_gain',
            training_focus: 'hypertrophy',
            nutrition_goal: 'high_protein',
            experience_level: 'intermediate',
            active_title: 'Caçador Desperto',
            is_public: true,
          },
          habits: [
            {
              id: 'hab-water-1',
              user_id: USER_ID,
              title: 'Hidratação Tática (2.5L Água)',
              category: 'Saúde',
              category_color: '#00F0FF',
              xp_reward: 20,
              stat_target: 'vitality',
              stat_reward: 1,
              streak: 5,
              active: true,
              scheduled_days: [0,1,2,3,4,5,6],
              created_at: ${JSON.stringify(todayIso)},
            },
            {
              id: 'hab-focus-2',
              user_id: USER_ID,
              title: 'Leitura Estratégica (20 min)',
              category: 'Estudo',
              category_color: '#A855F7',
              xp_reward: 25,
              stat_target: 'intelligence',
              stat_reward: 2,
              streak: 3,
              active: true,
              scheduled_days: [0,1,2,3,4,5,6],
              created_at: ${JSON.stringify(todayIso)},
            },
            {
              id: 'hab-mob-3',
              user_id: USER_ID,
              title: 'Mobilidade Articular (10 min)',
              category: 'Treino',
              category_color: '#10B981',
              xp_reward: 15,
              stat_target: 'endurance',
              stat_reward: 1,
              streak: 2,
              active: true,
              scheduled_days: [0,1,2,3,4,5,6],
              created_at: ${JSON.stringify(todayIso)},
            }
          ],
          habit_completions: [],
          tasks: [
            {
              id: 'task-1',
              user_id: USER_ID,
              title: 'Revisar metas da semana no Sistema',
              category: 'Disciplina',
              category_color: '#00F0FF',
              xp_reward: 25,
              stat_target: 'discipline',
              stat_reward: 1,
              completed: false,
              completed_at: null,
              created_at: ${JSON.stringify(todayIso)},
            }
          ],
          exercises: [
            { id: 'ex-1', name: 'Supino Reto com Barra', muscle_group: 'Peito', category: 'Força', calories_per_minute: 8, is_custom: false, created_by: null },
            { id: 'ex-2', name: 'Agachamento Livre', muscle_group: 'Pernas', category: 'Força', calories_per_minute: 10, is_custom: false, created_by: null },
            { id: 'ex-3', name: 'Remada Curvada', muscle_group: 'Costas', category: 'Força', calories_per_minute: 8, is_custom: false, created_by: null }
          ],
          workout_routines: scenario === 'journey_c_rest_day' ? [] : [
            {
              id: 'routine-today-1',
              user_id: USER_ID,
              name: 'Protocolo Força Superior A',
              scheduled_days: [TODAY_DOW],
              scheduled_time: '18:00:00',
              created_at: ${JSON.stringify(todayIso)},
              exercises: [
                {
                  id: 're-1',
                  routine_id: 'routine-today-1',
                  exercise_id: 'ex-1',
                  sets: 3,
                  reps: 10,
                  weight_kg: 60,
                  order_index: 0,
                  exercise: { id: 'ex-1', name: 'Supino Reto com Barra', muscle_group: 'Peito', category: 'Força', calories_per_minute: 8, is_custom: false, created_by: null }
                },
                {
                  id: 're-2',
                  routine_id: 'routine-today-1',
                  exercise_id: 'ex-3',
                  sets: 3,
                  reps: 12,
                  weight_kg: 50,
                  order_index: 1,
                  exercise: { id: 'ex-3', name: 'Remada Curvada', muscle_group: 'Costas', category: 'Força', calories_per_minute: 8, is_custom: false, created_by: null }
                }
              ]
            }
          ],
          routine_completions: [],
          workout_logs: [],
          foods: [
            { id: 'food-1', name: 'Frango Grelhado com Arroz', calories_per_100g: 165, protein_per_100g: 24, carbs_per_100g: 14, fat_per_100g: 3, is_custom: false }
          ],
          food_logs: [
            {
              id: 'flog-1',
              user_id: USER_ID,
              food_id: 'food-1',
              quantity_grams: 350,
              meal_type: 'Almoço',
              logged_at: ${JSON.stringify(todayIso)},
              food: { id: 'food-1', name: 'Frango Grelhado com Arroz', calories_per_100g: 165, protein_per_100g: 24, carbs_per_100g: 14, fat_per_100g: 3 }
            }
          ],
          meal_plans: [
            {
              id: 'mp-1',
              user_id: USER_ID,
              name: 'Almoço Proteico do Caçador',
              target_calories: 650,
              scheduled_days: [TODAY_DOW],
              meal_plan_items: [
                {
                  id: 'mpi-1',
                  meal_plan_id: 'mp-1',
                  food_id: 'food-1',
                  quantity_grams: 350,
                  food: { id: 'food-1', name: 'Frango Grelhado com Arroz', calories_per_100g: 165, protein_per_100g: 24, carbs_per_100g: 14, fat_per_100g: 3 }
                }
              ]
            }
          ],
          meal_completions: [],
          rest_logs: [],
          boss_battles: [
            {
              id: 'boss-1',
              user_id: USER_ID,
              boss_id: 'boss_01',
              name: 'O Senhor da Procrastinação',
              title_reward: 'Executor Implacável',
              max_hp: 160,
              current_hp: 110,
              defeated: false,
              started_at: ${JSON.stringify(todayIso)},
              last_attack_at: ${JSON.stringify(todayIso)},
              defeated_at: null,
              expires_at: ${JSON.stringify(new Date(Date.now() + 3 * 86400000).toISOString())},
              status: 'active',
              ended_at: null
            }
          ]
        };
      }

      if (!isUnauth) {
        window.localStorage.setItem('ascend-auth-token', JSON.stringify(SESSION));
        window.localStorage.setItem('ascend_tour_completed', 'true');
        window.localStorage.setItem(
          'hunter-storage',
          JSON.stringify({
            state: {
              level: scenario === 'feedback_rankup' ? 5 : 4,
              xp: 180,
              xpRequired: 250,
              rank: scenario === 'feedback_rankup' ? 'D' : 'E',
              hunterClass: isOnboarding ? null : 'Warrior',
              username: 'KaelenVex',
              fullName: 'Kaelen Vex',
              weightCurrent: 76,
              weightTarget: 74,
              height: 178,
              mainGoal: 'muscle_gain',
              trainingFocus: 'hypertrophy',
              nutritionGoal: 'high_protein',
              experienceLevel: 'intermediate',
              activeTitle: 'Caçador Desperto',
              pendingLevelUp: scenario === 'feedback_rankup' ? 5 : null,
              pendingRankUp: scenario === 'feedback_rankup' ? { previousRank: 'E', newRank: 'D', newLevel: 5 } : null,
              stats: { strength: 16, endurance: 14, intelligence: 12, discipline: 15, vitality: 14, wisdom: 11, balance: 12 },
              streak: { current: 5, best: 9 },
              profileUserId: USER_ID,
              profileLoaded: true,
              profileLoading: false,
              profileError: null,
            },
            version: 0,
          })
        );
      } else {
        window.localStorage.clear();
      }

      if (scenario === 'journey_d_return_resume') {
        window.localStorage.setItem(
          'ascend_active_workout_' + USER_ID,
          JSON.stringify({
            routineId: 'routine-today-1',
            routineName: 'Protocolo Força Superior A',
            updatedAt: Date.now(),
          })
        );
      }

      const origFetch = window.fetch.bind(window);
      window.fetch = async (input, init = {}) => {
        const url = typeof input === 'string' ? input : input.url;
        if (!url.includes('supabase.co')) {
          return origFetch(input, init);
        }

        const method = (init.method || 'GET').toUpperCase();
        const db = window.__ascendMockDb;
        const jsonResponse = (data, status = 200) =>
          new Response(JSON.stringify(data), {
            status,
            headers: { 'Content-Type': 'application/json' },
          });

        if (url.includes('/auth/v1/user')) {
          return isUnauth ? jsonResponse({ error: 'unauthorized' }, 401) : jsonResponse(SESSION.user);
        }
        if (url.includes('/auth/v1/token') || url.includes('/auth/v1/signup')) {
          return jsonResponse(SESSION);
        }
        if (url.includes('/rest/v1/rpc/delete_own_account')) {
          return jsonResponse(true);
        }
        if (url.includes('/rest/v1/profiles')) {
          if (url.includes('Accept=application/vnd.pgrst.object') || (init.headers && JSON.stringify(init.headers).includes('vnd.pgrst.object'))) {
            return jsonResponse(db.profile);
          }
          return jsonResponse([db.profile]);
        }
        if (url.includes('/rest/v1/habits')) return jsonResponse(db.habits);
        if (url.includes('/rest/v1/habit_completions')) {
          if (method === 'POST') {
            const entry = { id: 'hc-' + Date.now(), completed_date: TODAY_DATE, ...JSON.parse(init.body || '{}') };
            db.habit_completions.push(entry);
            return jsonResponse(entry);
          }
          return jsonResponse(db.habit_completions);
        }
        if (url.includes('/rest/v1/tasks')) return jsonResponse(db.tasks);
        if (url.includes('/rest/v1/workout_routines')) return jsonResponse(db.workout_routines);
        if (url.includes('/rest/v1/routine_exercises')) return jsonResponse(db.workout_routines.flatMap(r => r.exercises || []));
        if (url.includes('/rest/v1/exercises')) return jsonResponse(db.exercises);
        if (url.includes('/rest/v1/routine_completions')) return jsonResponse(db.routine_completions);
        if (url.includes('/rest/v1/workout_logs')) return jsonResponse(db.workout_logs);
        if (url.includes('/rest/v1/food_logs')) {
          if (method === 'POST') {
            const entry = { id: 'fl-' + Date.now(), logged_at: new Date().toISOString(), food: db.foods[0], ...JSON.parse(init.body || '{}') };
            db.food_logs.unshift(entry);
            return jsonResponse(entry);
          }
          return jsonResponse(db.food_logs);
        }
        if (url.includes('/rest/v1/foods')) return jsonResponse(db.foods);
        if (url.includes('/rest/v1/meal_plans')) return jsonResponse(db.meal_plans);
        if (url.includes('/rest/v1/meal_completions')) return jsonResponse(db.meal_completions);
        if (url.includes('/rest/v1/rest_logs')) {
          if (method === 'POST') {
            const entry = { id: 'rl-' + Date.now(), logged_at: new Date().toISOString(), ...JSON.parse(init.body || '{}') };
            db.rest_logs.unshift(entry);
            return jsonResponse(entry);
          }
          return jsonResponse(db.rest_logs);
        }
        if (url.includes('/rest/v1/boss_battles')) return jsonResponse(db.boss_battles);
        return jsonResponse([]);
      };
    })();
  `;
}

async function runAudit() {
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

  // Attach to the page target
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

  cdp.on('Runtime.exceptionThrown', (params) => {
    console.error('[PAGE EXCEPTION]', params.exceptionDetails?.text, params.exceptionDetails?.exception?.description);
  });
  cdp.on('Runtime.consoleAPICalled', (params) => {
    if (params.type === 'error' || params.type === 'warning') {
      console.log(`[PAGE ${params.type.toUpperCase()}]`, params.args?.map(a => a.value || a.description).join(' '));
    }
  });

  // Intercept all HTTP/HTTPS requests to https://ascend.app/* and serve directly from dist/
  await cdp.send('Fetch.enable', {
    patterns: [{ urlPattern: 'https://ascend.app/*' }, { urlPattern: 'https://fonts.*' }],
  });

  cdp.on('Fetch.requestPaused', async (params) => {
    const reqUrl = params.request.url;
    if (reqUrl.startsWith('https://fonts.')) {
      await cdp
        .send('Fetch.fulfillRequest', {
          requestId: params.requestId,
          responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'text/css' }],
          body: '',
        })
        .catch(() => {});
      return;
    }

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

  const captures = [
    // 1. Responsividade nas 6 resoluções obrigatórias (Seção 9)
    { key: 'home_320x700', path: '/', width: 320, height: 700, mobile: true },
    { key: 'home_375x812', path: '/', width: 375, height: 812, mobile: true },
    { key: 'home_390x844', path: '/', width: 390, height: 844, mobile: true },
    { key: 'home_430x932', path: '/', width: 430, height: 932, mobile: true },
    { key: 'home_tablet_768x1024', path: '/', width: 768, height: 1024, mobile: true },
    { key: 'home_desktop_1280x800', path: '/', width: 1280, height: 800, mobile: false },

    // 2. Jornadas A, B, C, D e Execução (Seções 1, 2, 3, 5, 6, 7)
    { key: 'journey_a_login', path: '/login?audit_scenario=unauth_login', width: 390, height: 844, mobile: true },
    { key: 'journey_a_onboarding', path: '/onboarding?audit_scenario=journey_a_onboarding', width: 390, height: 844, mobile: true },
    { key: 'journey_b_actions', path: '/?audit_scenario=journey_b_actions', width: 390, height: 844, mobile: true, interactive: 'journey_b' },
    { key: 'journey_b_active_workout', path: '/workouts?start=today&routine=routine-today-1', width: 390, height: 844, mobile: true },
    { key: 'journey_b_active_workout_320', path: '/workouts?start=today&routine=routine-today-1', width: 320, height: 700, mobile: true },
    { key: 'journey_c_rest_day', path: '/?audit_scenario=journey_c_rest_day', width: 390, height: 844, mobile: true },
    { key: 'journey_c_focus_modal', path: '/?audit_scenario=journey_c_focus_modal', width: 390, height: 844, mobile: true, interactive: 'journey_c_focus' },
    { key: 'journey_d_return_resume', path: '/?audit_scenario=journey_d_return_resume', width: 390, height: 844, mobile: true },
    { key: 'feedback_rankup', path: '/?audit_scenario=feedback_rankup', width: 390, height: 844, mobile: true },
    { key: 'page_quests_390x844', path: '/quests', width: 390, height: 844, mobile: true },
    { key: 'page_nutrition_390x844', path: '/nutrition', width: 390, height: 844, mobile: true },
    { key: 'page_bosses_390x844', path: '/bosses', width: 390, height: 844, mobile: true },
    { key: 'page_rest_390x844', path: '/rest', width: 390, height: 844, mobile: true },
    { key: 'page_settings_390x844', path: '/settings', width: 390, height: 844, mobile: true },
    { key: 'security_delete_account_390x844', path: '/delete-account', width: 390, height: 844, mobile: true },
  ];

  const collectedTelemetry = {};
  let passed = 0;

  for (const item of captures) {
    await cdp.setViewport(item.width, item.height, item.mobile);
    const t0 = Date.now();
    await cdp.send('Page.navigate', { url: `https://ascend.app${item.path}` });
    await sleep(650);

    let actionSteps = {};
    if (item.interactive === 'journey_b') {
      actionSteps = await cdp.evaluate(`(async () => {
        const tStart = performance.now();
        const steps = {};
        const btns = Array.from(document.querySelectorAll('#tour-portal-recommended button'));
        const completeBtn = btns.find(b => b.innerText.includes('Concluir') || b.innerText.includes('Complete'));
        if (completeBtn) {
          completeBtn.click();
          steps.habitCompletedOneTap = true;
        }
        const waterBtn = btns.find(b => b.innerText.includes('+250ml'));
        if (waterBtn) {
          waterBtn.click();
          steps.waterAddedOneTap = true;
        }
        const sleepBtn = document.querySelector('button[aria-label*="8 horas de sono"], button[aria-label*="8 hours of sleep"]');
        if (sleepBtn) {
          sleepBtn.click();
          steps.sleepLoggedOneTap = true;
        }
        const repeatMealBtn = btns.find(b => b.innerText.includes('Repetir refeição') || b.innerText.includes('Repeat meal'));
        if (repeatMealBtn) {
          repeatMealBtn.click();
          steps.repeatMealModalOpened = true;
        }
        steps.interactionMs = Math.round(performance.now() - tStart);
        return steps;
      })()`);
      await sleep(300);
    } else if (item.interactive === 'journey_c_focus') {
      actionSteps = await cdp.evaluate(`(() => {
        const btns = Array.from(document.querySelectorAll('#tour-portal-recommended button'));
        const focusBtn = btns.find(b => b.innerText.includes('Iniciar') && b.closest('div')?.innerText.includes('Foco'));
        if (focusBtn) {
          focusBtn.click();
          return { guidedFocusOpenedOneTap: true };
        }
        return { guidedFocusOpenedOneTap: false };
      })()`);
      await sleep(300);
    }

    const elapsedMs = Date.now() - t0;

    const tel = await cdp.evaluate(`(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource');
      const jsChunks = resources
        .filter(r => r.name.endsWith('.js'))
        .map(r => ({
          name: r.name.split('/').pop(),
          durationMs: Math.round(r.duration),
        }));
      const actionCenter = document.getElementById('tour-portal-recommended');
      const actionRect = actionCenter ? actionCenter.getBoundingClientRect() : null;
      const setButtons = Array.from(document.querySelectorAll('button[aria-label*="Concluir série"], button[aria-label*="Complete set"]'));
      const firstSetRect = setButtons[0] ? setButtons[0].getBoundingClientRect() : null;
      const text = document.body.innerText;

      return {
        pathname: window.location.pathname,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        docScrollWidth: document.documentElement.scrollWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        actionCenterTopPx: actionRect ? Math.round(actionRect.top) : null,
        actionCenterVisibleAboveFold: actionRect ? actionRect.top < window.innerHeight : false,
        setButtonTouchSize: firstSetRect ? { width: Math.round(firstSetRect.width), height: Math.round(firstSetRect.height) } : null,
        domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
        loadEventEndMs: nav ? Math.round(nav.loadEventEnd) : null,
        jsChunksCount: jsChunks.length,
        jsChunks,
        memoryMB: performance.memory ? Number((performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2)) : null,
        hasContextualWorkoutReady: text.includes('Seu treino de hoje está pronto') || text.includes('Your workout for today is ready'),
        hasContextualNextMission: text.includes('Próxima missão') || text.includes('Next mission'),
        hasQuickMode: text.includes('Modo Rápido') || text.includes('Quick Mode'),
        hasResumeSession: text.includes('Sessão em Andamento') || text.includes('Session in Progress'),
        hasActiveWorkoutHeader: text.includes('SESSÃO DE TREINO ATIVA') || text.includes('ACTIVE WORKOUT SESSION'),
        hasRankUpModal: text.includes('RANK D') || text.includes('NÍVEL 5'),
        bodyTextSample: text.slice(0, 300),
        rootHtmlSample: (document.getElementById('root')?.innerHTML || '').slice(0, 300),
      };
    })()`);

    const outFile = await cdp.screenshot(`${item.key}.png`);
    const sizeKb = Math.round(fs.statSync(outFile).size / 1024);

    collectedTelemetry[item.key] = {
      ...tel,
      usableElapsedMs: elapsedMs,
      screenshotSizeKb: sizeKb,
      actionSteps,
    };

    if (sizeKb > 10) {
      passed++;
      console.log(
        `[PASS] ${item.key.padEnd(32)} (${tel.viewport.width}x${tel.viewport.height}) -> ${String(sizeKb).padStart(4)} KB in ${elapsedMs}ms | overflow=${tel.hasHorizontalOverflow} | aboveFold=${tel.actionCenterVisibleAboveFold} (top=${tel.actionCenterTopPx}px) | chunks=${tel.jsChunksCount}`
      );
    } else {
      console.error(`[WARN] ${item.key}: small screenshot (${sizeKb} KB)`);
    }
  }

  const reportPath = path.join(outDir, 'audit_report_048.json');
  fs.writeFileSync(reportPath, JSON.stringify(collectedTelemetry, null, 2));
  console.log(`\nCaptured ${passed}/${captures.length} real screenshots & telemetry in ${outDir}`);
  proc.kill();
  await sleep(400);
  try {
    const tmpRoot = path.join(rootDir, '.tmp');
    for (const entry of fs.readdirSync(tmpRoot)) {
      if (entry.startsWith('cprof_')) {
        fs.rmSync(path.join(tmpRoot, entry), { recursive: true, force: true });
      }
    }
  } catch {
    // ignore cleanup error
  }
  process.exit(passed === captures.length ? 0 : 1);
}

runAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
