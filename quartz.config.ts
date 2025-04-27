import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"
import * as ayu from "ayu"

const colors = (prefix: "light" | "dark" | "mirage") => {
  return {
    // page bg
    light: ayu[prefix].editor.bg.hex(),
    // borders
    lightgray: ayu[prefix].editor.indentGuide.normal.hex(),
    // graph links. heavier borders
    gray: ayu[prefix].syntax.comment.hex(),
    // body text
    darkgray: ayu[prefix].editor.fg.hex(),
    // header text and icons
    dark: prefix === "light" ? ayu.light.syntax.constant.hex() : ayu[prefix].common.accent.hex(),
    // link colors, current graph node
    secondary: prefix === "light" ? ayu.light.syntax.constant.hex() : ayu[prefix].syntax.func.hex(),
    // hover states and visited graph nodes
    tertiary: ayu[prefix].syntax.special.hex(),
    // internal link background, highlighted text, highlighted lines of code
    highlight: ayu[prefix].ui.selection.normal.hex(),
    // markdown highlighted background
    textHighlight: ayu[prefix].ui.selection.active.hex(),
  }
}

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "<cubething/>",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "tinylytics",
      siteId: "Y1Jaut4BWsZEgmGjxCFs",
    },
    locale: "en-US",
    baseUrl: "www.cubething.dev",
    ignorePatterns: ["private", "templates", ".obsidian", ".stfolder"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "local",
      cdnCaching: true,
      typography: {
        header: "Chillax",
        body: "Synonym",
        code: "Fira Code",
      },
      colors: {
        lightMode: colors("light"),
        darkMode: colors("mirage"),
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "ayu-dark",
          dark: "ayu-dark",
        },
        keepBackground: true,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
