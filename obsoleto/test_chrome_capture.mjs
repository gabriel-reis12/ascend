import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outFile = '.tmp/test_chrome.png';
fs.mkdirSync('.tmp', { recursive: true });

const testHtml = path.resolve('.tmp', 'test.html');
fs.writeFileSync(testHtml, '<!DOCTYPE html><html><body style="background:#0b0b0f;color:#fff;"><h1>ASCEND HOMOLOGATION TEST</h1></body></html>');
const fileUrl = `file:///${testHtml.replace(/\\/g, '/')}`;

try {
  const absOutFile = path.resolve(outFile);
const cmd = `"${chromePath}" --headless --no-sandbox --disable-gpu --screenshot="${absOutFile}" "${fileUrl}"`;
  execSync(cmd, { stdio: 'inherit', timeout: 8000 });
  if (fs.existsSync(outFile)) {
    console.log('Success! File size:', fs.statSync(outFile).size);
  } else {
    console.log('File not created');
  }
} catch (err) {
  console.error('Error running chrome screenshot:', err.message);
}
