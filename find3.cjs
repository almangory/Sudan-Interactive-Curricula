const fs = require('fs');
const lines = fs.readFileSync('./src/App.tsx', 'utf8').split('\n');
for (let i = 3300; i <= 4200; i++) {
  const line = lines[i - 1];
  if (line.includes('siteTheme') || line.includes('<header') || line.includes('isWarmTheme') || line.includes('Navbar') || line.includes('navigation') || line.includes('<nav') || line.includes('</nav>')) {
    console.log(`${i}: ${line.trim()}`);
  }
}
