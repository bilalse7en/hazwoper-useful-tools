import nextVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = [
  ...nextVitals,
  prettierConfig,
  {
    plugins: {
      prettier,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];


export default eslintConfig;
