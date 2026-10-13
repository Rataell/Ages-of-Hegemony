import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/.next/**', '**/.next-e2e/**', '**/node_modules/**', '**/generated/**', '**/next-env.d.ts', 'docs/audit/evidence/**', 'docs/evidence/**', 'docs/product/mesa-viva/**', 'apps/web/docs/**', '**/.next-*/**', '.omp/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['**/*.ts', '**/*.tsx'], rules: { '@typescript-eslint/no-explicit-any': 'error' } },
  { files: ['scripts/**/*.mjs'], languageOptions: { globals: { process: 'readonly', console: 'readonly', URL: 'readonly', fetch: 'readonly', AbortSignal: 'readonly' } } },
  {
    files: ['apps/web/app/play/**/*.ts', 'apps/web/app/play/**/*.tsx', 'apps/web/app/alpha/**/*.ts', 'apps/web/app/alpha/**/*.tsx'],
    rules: { 'no-restricted-imports': ['error', { patterns: ['@aoh/game-engine', '@aoh/game-engine/*', '@prisma/*', 'node:*'] }] }
  },
  {
    files: ['packages/game-engine/src/**/*.ts', 'packages/game-domain/src/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['react', 'react/*', 'next', 'next/*', '@prisma/*', 'node:*', '@aoh/server', '@aoh/web'] }],
      'no-restricted-syntax': ['error',
        { selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']", message: 'Use the seeded RNG.' },
        { selector: "NewExpression[callee.name='Date']", message: 'Time must be explicit input.' },
        { selector: "CallExpression[callee.object.name='Date']", message: 'Time must be explicit input.' }
      ]
    }
  }
);
