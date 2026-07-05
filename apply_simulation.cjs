const fs = require('fs');
fs.copyFileSync('./src/App.tsx.simulated', './src/App.tsx');
console.log("Successfully applied simulated file to App.tsx!");
