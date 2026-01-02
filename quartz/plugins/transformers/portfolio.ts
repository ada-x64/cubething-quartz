import { QuartzTransformerPlugin } from "../types"
import yml from "js-yaml"
import z from "zod"
import { PortfolioProjects } from "../../components/PortfolioProjects"
import { PortfolioSkills } from "../../components/PortfolioSkills"
import { join, resolve } from "path"
import { renderToString } from "preact-render-to-string"
import { h } from "preact"
import { readFileSync, readdirSync } from "fs"

const projectSchema = z.object({
  name: z.string(),
  image: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  github: z.string().url().optional(),
  url: z.string().url().optional(),
})
const projectArraySchema = z.array(projectSchema)
export type Project = z.infer<typeof projectSchema>
export type ProjectArray = z.infer<typeof projectArraySchema>

export interface Options {
  projectsPath: string
  skillsPath: string
}

export const defaultOptions: Options = {
  projectsPath: "static/projects.yml",
  skillsPath: "static/skills",
}

export const PortfolioPlugin: QuartzTransformerPlugin<Partial<Options>> = (
  userOpts?: Partial<Options>,
) => {
  const { projectsPath, skillsPath } = { ...defaultOptions, ...userOpts }
  return {
    name: "portfolio",
    textTransform: (ctx, src) => {
      let contentDirectory = ctx.cfg.configuration?.contentDirectory ?? "content"
      let projects, skills
      {
        const ppath = resolve(join(contentDirectory, projectsPath))
        const buf = readFileSync(ppath, { encoding: "utf8" })
        const docs = yml.loadAll(buf).map((doc) => {
          return projectSchema.parse(doc)
        })
        const el = h(PortfolioProjects, { yaml: docs })
        projects = renderToString(el)
      }
      {
        const spath = resolve(join(contentDirectory, skillsPath))
        const svgs = readdirSync(spath).map((filename) => {
          return readFileSync(join(spath, filename), { encoding: "utf8" })
        })
        const el2 = h(PortfolioSkills, { svgs })
        skills = renderToString(el2)
      }

      return src.replace("::projects", projects).replace("::skills", skills)
    },
  }
}
