import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  // Spread Next.js configs then override react-compiler severity
  ...nextVitals.map(config => {
    if (config?.rules?.["react-compiler/react-compiler"]) {
      return {
        ...config,
        rules: {
          ...config.rules,
          "react-compiler/react-compiler": "warn",
        },
      };
    }
    return config;
  }),
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
  ]),
]);

export default eslintConfig;
