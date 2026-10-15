// Shared flat config for the whole workspace (ADR-012).
// R2: move into packages/config-eslint when custom rules grow.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.turbo/**',
      'legacy/**',
      'design/**',
      'docs/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      // Money must never go through float parsing (ADR-002, BR-005).
      'no-restricted-globals': [
        'error',
        { name: 'parseFloat', message: 'Money is integer VND – do not parseFloat (ADR-002).' },
      ],
    },
  },
  {
    files: ['services/**/*.ts', 'integrations/**/*.ts'],
    ignores: ['**/clock.ts', '**/*.test.ts'],
    rules: {
      // Time only via Clock (ADR-008).
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'Use the injected Clock instead of new Date() (ADR-008).',
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Use the injected Clock instead of Date.now() (ADR-008).',
        },
      ],
    },
  },
  {
    files: ['apps/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
);
