const fs = require('fs');
const content = fs.readFileSync('./src/App.tsx', 'utf8');
const lines = content.split('\n');

// Scan upwards from line 5029
for (let i = 5029; i >= 4000; i--) {
  const line = lines[i - 1];
  if (line.includes('?') || line.includes('&& (') || line.includes('|| (') || line.includes('===')) {
    console.log(`${i}: ${line.trim()}`);
  }
}
