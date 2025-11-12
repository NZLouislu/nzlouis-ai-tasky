import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  transform: {
    // Use SWC to process JSX and TypeScript files
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  // Add file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverageFrom: [
    "components/**/*.{ts,tsx}",
    "!components/**/*.stories.{ts,tsx}",
    "!components/**/*.d.ts",
  ],
  transformIgnorePatterns: [
    "/node_modules/(?!(uuid|next-auth|@auth))",
    "^.+\\.module\\.(css|sass|scss)$",
  ],
};

export default config;
