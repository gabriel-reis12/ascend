import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';

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

// Simple static server with SPA fallback
const server = http.createServer((req, res) => {
  let reqPath = req.url?.split('?')[0] || '/';
  let filePath = path.join(distDir, reqPath === '/' ? 'index.html' : reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // SPA fallback
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
    res.end('Error loading file');
  }
});

const PORT = 4199;
server.listen(PORT, '127.0.0.1', async () => {
  console.log(`Static SPA server running at http://127.0.0.1:${PORT}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (!fs.existsSync(chromePath)) {
    console.log('Chrome not found at default location');
    server.close();
    process.exit(0);
  }

  const viewports = [
    { name: 'mobile_320', width: 320, height: 640 },
    { name: 'mobile_390', width: 390, height: 844 },
    { name: 'mobile_430', width: 430, height: 932 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'desktop_1440', width: 1440, height: 900 },
  ];

  const routes = [
    { name: 'home', path: '/' },
    { name: 'status', path: '/status' },
    { name: 'quests', path: '/quests' },
    { name: 'workouts', path: '/workouts' },
    { name: 'nutrition', path: '/nutrition' },
    { name: 'bosses', path: '/bosses' },
  ];

  for (const vp of viewports) {
    for (const route of routes) {
      const url = `http://127.0.0.1:${PORT}${route.path}`;
      const outFile = path.join(outDir, `${route.name}_${vp.name}.png`);
      const cmd = `"${chromePath}" --headless --no-sandbox --disable-gpu --hide-scrollbars --window-size=${vp.width},${vp.height} --screenshot="${outFile}" "${url}"`;
      try {
        const out = execSync(cmd, { stdio: 'pipe', timeout: 8000 });
        if (fs.existsSync(outFile)) {
          console.log(`[✓] Captured ${route.name} at ${vp.name} (${fs.statSync(outFile).size} bytes)`);
        }
      } catch (err) {
        console.warn(`[!] Failed capture for ${route.name} at ${vp.name}: ${err.message}`);
      }
    }
  }

  server.close();
  console.log('Screenshot capture finished.');
  process.exit(0);
});
