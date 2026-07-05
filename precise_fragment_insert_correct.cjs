const fs = require('fs');
let content = fs.readFileSync('./src/App.tsx', 'utf8');
const lines = content.split('\n');

const startPattern = '                {siteTheme !== "legacy" ? (';
const endPattern = '        ) : (';

let startIndex = -1;
let endIndex = -1;

// Find the start index
for (let i = 0; i < lines.length; i++) {
  if (lines[i] === startPattern) {
    startIndex = i;
    break;
  }
}

if (startIndex === -1) {
  console.error("Could not find start pattern!");
  process.exit(1);
}

// Find the first end pattern after the start pattern
for (let i = startIndex + 1; i < lines.length; i++) {
  if (lines[i] === endPattern) {
    endIndex = i;
    break;
  }
}

if (endIndex === -1) {
  console.error("Could not find end pattern!");
  process.exit(1);
}

console.log(`Inserting: start line ${startIndex + 1}, end line ${endIndex + 1}`);

// Insert <> after startPattern
lines.splice(startIndex + 1, 0, "                  <>");

// Since we inserted <> at startIndex + 1, endIndex has shifted by 1.
// We want to insert </> before the end pattern (which is now at endIndex + 1)
lines.splice(endIndex + 1, 0, "                  </>");

fs.writeFileSync('./src/App.tsx', lines.join('\n'), 'utf8');
console.log("Successfully wrapped ternary branch in React Fragment!");
