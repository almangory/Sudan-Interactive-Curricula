const fs = require('fs');
const content = fs.readFileSync('./src/App.tsx', 'utf8');
const lines = content.split('\n');

let curly = 0;
let round = 0;
let square = 0;

for (let idx = 0; idx < lines.length; idx++) {
  const lineNum = idx + 1;
  const line = lines[idx];
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '{') curly++;
    else if (c === '}') curly--;
    else if (c === '(') round++;
    else if (c === ')') round--;
    else if (c === '[') square++;
    else if (c === ']') square--;
  }
  if (lineNum >= 4200 && lineNum <= 5050) {
    console.log(`Line ${lineNum}: curly=${curly} round=${round} square=${square} | ${line.trim()}`);
  }
}
