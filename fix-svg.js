import fs from 'fs';
import path from 'path';

const files = [
  'src/layouts/AppLayout.jsx',
  'src/pages/Dashboard.jsx',
  'src/App.jsx'
];

const replacements = [
  [/stroke-linecap/g, 'strokeLinecap'],
  [/stroke-linejoin/g, 'strokeLinejoin'],
  [/stroke-width/g, 'strokeWidth'],
  [/clip-rule/g, 'clipRule'],
  [/fill-rule/g, 'fillRule']
];

files.forEach(file => {
  const fullPath = path.resolve(file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    replacements.forEach(([regex, replacement]) => {
      content = content.replace(regex, replacement);
    });
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed ${file}`);
  }
});
