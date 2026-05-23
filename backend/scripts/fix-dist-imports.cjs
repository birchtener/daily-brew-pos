const fs = require('fs');
const path = require('path');

const distRoot = path.join(__dirname, '..', 'dist');
const targetExtensions = new Set(['.js', '.mjs', '.cjs', '.json']);

function shouldRewrite(specifier) {
  if (!specifier.startsWith('.')) return false;
  if (specifier.endsWith('/')) return true;
  return !targetExtensions.has(path.extname(specifier));
}

function rewriteSpecifier(specifier) {
  return shouldRewrite(specifier) ? `${specifier}.js` : specifier;
}

function rewriteFileContent(content) {
  const staticImportExportPattern = /(from\s+['"])(\.{1,2}\/[^'"]+?)(['"])/g;
  const dynamicImportPattern = /(import\(\s*['"])(\.{1,2}\/[^'"]+?)(['"]\s*\))/g;

  return content
    .replace(staticImportExportPattern, (match, prefix, specifier, suffix) => `${prefix}${rewriteSpecifier(specifier)}${suffix}`)
    .replace(dynamicImportPattern, (match, prefix, specifier, suffix) => `${prefix}${rewriteSpecifier(specifier)}${suffix}`);
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.js')) {
      continue;
    }

    const original = fs.readFileSync(fullPath, 'utf8');
    const updated = rewriteFileContent(original);

    if (updated !== original) {
      fs.writeFileSync(fullPath, updated, 'utf8');
    }
  }
}

if (fs.existsSync(distRoot)) {
  walk(distRoot);
}
