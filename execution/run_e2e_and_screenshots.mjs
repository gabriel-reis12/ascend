import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const outDir = path.join(rootDir, '.tmp', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// Static server with SPA fallback
const server = http.createServer((req, res) => {
  let reqPath = req.url?.split('?')[0] || '/';
  let filePath = path.join(distDir, reqPath === '/' ? 'index.html' : reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(500);
    res.end('Error');
  }
});

const PORT = 4199;
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

if (!fs.existsSync(chromePath)) {
  console.error('Chrome executable not found at', chromePath);
  process.exit(1);
}

server.listen(PORT, '127.0.0.1', async () => {
  console.log(`ASCEND SPA Server listening at http://127.0.0.1:${PORT}`);

  const viewports = [
    { name: '320px', width: 320, height: 640 },
    { name: '375px', width: 375, height: 667 },
    { name: '390px', width: 390, height: 844 },
    { name: '430px', width: 430, height: 932 },
    { name: 'desktop_1440px', width: 1440, height: 900 },
  ];

  const routes = [
    { name: 'login', path: '/login', viewports: ['320px', '375px', '390px', '430px', 'desktop_1440px'] },
    { name: 'register', path: '/register', viewports: ['390px'] },
    { name: 'onboarding', path: '/onboarding', viewports: ['390px'] },
    { name: 'home', path: '/', viewports: ['320px', '375px', '390px', '430px', 'desktop_1440px'] },
    { name: 'status', path: '/status', viewports: ['390px', 'desktop_1440px'] },
    { name: 'quests', path: '/quests', viewports: ['390px'] },
    { name: 'workouts', path: '/workouts', viewports: ['390px'] },
    { name: 'nutrition', path: '/nutrition', viewports: ['390px'] },
    { name: 'bosses', path: '/bosses', viewports: ['390px'] },
    { name: 'trophies', path: '/trophies', viewports: ['390px'] },
    { name: 'fortuna', path: '/fortuna', viewports: ['390px'] },
    { name: 'rest', path: '/rest', viewports: ['390px'] },
    { name: 'settings', path: '/settings', viewports: ['390px'] },
  ];

  let totalCaptures = 0;
  let successfulCaptures = 0;

  for (const route of routes) {
    for (const vpName of route.viewports) {
      const vp = viewports.find(v => v.name === vpName);
      if (!vp) continue;

      totalCaptures++;
      const url = `http://127.0.0.1:${PORT}${route.path}`;
      const outFile = path.join(outDir, `${route.name}_${vp.name}.png`);
      const absOut = path.resolve(outFile);

      const cmd = `"${chromePath}" --headless --no-sandbox --disable-gpu --hide-scrollbars --window-size=${vp.width},${vp.height} --screenshot="${absOut}" "${url}"`;

      try {
        execSync(cmd, { stdio: 'pipe', timeout: 10000 });
        if (fs.existsSync(absOut) && fs.statSync(absOut).size > 1000) {
          const sizeKb = Math.round(fs.statSync(absOut).size / 1024);
          console.log(`[PASS] ${route.name.padEnd(12)} @ ${vp.name.padEnd(14)} -> ${path.basename(outFile)} (${sizeKb} KB)`);
          successfulCaptures++;
        } else {
          console.log(`[WARN] ${route.name.padEnd(12)} @ ${vp.name.padEnd(14)} -> Empty or zero-byte file`);
        }
      } catch (err) {
        console.error(`[FAIL] ${route.name.padEnd(12)} @ ${vp.name.padEnd(14)}: ${err.message}`);
      }
    }
  }

  console.log(`\nScreenshot Summary: ${successfulCaptures}/${totalCaptures} captured successfully.`);
  server.close();
  process.exit(0);
});

