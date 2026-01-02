import { Project, ProjectArray } from "../plugins/transformers/portfolio"

export const PortfolioProjects = ({ yaml }: { yaml: ProjectArray }) => {
  const content = yaml.map((doc: Project) => {
    return (
      <div className="pf-cell">
        <a href={doc.url ?? doc.github ?? doc.image} target="_blank">
          <div class="img-wrapper">
            <img
              title={doc.url ? "Visit" : doc.github ? "See the source" : "Zoom in"}
              src={doc.image}
            ></img>
          </div>
        </a>
        <p>{doc.description}</p>
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
