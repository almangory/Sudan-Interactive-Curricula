const fs = require('fs');
const lines = fs.readFileSync('./src/App.tsx', 'utf8').split('\n');
for (let i = 5100; i <= 5150; i++) {
  console.log(`${i}: ${lines[i - 1]}`);
}
