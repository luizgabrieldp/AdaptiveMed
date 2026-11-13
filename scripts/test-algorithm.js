// Runner para a suite TypeScript real em scripts/test-algorithm.ts
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const rootDir = path.resolve(__dirname, '..');
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'adaptivemed-test-'));

try {
  const tscBin = path.join(rootDir, 'node_modules', '.bin', 'tsc');
  const tmpTsConfigPath = path.join(outDir, 'tsconfig.test.json');
  fs.writeFileSync(
    tmpTsConfigPath,
    JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
        skipLibCheck: true,
        strict: true,
        outDir,
        rootDir,
        baseUrl: rootDir,
        typeRoots: [path.join(rootDir, 'node_modules', '@types')],
        types: ['node'],
        paths: {
          '@/*': ['src/*'],
        },
      },
      include: [path.join(rootDir, 'scripts', 'test-algorithm.ts')],
    })
  );

  execFileSync(tscBin, ['-p', tmpTsConfigPath], { stdio: 'inherit' });

  // Rewrite '@/' imports in compiled JS to relative paths
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.js')) {
        let code = fs.readFileSync(full, 'utf8');
        const rel = path.relative(path.dirname(full), path.join(outDir, 'src')) || '.';
        code = code.replace(/require\("@\/([^"]+)"\)/g, (_, p) => {
          const target = path.join(rel, p).replace(/\\/g, '/');
          return `require("${target.startsWith('.') ? target : './' + target}")`;
        });
        fs.writeFileSync(full, code);
      }
    }
  };
  walk(outDir);

  execFileSync(process.execPath, [path.join(outDir, 'scripts', 'test-algorithm.js')], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_PATH: path.join(rootDir, 'node_modules'),
    },
  });
} finally {
  fs.rmSync(outDir, { recursive: true, force: true });
}
