const fs = require('fs');
const content = fs.readFileSync('./src/App.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('te                      <h2') || line.includes('text-[9px] te')) {
    console.log(`Line ${idx + 1}: ${line}`);
  }
});
