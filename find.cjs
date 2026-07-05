const fs = require('fs');
const lines = fs.readFileSync('./src/App.tsx', 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (line.includes('siteTheme ===') || line.includes('isWarmTheme') || line.includes('<header') || line.includes('</header>')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
