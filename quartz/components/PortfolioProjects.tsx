/** @jsxImportSource hastscript */
import { Root } from "hast"
import { Project } from "../plugins/transformers/portfolio"

export const PortfolioProjects = ({ yaml }: { yaml: [Project, Root][] }) => {
  const content = yaml.map(([doc, description]) => {
    return (
      <div className="pf-cell">
        <a href={doc.url ?? doc.github ?? doc.image} target="_blank">
          <div align="center">
            <div class="img-wrapper">
              <img
                title={doc.url ? "Visit" : doc.github ? "See the source" : "Zoom in"}
                src={doc.image}
              ></img>
            </div>
          </div>
        </a>
        <p>{description}</p>
        <ul className="tags">
          {doc.tags.map((tag) => (
            <li className="tag-link">{tag}</li>
          ))}
        </ul>
      </div>
    )
  })
  return (
    <>
      <div className="projects">{content}</div>
    </>
  )
}
