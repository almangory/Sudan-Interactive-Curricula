const fs = require('fs');
let content = fs.readFileSync('./src/App.tsx', 'utf8');
const lines = content.split('\n');

// We insert "{siteTheme !== 'legacy' ? (" as line 4783 (0-indexed 4782)
lines.splice(4782, 0, "               {siteTheme !== 'legacy' ? (");

const newContent = lines.join('\n');

let curly = 0;
let round = 0;
let square = 0;

const splitLines = newContent.split('\n');
for (let idx = 0; idx < splitLines.length; idx++) {
  const lineNum = idx + 1;
  const line = splitLines[idx];
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '{') curly++;
    else if (c === '}') curly--;
    else if (c === '(') round++;
    else if (c === ')') round--;
    else if (c === '[') square++;
    else if (c === ']') square--;
  }
}
console.log(`SIMULATED FINAL BALANCE: curly=${curly} round=${round} square=${square}`);
