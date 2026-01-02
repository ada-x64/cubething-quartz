import re

expr = re.compile(r'<div[^>]+>\n?\s*(<svg[^>]*>\n?\s*<title>([^<]+)</title>\n?\s*<path[^>]*/>\n?\s*</svg>)\n?\s*</div>')
with open("./content/local/static/portfolio/skills.html") as file:
    for match in expr.finditer(file.read()):
        title = match.group(2)
        content = match.group( 1 )
        with open(f"./content/local/static/portfolio/{title}.svg", 'x') as svg:
            svg.write(content)
