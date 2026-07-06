const fs = require('fs');
const content = fs.readFileSync('./src/App.tsx', 'utf8');

const lines = content.split('\n');
console.log("Analyzing children of the siteTheme !== 'legacy' block...");
let index = 0;
for (let i = 4317; i < 5710; i++) {
  const line = lines[i];
  if (!line) continue;
  const match = line.match(/^ {10}(<[a-zA-Z0-9\.]+|\{[^/*])/);
  if (match) {
    index++;
    console.log(`Node #${index} at line ${i+1}: ${line.trim().slice(0, 140)}`);
  }
}
