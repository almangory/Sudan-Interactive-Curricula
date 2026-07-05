const fs = require('fs');
const content = fs.readFileSync('./src/App.tsx', 'utf8');
const lines = content.split('\n');

let tagStack = [];

for (let idx = 0; idx < lines.length; idx++) {
  const lineNum = idx + 1;
  const line = lines[idx];
  
  // A simple regex to find JSX tags: <Tag ...> or </Tag> or self-closing <Tag />
  // We must be careful to ignore comments and strings, but a simple line-by-line scanner can give us clues.
  const regex = /<\/?([a-zA-Z0-9\.\-]+)(?:\s+[^>]*?)?(\/?)>/g;
  let match;
  while ((match = regex.exec(line)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];
    const isClosing = fullTag.startsWith('</');
    const isSelfClosing = match[2] === '/' || fullTag.endsWith('/>');
    
    // Ignore some common false positives if they are inside comments or strings
    if (line.trim().startsWith('//') || line.trim().startsWith('{/*')) continue;
    
    if (isSelfClosing) {
      continue;
    }
    
    if (isClosing) {
      if (tagStack.length > 0) {
        const top = tagStack.pop();
        if (top.name !== tagName) {
          if (lineNum >= 4750 && lineNum <= 5050) {
            console.log(`Mismatch on line ${lineNum}: closed </${tagName}> but expected </${top.name}> (opened at line ${top.line})`);
          }
        } else {
          if (lineNum >= 4750 && lineNum <= 5050) {
            console.log(`line ${lineNum}: closed </${tagName}> (opened at line ${top.line})`);
          }
        }
      } else {
        if (lineNum >= 4750 && lineNum <= 5050) {
          console.log(`line ${lineNum}: EXTRA closing </${tagName}>`);
        }
      }
    } else {
      tagStack.push({ name: tagName, line: lineNum });
      if (lineNum >= 4750 && lineNum <= 5050) {
        console.log(`line ${lineNum}: opened <${tagName}>`);
      }
    }
  }
}
console.log("Tag check complete.");
