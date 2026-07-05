const fs = require('fs');
const content = fs.readFileSync('./src/App.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('<header') || line.includes('Header') || line.includes('header')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
