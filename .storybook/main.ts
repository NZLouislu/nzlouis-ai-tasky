import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import path from "path";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  staticDirs: ["../public"],
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "../src"),
          "@/lib": path.resolve(__dirname, "../src/lib"),
          "@/hooks": path.resolve(__dirname, "../src/hooks"),
          "@/components": path.resolve(__dirname, "../src/components"),
        },
      },
      define: {
        "process.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL),
        "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        "process.env.TASKY_SUPABASE_URL": JSON.stringify(process.env.TASKY_SUPABASE_URL),
        "process.env.TASKY_SUPABASE_ANON_KEY": JSON.stringify(process.env.TASKY_SUPABASE_ANON_KEY),
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
      },
    });
  },
};
export default config;
