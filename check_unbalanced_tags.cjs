const fs = require('fs');
const content = fs.readFileSync('./src/App.tsx', 'utf8');
const lines = content.split('\n');

const segment = lines.slice(4317, 4678).join('\n');

// Check parentheses and curly braces balance
let round = 0;
let curly = 0;
let square = 0;

for (let i = 0; i < segment.length; i++) {
  const c = segment[i];
  if (c === '(') round++;
  else if (c === ')') round--;
  else if (c === '{') curly++;
  else if (c === '}') curly--;
  else if (c === '[') square++;
  else if (c === ']') square--;
}

console.log("ROUND BALANCE (should be 0):", round);
console.log("CURLY BALANCE (should be 0):", curly);
console.log("SQUARE BALANCE (should be 0):", square);
