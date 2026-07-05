const fs = require('fs');
const lines = fs.readFileSync('./src/App.tsx', 'utf8').split('\n');
for (let i = 4210; i <= 4230; i++) {
  console.log(`${i}: ${lines[i - 1]}`);
}
