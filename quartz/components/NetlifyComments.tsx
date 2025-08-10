import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const NetlifyCommentsStyle = `
.netlify-comments {
  border-top: 1px solid var(--border);
  padding: 2rem 0;
  margin: 2rem 0;
}

.netlify-comments h3 {
  margin-bottom: 1.5rem;
  color: var(--dark);
}

.comment-form {
  background: var(--light);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.comment-form .form-group {
  margin-bottom: 1rem;
}

.comment-form label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--dark);
}

.comment-form input[type="text"],
.comment-form input[type="email"],
.comment-form textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  font-family: inherit;
  font-size: 0.875rem;
  background: var(--light);
  color: var(--dark);
  transition: border-color 0.2s ease;
}

.comment-form input[type="text"]:focus,
.comment-form input[type="email"]:focus,
.comment-form textarea:focus {
  outline: none;
  border-color: var(--secondary);
}

.comment-form textarea {
  min-height: 120px;
  resize: vertical;
}

.comment-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.comment-form button {
  background: var(--secondary);
  color: var(--light);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.comment-form button:hover {
  background: var(--tertiary);
}

.comment-form button:disabled {
  background: var(--gray);
  cursor: not-allowed;
}

.comments-list {
  margin-top: 2rem;
}

.comment {
  border-bottom: 1px solid var(--lightgray);
  padding: 1.5rem 0;
}

.comment:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.comment-author {
  font-weight: 600;
  color: var(--dark);
}

.comment-date {
  font-size: 0.875rem;
  color: var(--gray);
}

.comment-body {
  color: var(--dark);
  line-height: 1.6;
}

.comment-status {
  padding: 1rem;
  border-radius: 0.25rem;
  margin-bottom: 1rem;
  text-align: center;
}

.comment-status.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.comment-status.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.comment-status.loading {
  background: var(--lightgray);
  color: var(--gray);
  border: 1px solid var(--border);
}

@media (max-width: 768px) {
  .comment-form .form-row {
    grid-template-columns: 1fr;
  }

  .netlify-comments {
    padding: 1rem 0;
    margin: 1rem 0;
  }

  .comment-form {
    padding: 1rem;
  }
}
`

const NetlifyCommentsScript = `
document.addEventListener('DOMContentLoaded', function() {
  const commentForm = document.getElementById('comment-form');
  const statusDiv = document.getElementById('comment-status');

  if (commentForm) {
    commentForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const formData = new FormData(commentForm);

      // Show loading status
      statusDiv.className = 'comment-status loading';
      statusDiv.textContent = 'Submitting your comment...';
      statusDiv.style.display = 'block';

      // Add current page URL to form data
      formData.append('page-url', window.location.pathname);
      formData.append('page-title', document.title);

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      })
      .then(response => {
        if (response.ok) {
          statusDiv.className = 'comment-status success';
          statusDiv.textContent = 'Thank you for your comment! It will be reviewed and published shortly.';
          commentForm.reset();
        } else {
          throw new Error('Network response was not ok');
        }
      })
      .catch(error => {
        statusDiv.className = 'comment-status error';
        statusDiv.textContent = 'There was an error submitting your comment. Please try again.';
        console.error('Error:', error);
      });
    });
  }

  // Load existing comments
  loadComments();
});

function loadComments() {
  const commentsContainer = document.getElementById('comments-list');
  const pageUrl = window.location.pathname;

  fetch(\`/.netlify/functions/get-comments?page=\${encodeURIComponent(pageUrl)}\`)
    .then(response => response.json())
    .then(comments => {
      if (comments && comments.length > 0) {
        commentsContainer.innerHTML = comments.map(comment => \`
          <div class="comment">
            <div class="comment-header">
              <div class="comment-author">\${escapeHtml(comment.name)}</div>
              <div class="comment-date">\${formatDate(comment.date)}</div>
            </div>
            <div class="comment-body">\${escapeHtml(comment.message).replace(/\\n/g, '<br>')}</div>
          </div>
        \`).join('');
      } else {
        commentsContainer.innerHTML = '<p style="color: var(--gray); font-style: italic;">No comments yet. Be the first to share your thoughts!</p>';
      }
    })
    .catch(error => {
      console.error('Error loading comments:', error);
      commentsContainer.innerHTML = '<p style="color: var(--gray); font-style: italic;">Comments could not be loaded.</p>';
    });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
`

type Options = {
  moderationEmail?: string
  honeypotField?: string
  allowAnonymous?: boolean
  requireEmail?: boolean
}

export default ((opts?: Options) => {
  const NetlifyComments: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
    // Check if comments should be displayed according to frontmatter
    const disableComments =
      typeof fileData.frontmatter?.comments !== "undefined" &&
      (!fileData.frontmatter?.comments || fileData.frontmatter?.comments === "false")

    if (disableComments) {
      return <></>
    }

    const honeypotField = opts?.honeypotField || "website"
    const requireEmail = opts?.requireEmail !== false
    const allowAnonymous = opts?.allowAnonymous === true

    return (
      <div class={classNames(displayClass, "netlify-comments")}>
        <h3>Comments</h3>

        <div id="comment-status" class="comment-status" style="display: none;"></div>

        <form
          id="comment-form"
          class="comment-form"
          name="comments"
          method="POST"
          data-netlify="true"
          netlify-honeypot={honeypotField}
        >
          <input type="hidden" name="form-name" value="comments" />
          <input type="hidden" name="page-url" value="" />
          <input type="hidden" name="page-title" value="" />

          {/* Honeypot field */}
          <div style="display: none;">
            <label>
              Don't fill this out if you're human:
              <input name={honeypotField} />
            </label>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="comment-name">
                Name {!allowAnonymous && "*"}
              </label>
              <input
                type="text"
                id="comment-name"
                name="name"
                required={!allowAnonymous}
                placeholder={allowAnonymous ? "Anonymous (optional)" : "Your name"}
              />
            </div>

            <div class="form-group">
              <label for="comment-email">
                Email {requireEmail && "*"}
              </label>
              <input
                type="email"
                id="comment-email"
                name="email"
                required={requireEmail}
                placeholder={requireEmail ? "your@email.com" : "your@email.com (optional)"}
              />
            </div>
          </div>

          <div class="form-group">
            <label for="comment-message">Comment *</label>
            <textarea
              id="comment-message"
              name="message"
              required
              placeholder="Share your thoughts..."
            ></textarea>
          </div>

          <button type="submit">Submit Comment</button>
        </form>

        <div id="comments-list" class="comments-list">
          <p style="color: var(--gray); font-style: italic;">Loading comments...</p>
        </div>
      </div>
    )
  }

  NetlifyComments.css = NetlifyCommentsStyle
  NetlifyComments.afterDOMLoaded = NetlifyCommentsScript

  return NetlifyComments
}) satisfies QuartzComponentConstructor<Options>
