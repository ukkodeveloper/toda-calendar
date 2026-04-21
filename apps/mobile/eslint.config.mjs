import { config as reactConfig } from "@workspace/eslint-config/react-internal"

export default [
  ...reactConfig,
  {
    ignores: [".expo/**", "dist/**", "assets/**"],
    languageOptions: {
      globals: {
        process: "readonly",
      },
    },
  },
]
