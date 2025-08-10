import type { Handler } from "@netlify/functions"
import { promises as fs } from "fs"
import path from "path"

interface Comment {
  id: string
  name: string
  email: string
  message: string
  page: string
  pageTitle: string
  date: string
  approved: boolean
  flagged: boolean
  ip?: string
  userAgent?: string
  moderatedAt?: string
  moderatedBy?: string
  rejectionReason?: string
}

interface CommentStorage {
  comments: Comment[]
  lastModified: string
  version: string
}

// Path to store comments (in site's data directory)
const COMMENTS_FILE = path.join(process.cwd(), "data", "comments.json")

export const handler: Handler = async (event, context) => {
  const { httpMethod } = event
  const { action, commentId, comment, page, status } = JSON.parse(event.body || "{}")

  try {
    switch (httpMethod) {
      case "GET":
        return await handleGet(event)
      case "POST":
        return await handlePost(action, commentId, comment, page, status)
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: "Method not allowed" }),
        }
    }
  } catch (error) {
    console.error("Comment storage error:", error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    }
  }
}

async function handleGet(event: any) {
  const { page, status, all } = event.queryStringParameters || {}

  const storage = await loadComments()

  let filteredComments = storage.comments

  // Filter by page if specified
  if (page) {
    filteredComments = filteredComments.filter((c) => c.page === page)
  }

  // Filter by status if specified
  if (status) {
    switch (status) {
      case "approved":
        filteredComments = filteredComments.filter((c) => c.approved && !c.flagged)
        break
      case "pending":
        filteredComments = filteredComments.filter((c) => !c.approved && !c.flagged)
        break
      case "flagged":
        filteredComments = filteredComments.filter((c) => c.flagged)
        break
    }
  }

  // For public API, only return approved comments
  if (!all) {
    filteredComments = filteredComments.filter((c) => c.approved && !c.flagged)

    // Remove sensitive information for public API
    filteredComments = filteredComments.map((c) => ({
      id: c.id,
      name: c.name,
      email: "", // Don't expose email publicly
      message: c.message,
      date: c.date,
      page: c.page,
      pageTitle: c.pageTitle,
      approved: c.approved,
      flagged: false, // Don't expose flagged status publicly
    }))
  }

  // Sort by date (oldest first for display)
  filteredComments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(filteredComments),
  }
}

async function handlePost(
  action: string,
  commentId: string,
  comment: Comment,
  page: string,
  status: string,
) {
  const storage = await loadComments()

  switch (action) {
    case "add":
      // Add new comment
      if (!comment) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Comment data required" }),
        }
      }

      const newComment: Comment = {
        ...comment,
        id: comment.id || generateId(),
        date: comment.date || new Date().toISOString(),
        approved: false,
        flagged: comment.flagged || false,
      }

      storage.comments.push(newComment)
      await saveComments(storage)

      return {
        statusCode: 201,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true, comment: newComment }),
      }

    case "update":
      // Update existing comment
      if (!commentId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Comment ID required" }),
        }
      }

      const commentIndex = storage.comments.findIndex((c) => c.id === commentId)
      if (commentIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Comment not found" }),
        }
      }

      // Update comment
      storage.comments[commentIndex] = {
        ...storage.comments[commentIndex],
        ...comment,
        moderatedAt: new Date().toISOString(),
      }

      await saveComments(storage)

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true, comment: storage.comments[commentIndex] }),
      }

    case "moderate":
      // Moderate comment (approve/reject)
      if (!commentId || !status) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Comment ID and status required" }),
        }
      }

      const moderateIndex = storage.comments.findIndex((c) => c.id === commentId)
      if (moderateIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Comment not found" }),
        }
      }

      storage.comments[moderateIndex].approved = status === "approve"
      storage.comments[moderateIndex].moderatedAt = new Date().toISOString()

      if (status === "reject" && comment?.rejectionReason) {
        storage.comments[moderateIndex].rejectionReason = comment.rejectionReason
      }

      await saveComments(storage)

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: true,
          message: `Comment ${status}d successfully`,
          comment: storage.comments[moderateIndex],
        }),
      }

    case "delete":
      // Delete comment
      if (!commentId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Comment ID required" }),
        }
      }

      const deleteIndex = storage.comments.findIndex((c) => c.id === commentId)
      if (deleteIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Comment not found" }),
        }
      }

      storage.comments.splice(deleteIndex, 1)
      await saveComments(storage)

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true, message: "Comment deleted successfully" }),
      }

    default:
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid action" }),
      }
  }
}

async function loadComments(): Promise<CommentStorage> {
  try {
    // Ensure data directory exists
    await fs.mkdir(path.dirname(COMMENTS_FILE), { recursive: true })

    const data = await fs.readFile(COMMENTS_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    // File doesn't exist or is invalid, return empty storage
    return {
      comments: [],
      lastModified: new Date().toISOString(),
      version: "1.0",
    }
  }
}

async function saveComments(storage: CommentStorage): Promise<void> {
  storage.lastModified = new Date().toISOString()

  // Ensure data directory exists
  await fs.mkdir(path.dirname(COMMENTS_FILE), { recursive: true })

  await fs.writeFile(COMMENTS_FILE, JSON.stringify(storage, null, 2))
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

// Utility functions for comment management

export async function addComment(
  comment: Omit<Comment, "id" | "date" | "approved" | "flagged">,
): Promise<Comment> {
  const storage = await loadComments()

  const newComment: Comment = {
    ...comment,
    id: generateId(),
    date: new Date().toISOString(),
    approved: false,
    flagged: false,
  }

  storage.comments.push(newComment)
  await saveComments(storage)

  return newComment
}

export async function getCommentsForPage(
  page: string,
  approvedOnly: boolean = true,
): Promise<Comment[]> {
  const storage = await loadComments()

  let comments = storage.comments.filter((c) => c.page === page)

  if (approvedOnly) {
    comments = comments.filter((c) => c.approved && !c.flagged)
  }

  return comments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export async function moderateComment(
  commentId: string,
  approved: boolean,
  reason?: string,
): Promise<Comment | null> {
  const storage = await loadComments()

  const commentIndex = storage.comments.findIndex((c) => c.id === commentId)
  if (commentIndex === -1) return null

  storage.comments[commentIndex].approved = approved
  storage.comments[commentIndex].moderatedAt = new Date().toISOString()

  if (!approved && reason) {
    storage.comments[commentIndex].rejectionReason = reason
  }

  await saveComments(storage)

  return storage.comments[commentIndex]
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const storage = await loadComments()

  const commentIndex = storage.comments.findIndex((c) => c.id === commentId)
  if (commentIndex === -1) return false

  storage.comments.splice(commentIndex, 1)
  await saveComments(storage)

  return true
}

export async function getCommentStats(): Promise<{
  total: number
  pending: number
  approved: number
  flagged: number
}> {
  const storage = await loadComments()

  return {
    total: storage.comments.length,
    pending: storage.comments.filter((c) => !c.approved && !c.flagged).length,
    approved: storage.comments.filter((c) => c.approved && !c.flagged).length,
    flagged: storage.comments.filter((c) => c.flagged).length,
  }
}
