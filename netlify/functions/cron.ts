import type { Config, Context } from "@netlify/functions"

export default async (req: Request, context: Context) => {
  const { next_run } = await req.json()
  console.log("Received event! Next invocation at:", next_run)
  const res = await fetch("https://api.netlify.com/build_hooks/68240af8660996e0351ef883", {
    method: "POST",
    body: "{}",
  })
  console.log("Got res:", res)
}

export const config: Config = {
  schedule: "@daily",
}
