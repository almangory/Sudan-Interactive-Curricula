const fs = require('fs');
let content = fs.readFileSync('./src/App.tsx', 'utf8');
const lines = content.split('\n');

// Line 4785 (index 4784) is "                  <>"
// Line 5912 (index 5911) is "                  </>"
if (lines[4784].trim() === '<>' && lines[5911].trim() === '</>') {
  lines.splice(5911, 1);
  lines.splice(4784, 1);
  fs.writeFileSync('./src/App.tsx', lines.join('\n'), 'utf8');
  console.log("Successfully restored App.tsx!");
} else {
  console.error("Mismatch in expected lines to delete!", {
    line4785: lines[4784],
    line5912: lines[5911]
  });
}
