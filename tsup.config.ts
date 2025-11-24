import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  minify: true,
  treeshake: true,
  external: [
    '@hashgraph/sdk',
    'hedera-agent-kit',
    'ethers',
    'zod',
    'dotenv'
  ],
  banner: {
    js: '/* Hedera Chainlink Agent Kit Plugin v2.0.0 */',
  },
});