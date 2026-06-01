const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Single line replacements `const { a, b: c } = useStore();`
  content = content.replace(/const\s+\{\s*([^}]+)\s*\}\s*=\s*useStore\(\);/g, (match, inner) => {
    // split by comma, ignoring whitespace
    const variables = inner.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const statements = variables.map(v => {
      if (v.includes(':')) {
        const [original, alias] = v.split(':').map(s => s.trim());
        return `const ${alias} = useStore(state => state.${original});`;
      } else {
        return `const ${v} = useStore(state => state.${v});`;
      }
    });
    return statements.join('\n  ');
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
