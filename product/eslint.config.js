// Shared flat config for the whole workspace (ADR-012).
// R2: move into packages/config-eslint when custom rules grow.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

// Money must never go through float parsing (ADR-002, BR-005).
const noFloatMoney = {
  selector: "CallExpression[callee.object.name='Number'][callee.property.name='parseFloat']",
  message: 'Money is integer VND – do not Number.parseFloat (ADR-002).',
};

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.turbo/**',
      // Astro generated types + the booking-form review build (apps/landing-web – gitignored)
      '**/.astro/**',
      'apps/landing-web/dist-booking-preview/**',
      'apps/landing-web/dist-booking-live/**',
      'legacy/**',
      'design/**',
      'docs/**',
      // Playwright output (gitignored)
      'tests/e2e/playwright-report/**',
      'tests/e2e/test-results/**',
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
      'no-restricted-globals': [
        'error',
        { name: 'parseFloat', message: 'Money is integer VND – do not parseFloat (ADR-002).' },
      ],
      'no-restricted-syntax': ['error', noFloatMoney],
    },
  },
  {
    files: ['services/**/*.ts', 'integrations/**/*.ts'],
    // Only the one real Clock implementation may read the system time.
    ignores: ['services/api/src/clock.ts', '**/*.test.ts'],
    rules: {
      // Time only via Clock (ADR-008). Repeats noFloatMoney because this block replaces the option list.
      'no-restricted-syntax': [
        'error',
        noFloatMoney,
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
    // One pg client runs one query at a time: never fan out on a transaction (FB-R2-ARC-BE-S2-13). Use
    // `inSequence` (services/api/src/shared/sequence.ts). Repeats the services rules (this block replaces them).
    files: ['services/api/src/modules/**/*.ts', 'services/api/src/jobs/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        noFloatMoney,
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'Use the injected Clock instead of new Date() (ADR-008).',
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Use the injected Clock instead of Date.now() (ADR-008).',
        },
        {
          selector:
            "CallExpression[callee.object.name='Promise'][callee.property.name=/^(all|allSettled|any|race)$/]",
          message:
            'No parallel queries on one transaction – use inSequence() (FB-R2-ARC-BE-S2-13).',
        },
      ],
    },
  },
  {
    files: ['apps/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    // Accessibility lint (ADR-012, BL 8.3).
    ...jsxA11y.flatConfigs.recommended,
    files: ['apps/**/*.tsx'],
  },
);
