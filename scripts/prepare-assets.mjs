import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectRoot = process.cwd();
const outDir = resolve(projectRoot, '.deploy-assets');

const includePaths = [
  'index.html',
  'style.css',
  'shared',
  'balloon',
  'vet',
  'goomba',
  'logic',
  'lab',
  'math',
  'password',
  'snake',
  'snow',
  'suggestions'
];

async function main() {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  for (const relPath of includePaths) {
    const src = resolve(projectRoot, relPath);
    const dest = resolve(outDir, relPath);
    await cp(src, dest, { recursive: true });
  }
}

main().catch((error) => {
  console.error('Failed to prepare deploy assets:', error);
  process.exit(1);
});
