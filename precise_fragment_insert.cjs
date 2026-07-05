const fs = require('fs');
let content = fs.readFileSync('./src/App.tsx', 'utf8');
const lines = content.split('\n');

// Let's find the exact index for line 4784 and line 5029
// We can find them by looking for their exact content.
const startPattern = '                {siteTheme !== "legacy" ? (';
const endPattern = '        ) : (';

let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i] === startPattern) {
    startIndex = i;
  }
  if (lines[i] === endPattern) {
    endIndex = i;
  }
}

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find start/end pattern!", { startIndex, endIndex });
  process.exit(1);
}

console.log(`Found start pattern at line ${startIndex + 1}, end pattern at line ${endIndex + 1}`);

// Insert <> after startPattern
lines.splice(startIndex + 1, 0, "                  <>");

// Since we inserted a line, endIndex is now shifted by 1.
// We want to insert </> before the endPattern, which is now at lines[endIndex + 1]
lines.splice(endIndex + 1, 0, "                  </>");

fs.writeFileSync('./src/App.tsx', lines.join('\n'), 'utf8');
console.log("Successfully wrapped the first ternary branch in a React Fragment!");
