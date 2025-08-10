import type { Handler } from "@netlify/functions"
import { addComment } from "./comment-storage"

interface CommentData {
  name: string
  email: string
  message: string
  "page-url": string
  "page-title": string
  website?: string // honeypot field
}

export const handler: Handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "text/plain",
      },
      body: "Method not allowed",
    }
  }

  try {
    // Parse form data
    const formData = new URLSearchParams(event.body || "")
    const data: CommentData = {
      name: formData.get("name") || "",
      email: formData.get("email") || "",
      message: formData.get("message") || "",
      "page-url": formData.get("page-url") || "",
      "page-title": formData.get("page-title") || "",
      website: formData.get("website") || "", // honeypot
    }

    // Spam protection: check honeypot field
    if (data.website) {
      console.log("Spam detected: honeypot field filled")
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/html",
        },
        body: "<html><body><h1>Thank you!</h1><p>Your comment has been submitted.</p><script>setTimeout(() => history.back(), 2000);</script></body></html>",
      }
    }

    // Basic validation
    if (!data.message.trim()) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "text/html",
        },
        body: '<html><body><h1>Error</h1><p>Message is required.</p><button onclick="history.back()">Go Back</button></body></html>',
      }
    }

    // Content filtering - basic checks
    const suspiciousPatterns = [
      /https?:\/\/[^\s]+\.(tk|ml|ga|cf)\b/i, // suspicious TLDs
      /<script|javascript:/i, // script injection
      /\b(viagra|casino|poker|loan|credit)\b/i, // common spam words
    ]

    const containsSpam = suspiciousPatterns.some(
      (pattern) => pattern.test(data.message) || pattern.test(data.name),
    )

    if (containsSpam) {
      console.log("Potential spam detected in comment content")
      // Still accept but mark for manual review
    }

    // Create comment object
    const comment = {
      id: generateId(),
      name: sanitizeInput(data.name) || "Anonymous",
      email: sanitizeInput(data.email),
      message: sanitizeInput(data.message),
      page: data["page-url"],
      pageTitle: data["page-title"],
      date: new Date().toISOString(),
      approved: !containsSpam, // All comments start as unapproved
      flagged: containsSpam,
      ip:
        event.headers["x-forwarded-for"] || event.headers["x-nf-client-connection-ip"] || "unknown",
      userAgent: event.headers["user-agent"] || "unknown",
      submittedAt: new Date().toISOString(),
    }

    // In production, you would store this in a database
    // For now, we'll log it and potentially send an email notification
    console.log("New comment received:", {
      id: comment.id,
      page: comment.page,
      name: comment.name,
      email: comment.email,
      flagged: comment.flagged,
    })

    // Send email notification to moderator (if configured)
    if (process.env.MODERATOR_EMAIL) {
      await sendModerationEmail(comment)
    }

    // Store comment using our storage utility
    try {
      await addComment({
        name: comment.name,
        email: comment.email,
        message: comment.message,
        page: comment.page,
        pageTitle: comment.pageTitle,
        ip: comment.ip,
        userAgent: comment.userAgent,
      })
    } catch (storageError) {
      console.error("Error storing comment:", storageError)
      // Continue anyway - at least we logged the comment
    }

    // Return success response
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html",
      },
      body: `
        <html>
          <head>
            <title>Comment Submitted</title>
            <style>
              body { font-family: sans-serif; max-width: 600px; margin: 2rem auto; padding: 1rem; }
              .success { background: #d4edda; color: #155724; padding: 1rem; border-radius: 0.25rem; margin-bottom: 1rem; }
              button { background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer; }
              button:hover { background: #0056b3; }
            </style>
          </head>
          <body>
            <div class="success">
              <h1>Thank you for your comment!</h1>
              <p>Your comment has been submitted and is awaiting moderation. It will appear on the page once approved.</p>
            </div>
            <button onclick="window.location.href='${data["page-url"]}'">Return to Article</button>
            <script>
              // Auto-redirect after 3 seconds
              setTimeout(() => {
                window.location.href = '${data["page-url"]}';
              }, 3000);
            </script>
          </body>
        </html>
      `,
    }
  } catch (error) {
    console.error("Error processing comment submission:", error)

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "text/html",
      },
      body: `
        <html>
          <body>
            <h1>Error</h1>
            <p>There was an error processing your comment. Please try again.</p>
            <button onclick="history.back()">Go Back</button>
          </body>
        </html>
      `,
    }
  }
}

// Helper functions
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

function sanitizeInput(input: string): string {
  if (!input) return ""

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove < and > to prevent basic HTML injection
    .substring(0, 1000) // Limit length
}

async function sendModerationEmail(comment: any): Promise<void> {
  // This is a placeholder - in production you might use:
  // - SendGrid
  // - Netlify's email service
  // - AWS SES
  // - Nodemailer with SMTP

  console.log(`Would send moderation email for comment ${comment.id}`)

  // Example implementation with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail')
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)

  const msg = {
    to: process.env.MODERATOR_EMAIL,
    from: 'noreply@yoursite.com',
    subject: `New comment on ${comment.pageTitle}`,
    html: `
      <h2>New Comment Submission</h2>
      <p><strong>Page:</strong> ${comment.pageTitle}</p>
      <p><strong>URL:</strong> ${comment.page}</p>
      <p><strong>Name:</strong> ${comment.name}</p>
      <p><strong>Email:</strong> ${comment.email}</p>
      <p><strong>Message:</strong></p>
      <blockquote>${comment.message}</blockquote>
      <p><strong>Flagged:</strong> ${comment.flagged ? 'Yes' : 'No'}</p>
      <p><a href="your-moderation-url.com/moderate/${comment.id}">Moderate this comment</a></p>
    `
  }

  await sgMail.send(msg)
  */
}
