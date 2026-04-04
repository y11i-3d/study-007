// @ts-check
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
const repository = pkg.repository || "";

const [userName, repoName] = repository.replace("github:", "").split("/");
const id = repoName.split("-").pop() || "";
const keywords = pkg.keywords || [];
const displayKeywords = keywords.map((/** @type {string} */ k) => {
  return k
    .split("-")
    .map((/** @type {string} */ s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
});
const title = `${id}: ${displayKeywords.join(", ")}`;

export default defineConfig({
  site: `https://${userName}.github.io`,
  base: `/${repoName}`,

  devToolbar: {
    enabled: false,
  },

  server: {
    host: true,
  },

  vite: {
    plugins: [tailwindcss()],
    define: {
      "import.meta.env.USER_NAME": JSON.stringify(userName),
      "import.meta.env.REPO_NAME": JSON.stringify(repoName),
      "import.meta.env.ID": JSON.stringify(id),
      "import.meta.env.KEYWORDS": JSON.stringify(keywords),
      "import.meta.env.TITLE": JSON.stringify(title),
      "import.meta.env.DESCRIPTION": JSON.stringify(pkg.description),
    },
  },

  integrations: [react()],

  fonts: [
    {
      provider: fontProviders.google(),
      name: "Roboto Condensed",
      cssVariable: "--font-sans",
    },
  ],
});
