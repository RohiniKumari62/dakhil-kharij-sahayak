import fs from 'fs';
import path from 'path';

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;

function checkDir(dir: string, violations: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      checkDir(fullPath, violations);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip single line or block comment lines
        if (
          trimmed.startsWith('//') ||
          trimmed.startsWith('/*') ||
          trimmed.startsWith('*') ||
          trimmed.startsWith('{/*')
        ) {
          continue;
        }

        // Strip inline comments
        const withoutComment = line.replace(/\/\/.*$/, '').replace(/{\/\*.*?\*\/}/g, '');

        if (DEVANAGARI_REGEX.test(withoutComment)) {
          violations.push(`${fullPath}:${i + 1}: ${line.trim()}`);
        }
      }
    }
  }
}

const violations: string[] = [];
checkDir(path.resolve('src/components'), violations);
checkDir(path.resolve('src/app'), violations);

if (violations.length > 0) {
  console.error(`Found ${violations.length} hardcoded Devanagari lines in src/components or src/app:`);
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
} else {
  console.log('PASS: Zero hardcoded Devanagari characters in src/components or src/app.');
  process.exit(0);
}
