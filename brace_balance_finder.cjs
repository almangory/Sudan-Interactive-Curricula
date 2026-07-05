const fs = require('fs');
const content = fs.readFileSync('./src/App.tsx', 'utf8');
const lines = content.split('\n');

let curly = 0;
let round = 0;
let square = 0;

lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  let lineCurlyOpen = 0, lineCurlyClose = 0;
  let lineRoundOpen = 0, lineRoundClose = 0;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '{') { curly++; lineCurlyOpen++; }
    else if (c === '}') { curly--; lineCurlyClose++; }
    else if (c === '(') { round++; lineRoundOpen++; }
    else if (c === ')') { round--; lineRoundClose++; }
    else if (c === '[') square++;
    else if (c === ']') square--;
  }
  if (lineNum >= 5015 && lineNum <= 5040) {
    console.log(`Line ${lineNum}: curly=${curly} round=${round} (open{:${lineCurlyOpen} close}:${lineCurlyClose} open(:${lineRoundOpen} close):${lineRoundClose}) -> [${line}]`);
  }
});

console.log("FINAL BALANCE: curly =", curly, "round =", round, "square =", square);
