const fs = require('fs');
let content = fs.readFileSync('./src/App.tsx', 'utf8');
const lines = content.split('\n');

// Find where siteTheme !== "legacy" ? ( is located
let targetIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('siteTheme !== "legacy" ? (')) {
    targetIdx = i;
    break;
  }
}

if (targetIdx === -1) {
  console.error("Could not find ternary start!");
  process.exit(1);
}

// Insert <> after the ternary start line
lines.splice(targetIdx + 1, 0, "                  <>");

// Find where the ) : ( is located (adjusting index by 1)
let elseIdx = -1;
for (let i = targetIdx + 2; i < lines.length; i++) {
  if (lines[i].includes(') : (')) {
    elseIdx = i;
    break;
  }
}

if (elseIdx === -1) {
  console.error("Could not find else branch!");
  process.exit(1);
}

// Insert </> before the ) : ( line
lines.splice(elseIdx, 0, "                  </>");

const newContent = lines.join('\n');

// Let's run a bracket balance check
let curly = 0;
let round = 0;
let square = 0;
const splitLines = newContent.split('\n');
for (let idx = 0; idx < splitLines.length; idx++) {
  for (let i = 0; i < splitLines[idx].length; i++) {
    const c = splitLines[idx][i];
    if (c === '{') curly++;
    else if (c === '}') curly--;
    else if (c === '(') round++;
    else if (c === ')') round--;
    else if (c === '[') square++;
    else if (c === ']') square--;
  }
}
console.log(`FRAGMENT SIMULATION FINAL BALANCE: curly=${curly} round=${round} square=${square}`);
fs.writeFileSync('./src/App.tsx.simulated', newContent, 'utf8');
