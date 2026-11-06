import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<!DOCTYPE html><html><body style="background:#0b0b0f;color:#00ffff;"><h1>SERVER TEST REACHABLE</h1></body></html>');
});

const PORT = 4199;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server listening on ${PORT}`);
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const outFile = path.resolve('.tmp', 'server_test.png');
  const cmd = `"${chromePath}" --headless --no-sandbox --disable-gpu --screenshot="${outFile}" "http://127.0.0.1:${PORT}/"`;
  try {
    execSync(cmd, { stdio: 'inherit', timeout: 8000 });
    console.log('Capture success! Size:', fs.statSync(outFile).size);
  } catch (err) {
    console.error('Capture error:', err.message);
  } finally {
    server.close();
  }
});
