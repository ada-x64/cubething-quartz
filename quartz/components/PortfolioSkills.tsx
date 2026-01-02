export const PortfolioSkills = ({ svgs }: { svgs: string[] }) => {
  const content = svgs.map((svg: string) => {
    return <div className="skill" dangerouslySetInnerHTML={{ __html: svg }}></div>
  })
  return (
    <>
      <div className="skills">{content}</div>
    </>
  )
}
