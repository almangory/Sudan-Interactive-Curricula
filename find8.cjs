const fs = require('fs');
const lines = fs.readFileSync('./src/App.tsx', 'utf8').split('\n');
for (let i = 3410; i <= 3430; i++) {
  console.log(`${i}: ${lines[i - 1]}`);
}
