import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const distHtml = fs.readFileSync('dist/index.html', 'utf8');
const distDir = path.resolve('dist').replace(/\\/g, '/');
const modifiedHtml = distHtml.replace('<head>', `<head><base href="file:///${distDir}/">`);
const testFile = path.resolve('.tmp', 'dist_test.html');
fs.mkdirSync('.tmp', { recursive: true });
fs.writeFileSync(testFile, modifiedHtml);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outFile = path.resolve('.tmp', 'dist_capture.png');
const fileUrl = `file:///${testFile.replace(/\\/g, '/')}`;
const cmd = `"${chromePath}" --headless --no-sandbox --disable-gpu --allow-file-access-from-files --window-size=390,844 --screenshot="${outFile}" "${fileUrl}"`;

try {
  execSync(cmd, { stdio: 'inherit', timeout: 8000 });
  console.log('Capture success! Size:', fs.statSync(outFile).size);
} catch (err) {
  console.error('Error:', err.message);
}
