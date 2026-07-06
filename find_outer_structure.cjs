const fs = require('fs');
const content = fs.readFileSync('./src/App.tsx', 'utf8');
const lines = content.split('\n');

// Let's print any tag that is inside the main return block and starts with less indentation
let output = [];
for (let i = 3540; i < 4840; i++) {
  const line = lines[i];
  if (line.match(/^\s{6}<div/)) {
    output.push(`${i+1}: ${line.trim()}`);
  } else if (line.match(/^\s{6}\{/)) {
    output.push(`${i+1}: ${line.trim()}`);
  }
}
console.log(output.join('\n'));
