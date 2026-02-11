import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import perfectionist from 'eslint-plugin-perfectionist';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { rules: { 'import/order': 'off' } },
  perfectionist.configs['recommended-natural'],
  {
    files: ['**/*.{tsx,jsx}'],
    plugins: { 'better-tailwindcss': betterTailwindcss },
    rules: { ...betterTailwindcss.configs['recommended-warn'].rules },
    settings: { 'better-tailwindcss': { entryPoint: 'src/app/globals.css' } },
  },
  eslintConfigPrettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'node_modules/**']),
]);
