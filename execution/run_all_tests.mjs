import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const testFiles = fs.readdirSync('execution')
  .filter(f => f.startsWith('test_') && f.endsWith('.mjs'))
  .map(f => path.join('execution', f));

console.log('Total test files found:', testFiles.length);

async function runTests() {
  let passedFiles = 0;
  let failedFiles = 0;
  const failedList = [];

  for (const file of testFiles) {
    const filename = path.basename(file);
    process.stdout.write(`Testing ${filename}... `);
    const code = await new Promise(resolve => {
      const proc = spawn('node', ['--test', file], { stdio: 'ignore' });
      proc.on('close', resolve);
    });

    if (code === 0) {
      console.log('PASS');
      passedFiles++;
    } else {
      console.log('FAIL');
      failedFiles++;
      failedList.push(file);
    }
  }

  console.log('\n=============================================');
  console.log(`SUMMARY: ${passedFiles}/${testFiles.length} suites passed (${failedFiles} failed)`);
  if (failedList.length > 0) {
    console.log('Failed suites:');
    failedList.forEach(f => console.log('  -', f));
  }
  console.log('=============================================\n');
  process.exit(failedFiles > 0 ? 1 : 0);
}

runTests();
