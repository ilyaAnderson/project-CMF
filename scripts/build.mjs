import { build } from 'esbuild';

await build({
  entryPoints: { storefront: 'src/store/index.tsx', showcase: 'src/showcase/scene.ts' },
  outdir: '.',
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  legalComments: 'eof',
  define: { 'process.env.NODE_ENV': '"production"' },
});
