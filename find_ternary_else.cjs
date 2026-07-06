const fs = require('fs');
const content = fs.readFileSync('./src/App.tsx', 'utf8');

const lines = content.split('\n');
console.log("Searching for siteTheme === 'heritage' ? ternary else...");
for (let i = 3300; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes(') : (') && line.match(/^\s*\) : \(/)) {
    console.log(`Line ${i+1}: ${line}`);
  }
}
