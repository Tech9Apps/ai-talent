module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: [
    "/lib/**/*",       // Ignore built files
    "/generated/**/*", // Ignore generated files
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    // Estilo general
    "quotes": ["error", "double"],
    "indent": ["error", 2],

    // Import rules
    "import/no-unresolved": "off",

    // Reglas TS vs ESLint base (evita choques)
    "no-unused-expressions": "off",               // ❌ desactiva core
    "@typescript-eslint/no-unused-expressions": "error", // ✅ activa TS-safe

    // Opcional: reglas útiles de TS
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
    ],
    "@typescript-eslint/explicit-function-return-type": "off", // quítalo si quieres forzar return types
    "@typescript-eslint/no-explicit-any": "warn",              // cámbialo a "error" si no quieres `any`
  },
};
