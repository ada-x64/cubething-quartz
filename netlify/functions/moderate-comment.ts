import type { Handler } from "@netlify/functions"
import { moderateComment, deleteComment } from "./comment-storage"

export const handler: Handler = async (event, context) => {
  // Only allow POST requests for moderation actions
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Method not allowed" }),
    }
  }

  // Verify authentication - in production, use proper auth
  const authToken = event.headers.authorization
  const expectedToken = process.env.COMMENT_MODERATION_TOKEN

  if (!expectedToken || authToken !== `Bearer ${expectedToken}`) {
    return {
      statusCode: 401,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Unauthorized" }),
    }
  }

  try {
    const { action, commentId, reason } = JSON.parse(event.body || "{}")

    if (!action || !commentId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "Action and commentId are required" }),
      }
    }

    switch (action) {
      case "approve":
        console.log(`Approving comment ${commentId}`)

        const approvedComment = await moderateComment(commentId, true)
        if (!approvedComment) {
          return {
            statusCode: 404,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ error: "Comment not found" }),
          }
        }

        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            success: true,
            message: "Comment approved successfully",
            commentId,
          }),
        }

      case "reject":
        console.log(`Rejecting comment ${commentId}. Reason: ${reason || "No reason provided"}`)

        const rejectedComment = await moderateComment(commentId, false, reason)
        if (!rejectedComment) {
          return {
            statusCode: 404,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ error: "Comment not found" }),
          }
        }

        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            success: true,
            message: "Comment rejected successfully",
            commentId,
          }),
        }

      case "delete":
        console.log(`Deleting comment ${commentId}. Reason: ${reason || "No reason provided"}`)

        const deleted = await deleteComment(commentId)
        if (!deleted) {
          return {
            statusCode: 404,
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ error: "Comment not found" }),
          }
        }

        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            success: true,
            message: "Comment deleted successfully",
            commentId,
          }),
        }

      default:
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Invalid action. Must be approve, reject, or delete",
          }),
        }
    }
  } catch (error) {
    console.error("Error in comment moderation:", error)
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      }),
    }
  }
}
