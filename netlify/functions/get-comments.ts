import type { Handler, HandlerResponse } from "@netlify/functions"
import { getCommentsForPage } from "./comment-storage"

export const handler: Handler = async (event, context): Promise<HandlerResponse> => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Method not allowed" }),
    }
  }

  const page = event.queryStringParameters?.page
  if (!page) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Page parameter is required" }),
    }
  }

  try {
    // Get approved comments for the specific page
    const comments = await getCommentsForPage(page, true)

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(
        comments.map((comment) => ({
          name: comment.name,
          message: comment.message,
          date: comment.date,
        })),
      ),
    }
  } catch (error) {
    console.error("Error fetching comments:", error)
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Internal server error" }),
    }
  }
}
