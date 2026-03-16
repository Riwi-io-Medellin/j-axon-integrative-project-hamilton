import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.join(__dirname, '..', 'src', 'legacy', 'js', 'runtime-env.js');

const sigamApi = process.env.VITE_SIGAM_API || process.env.SIGAM_API || '';

const content = `// Auto-generated at build time. Do not edit manually.
window.__ENV__ = {
  SIGAM_API: ${JSON.stringify(sigamApi)}
};
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content, 'utf8');
console.log(`runtime env written to ${outputPath}`);
