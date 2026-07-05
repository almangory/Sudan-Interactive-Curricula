const fs = require('fs');
const lines = fs.readFileSync('./src/App.tsx', 'utf8').split('\n');
for (let i = 4280; i <= 4450; i++) {
  const line = lines[i - 1];
  if (line.includes('siteTheme') || line.includes('isWarmTheme') || line.includes('&& (')) {
    console.log(`${i}: ${line.trim()}`);
  }
}
