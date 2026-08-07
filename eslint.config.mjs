// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  {
    // The playables have their own toolchain and their own AGENTS.md rules;
    // linting them with the Nuxt/Vue config only produces noise.
    ignores: ["playables/**"],
  },
  {
    // `games/` is a second Nuxt app. This config is generated from the root
    // project, so it doesn't know that games has pages and layouts of its own —
    // without this the single-word filename rule misfires on every one of them.
    files: ["games/app/pages/**/*.vue", "games/app/layouts/**/*.vue"],
    rules: { "vue/multi-word-component-names": "off" },
  },
);
