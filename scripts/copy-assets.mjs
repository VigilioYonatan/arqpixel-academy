import { copyFileSync, cpSync, existsSync, mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });
copyFileSync('index.html', 'dist/index.html');
cpSync('public/assets', 'dist/assets', { recursive: true });
if (existsSync('public/fonts')) {
  cpSync('public/fonts', 'dist/fonts', { recursive: true });
}
if (existsSync('public/vendor')) {
  cpSync('public/vendor', 'dist/vendor', { recursive: true });
}
cpSync('data', 'dist/data', { recursive: true });
copyFileSync('src/styles.css', 'dist/styles.css');
copyFileSync('public/_headers', 'dist/_headers');
console.log('ARQPIXEL: built dist/ successfully');
