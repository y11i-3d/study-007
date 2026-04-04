import base from "./prettier.config.mjs";

/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  ...base,
  plugins: [
    "prettier-plugin-organize-imports",
    ...(base.plugins ?? []),
    "prettier-plugin-astro-organize-imports",
  ],
};
export default config;
