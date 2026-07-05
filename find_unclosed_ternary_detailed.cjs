const fs = require('fs');
const content = fs.readFileSync('./src/App.tsx', 'utf8');
const lines = content.split('\n');

let braceStack = [];
for (let idx = 0; idx < lines.length; idx++) {
  const lineNum = idx + 1;
  const line = lines[idx];
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '{') {
      braceStack.push({ line: lineNum, col: i + 1, hasTernary: false, hasColon: false });
    } else if (c === '}') {
      if (braceStack.length > 0) {
        const top = braceStack.pop();
        if (top.hasTernary && !top.hasColon) {
          console.log(`Unmatched ternary inside { } opened at line ${top.line}, col ${top.col}`);
        }
      }
    } else if (c === '?') {
      // Check if we are inside an expression (simple check: top of stack)
      if (braceStack.length > 0) {
        // Skip some common non-JSX ternary like string templates if any
        braceStack[braceStack.length - 1].hasTernary = true;
      }
    } else if (c === ':') {
      if (braceStack.length > 0) {
        braceStack[braceStack.length - 1].hasColon = true;
      }
    }
  }
}
console.log("Check complete.");
