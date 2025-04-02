// scripts/generate-redirects.js
const fs = require('fs');
const path = require('path');

const urls = JSON.parse(fs.readFileSync('urls.json', 'utf8'));
const baseDir = path.join(__dirname, '..', 'go');

for (const [alias, longUrl] of Object.entries(urls)) {
  const aliasDir = path.join(baseDir, alias);
  const indexPath = path.join(aliasDir, 'index.html');

  if (!fs.existsSync(aliasDir)) {
    fs.mkdirSync(aliasDir, { recursive: true });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="refresh" content="0; url=${longUrl}" />
  <meta name="robots" content="noindex">
</head>
<body>
  <p>Redirecting to <a href="${longUrl}">${longUrl}</a>...</p>
</body>
</html>`;

  fs.writeFileSync(indexPath, html, 'utf8');
}
