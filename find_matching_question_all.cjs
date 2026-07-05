const fs = require('fs');
const content = fs.readFileSync('./src/App.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 4750; i >= 3000; i--) {
  const line = lines[i - 1];
  if (line.includes('? (') || line.includes('&& (') || line.includes('===') || line.includes(') : (') || line.includes(') ? (')) {
    console.log(`${i}: ${line.trim()}`);
  }
}
