const fs = require('fs');
const lines = fs.readFileSync('./src/App.tsx', 'utf8').split('\n');
for (let i = 3302; i <= 4230; i++) {
  const line = lines[i - 1];
  if (line.includes(') : (') || line.includes(') :')) {
    console.log(`${i}: ${line.trim()}`);
  }
}
