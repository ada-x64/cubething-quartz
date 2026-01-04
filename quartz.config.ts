import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"
import * as ayu from "ayu"
import "dotenv/config"
import { joinSegments } from "./quartz/util/path"
import { existsSync } from "fs"

const colors_ayu = (prefix: "light" | "dark" | "mirage") => {
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
    secondary:
      prefix === "light" ? ayu.light.syntax.constant.hex() : ayu[prefix].common.accent.hex(),
    // hover states and visited graph nodes
    tertiary: prefix === "light" ? ayu.light.syntax.func.hex() : ayu[prefix].syntax.constant.hex(),
    // internal link background, highlighted text
    highlight: ayu[prefix].ui.selection.normal.hex(),
    // markdown highlighted background
    textHighlight: ayu[prefix].ui.selection.active.hex(),
    // highlighted lines of code
    codeHighlight: ayu[prefix].editor.findMatch.inactive.hex(),
  }
}

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const bibpath = joinSegments(process.env["CONTENT_DIRECTORY"] ?? "content", "static", "lib.bib")
const bibplugin = existsSync(bibpath)
  ? Plugin.Citations({
      bibliographyFile: bibpath,
      csl: "https://raw.githubusercontent.com/citation-style-language/styles/master/chicago-author-date.csl",
      linkCitations: true,
      suppressBibliography: false,
      showTooltips: true,
    })
  : Plugin.Noop({ warn: "Could not find bibpath! Not bundling citations plugin." })
const config: QuartzConfig = {
  configuration: {
    baseUrl: process.env["BASE_URL"],
    contentDirectory: process.env["CONTENT_DIRECTORY"],
    outputDirectory: process.env["OUTPUT_DIRECTORY"],

    pageTitle: "cubething",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "tinylytics",
      siteId: "Y1Jaut4BWsZEgmGjxCFs",
    },
    locale: "en-US",
    ignorePatterns: ["private", "templates", ".obsidian", ".stfolder", ".git"],
    defaultDateType: "published",
    theme: {
      fontOrigin: "local",
      cdnCaching: true,
      typography: {
        header: "Zodiak-Bold",
        body: "PlusJakartaSans-Regular",
        code: "Fira Code",
      },
      colors: {
        lightMode: colors_ayu("light"),
        darkMode: colors_ayu("mirage"),
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.StyleDependentFigures(),
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
      Plugin.JsxPlugin({
        contact: {
          bsky: "https://bsky.app/profile/cubething.dev",
          email: "mailto:ada@cubething.dev",
          resume: "/static/resume.pdf",
          github: "https://github.com/ada-x64/",
          linkedin: "https://linkedin.com/ada-mandala",
        },
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
      bibplugin,
    ],
    filters: [
      process.env["SHOW_DRAFTS"] === "true" ? Plugin.NoopFilter() : Plugin.RemoveDrafts(),
      process.env["NO_SCHEDULER"] === "true" ? Plugin.NoopFilter() : Plugin.Scheduled(),
    ],
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
      process.env["NO_OG"] === "true"
        ? Plugin.NoopEmitter()
        : Plugin.CustomOgImages({ colorScheme: "darkMode" }),
      Plugin.CNAME(),
    ],
  },
}

export default config
