const fs = require('fs');
const content = fs.readFileSync('./src/App.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 4810; i >= 4000; i--) {
  const line = lines[i - 1];
  if (line.includes('selectedStage ? (') || line.includes('selectedStage ?') || line.includes('selectedStage ?')) {
    console.log(`${i}: ${line.trim()}`);
  }
}
