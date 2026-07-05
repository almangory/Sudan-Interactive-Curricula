const fs = require('fs');
const lines = fs.readFileSync('./src/App.tsx', 'utf8').split('\n');
console.log('--- LINE 4800 to 4880 ---');
for (let i = 4800; i <= 4880; i++) {
  console.log(`${i}: ${lines[i - 1]}`);
}
console.log('--- LINE 4980 to 5030 ---');
for (let i = 4980; i <= 5035; i++) {
  console.log(`${i}: ${lines[i - 1]}`);
}
