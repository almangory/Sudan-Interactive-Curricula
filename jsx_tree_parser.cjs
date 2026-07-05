const fs = require('fs');
const content = fs.readFileSync('./src/App.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];

for (let idx = 0; idx < lines.length; idx++) {
  const lineNum = idx + 1;
  const line = lines[idx];
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '{') {
      stack.push({ type: '{', line: lineNum, col: i + 1 });
    } else if (c === '}') {
      if (stack.length > 0) {
        const top = stack.pop();
        if (lineNum >= 5020 && lineNum <= 5035) {
          console.log(`line ${lineNum}: '}' closes '{' opened at line ${top.line}, col ${top.col}`);
        }
      }
    } else if (c === '(') {
      stack.push({ type: '(', line: lineNum, col: i + 1 });
    } else if (c === ')') {
      if (stack.length > 0) {
        const top = stack.pop();
        if (lineNum >= 5020 && lineNum <= 5035) {
          console.log(`line ${lineNum}: ')' closes '(' opened at line ${top.line}, col ${top.col}`);
        }
      }
    }
  }
}
