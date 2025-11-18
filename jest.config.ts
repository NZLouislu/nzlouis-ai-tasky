import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  testMatch: ["<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}", "<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
  transform: {
    // Use SWC to process JSX and TypeScript files
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  // Add file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverageFrom: [
    "src/components/**/*.{ts,tsx}",
    "src/lib/**/*.{ts,tsx}",
    "!src/components/**/*.stories.{ts,tsx}",
    "!src/**/*.d.ts",
  ],
  transformIgnorePatterns: [
    "/node_modules/(?!(uuid|next-auth|@auth))",
    "^.+\\.module\\.(css|sass|scss)$",
  ],
};

export default config;
