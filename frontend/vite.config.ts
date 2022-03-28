import path from "path";
import { defineConfig } from "vite";
import Vue from "@vitejs/plugin-vue";
import Pages from "vite-plugin-pages";
import Layouts from "vite-plugin-vue-layouts";
import Icons from "unplugin-icons/vite";
import IconsResolver from "unplugin-icons/resolver";
import Components from "unplugin-vue-components/vite";
import AutoImport from "unplugin-auto-import/vite";
import Markdown from "vite-plugin-md";
import WindiCSS from "vite-plugin-windicss";
import Inspect from "vite-plugin-inspect";

const markdownWrapperClasses =
  "prose md:prose-lg m-auto text-left px-3 pb-500px";

export default defineConfig({
  resolve: {
    alias: {
      "~/": `${path.resolve(__dirname, "src")}/`,
    },
  },
  plugins: [
    Vue({
      include: [/\.vue$/, /\.md$/],
    }),

    // https://github.com/hannoeru/vite-plugin-pages
    Pages({
      extensions: ["vue", "md"],
    }),

    // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
    Layouts(),

    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: ["vue", "vue-router", "@vueuse/head", "@vueuse/core", "vitest"],
      dts: "src/auto-imports.d.ts",
    }),

    // https://github.com/antfu/unplugin-vue-components
    Components({
      // allow auto load markdown components under `./src/components/`
      extensions: ["vue", "md"],

      // allow auto import and register components used in markdown
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],

      // custom resolvers
      resolvers: [
        // auto import icons
        // https://github.com/antfu/unplugin-icons
        IconsResolver({
          prefix: false,
          // enabledCollections: ['carbon']
        }),
      ],

      dts: "src/components.d.ts",
    }),

    // https://github.com/antfu/unplugin-icons
    Icons({
      autoInstall: true,
    }),

    // https://github.com/antfu/vite-plugin-windicss
    WindiCSS({
      safelist: [
        markdownWrapperClasses,
        [...Array(14).keys()].map((i) => `grid-cols-${i + 3}`),
        [...Array(14).keys()].map((i) => `grid-rows-${i + 3}`),
        [...Array(500).keys()].map((i) => `-translate-x-[${i}px]`),
      ],
    }),

    // https://github.com/antfu/vite-plugin-md
    // Don't need this? Try vitesse-lite: https://github.com/antfu/vitesse-lite
    Markdown({
      wrapperClasses: markdownWrapperClasses,
      headEnabled: true,
      markdownItUses: [
        // convert <a> links to <router-link> when possible
        (md: any) => {
          const scan = (state: any) => {
            state.tokens.forEach((tokens: any) => {
              if (tokens.type !== "inline") {
                return;
              }
              const inlineTokens = tokens.children;
              let isRT = false;
              for (let i = 0; i < inlineTokens.length; i++) {
                if (isRT && inlineTokens[i].type === "link_close") {
                  inlineTokens[i].tag = "router-link";
                  isRT = false;
                } else if (inlineTokens[i].type === "link_open") {
                  const attrs = inlineTokens[i].attrs as any;
                  const href = attrs?.find((v: any) => v[0] === "href");
                  if (href && !href[1].startsWith("http")) {
                    inlineTokens[i].tag = "router-link";
                    inlineTokens[i].attrs = [["to", href[1]]];
                    isRT = true;
                  } else {
                    inlineTokens[i].attrs.push(["rel", "noopener noreferrer"]);
                    inlineTokens[i].attrs.push(["target", "_blank"]);
                  }
                }
              }
            });
          };
          md.core.ruler.push("router-link", scan);
        },
      ],
    }),

    // https://github.com/antfu/vite-plugin-inspect
    Inspect({
      // change this to enable inspect for debugging
      enabled: false,
    }),
  ],

  server: {
    fs: {
      strict: true,
    },
  },

  // https://github.com/antfu/vite-ssg
  ssgOptions: {
    script: "async",
    formatting: "minify",
  },

  optimizeDeps: {
    include: ["vue", "vue-router", "@vueuse/core", "@vueuse/head"],
    exclude: ["vue-demi"],
  },

  // https://github.com/vitest-dev/vitest
  test: {
    include: ["test/**/*.test.ts"],
    environment: "jsdom",
    deps: {
      inline: ["@vue", "@vueuse", "vue-demi"],
    },
  },
});
