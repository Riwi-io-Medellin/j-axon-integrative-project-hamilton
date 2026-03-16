const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'src', 'view', 'js', 'runtime-env.js');

const sigamApi = process.env.SIGAM_API || '';

const content = `// Auto-generated at build time. Do not edit manually.
window.__ENV__ = {
  SIGAM_API: ${JSON.stringify(sigamApi)}
};
`;

fs.writeFileSync(outputPath, content, 'utf8');
console.log(`runtime env written to ${outputPath}`);
