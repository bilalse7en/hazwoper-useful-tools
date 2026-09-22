import nextVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      '**/.next/**',
      'node_modules/**',
      '**/node_modules/**',
      'public/**',
      '**/public/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
      'out/**',
      'build/**',
      '**/*.min.js',
      'next-env.d.ts',
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  ...nextVitals,
  prettierConfig,
  {
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'off',
      'react-hooks/set-state-in-effect': 'off',
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
];

export default eslintConfig;
