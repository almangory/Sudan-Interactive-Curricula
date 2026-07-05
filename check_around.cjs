const fs = require('fs');
const lines = fs.readFileSync('./src/App.tsx', 'utf8').split('\n');
console.log('--- LINE 4290 to 4330 ---');
for (let i = 4290; i <= 4330; i++) {
  console.log(`${i}: ${lines[i - 1]}`);
}
console.log('--- LINE 4570 to 4610 ---');
for (let i = 4570; i <= 4610; i++) {
  console.log(`${i}: ${lines[i - 1]}`);
}
