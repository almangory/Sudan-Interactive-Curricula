const fs = require('fs');
const content = fs.readFileSync('./src/App.tsx', 'utf8');

const lines = content.split('\n');
console.log("Analyzing children inside <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6\">...");
let index = 0;
for (let i = 4319; i < 5035; i++) {
  const line = lines[i];
  if (!line) continue;
  const match = line.match(/^ {12}(<[a-zA-Z0-9\.]+|\{[^/*])/);
  if (match) {
    index++;
    console.log(`Node #${index} at line ${i+1}: ${line.trim().slice(0, 140)}`);
  }
}
