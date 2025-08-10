import type { Handler } from '@netlify/functions'

export const handler: Handler = async (event, context) => {
  // Check authentication
  const authToken = event.headers.authorization
  const expectedToken = process.env.COMMENT_MODERATION_TOKEN

  if (!expectedToken || authToken !== `Bearer ${expectedToken}`) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'text/html'
      },
      body: `
        <html>
          <head>
            <title>Comment Moderation - Authentication Required</title>
            <style>
              body { font-family: sans-serif; max-width: 600px; margin: 2rem auto; padding: 1rem; }
              .auth-form { background: #f8f9fa; padding: 2rem; border-radius: 0.5rem; }
              input, button { padding: 0.5rem; margin: 0.25rem 0; }
              button { background: #007bff; color: white; border: none; border-radius: 0.25rem; cursor: pointer; }
            </style>
          </head>
          <body>
            <div class="auth-form">
              <h1>Comment Moderation</h1>
              <p>Please enter your moderation token to continue:</p>
              <form id="auth-form">
                <input type="password" id="token" placeholder="Moderation Token" required>
                <br>
                <button type="submit">Authenticate</button>
              </form>
            </div>
            <script>
              document.getElementById('auth-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const token = document.getElementById('token').value;
                localStorage.setItem('moderationToken', token);
                location.reload();
              });

              // Check if token is stored
              const storedToken = localStorage.getItem('moderationToken');
              if (storedToken) {
                fetch('/.netlify/functions/moderate-ui', {
                  headers: {
                    'Authorization': 'Bearer ' + storedToken
                  }
                }).then(response => {
                  if (response.ok) {
                    response.text().then(html => {
                      document.documentElement.innerHTML = html;
                    });
                  }
                });
              }
            </script>
          </body>
        </html>
      `
    }
  }

  // Return moderation interface
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html'
    },
    body: `
      <html>
        <head>
          <title>Comment Moderation Interface</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 1rem;
              background: #f8f9fa;
            }
            .container { max-width: 1200px; margin: 0 auto; }
            .header {
              background: white;
              padding: 1.5rem;
              border-radius: 0.5rem;
              margin-bottom: 1rem;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stats {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 1rem;
              margin-bottom: 2rem;
            }
            .stat-card {
              background: white;
              padding: 1.5rem;
              border-radius: 0.5rem;
              text-align: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-number { font-size: 2rem; font-weight: bold; color: #007bff; }
            .stat-label { color: #6c757d; font-size: 0.875rem; }
            .comment-card {
              background: white;
              margin-bottom: 1rem;
              border-radius: 0.5rem;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .comment-header {
              padding: 1rem;
              background: #f8f9fa;
              border-bottom: 1px solid #dee2e6;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .comment-meta {
              font-size: 0.875rem;
              color: #6c757d;
            }
            .comment-status {
              padding: 0.25rem 0.5rem;
              border-radius: 0.25rem;
              font-size: 0.75rem;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-pending { background: #fff3cd; color: #856404; }
            .status-approved { background: #d4edda; color: #155724; }
            .status-flagged { background: #f8d7da; color: #721c24; }
            .comment-content {
              padding: 1rem;
            }
            .comment-message {
              background: #f8f9fa;
              padding: 1rem;
              border-radius: 0.25rem;
              margin: 1rem 0;
              white-space: pre-wrap;
            }
            .comment-actions {
              padding: 1rem;
              border-top: 1px solid #dee2e6;
              display: flex;
              gap: 0.5rem;
            }
            .btn {
              padding: 0.5rem 1rem;
              border: none;
              border-radius: 0.25rem;
              cursor: pointer;
              font-size: 0.875rem;
              font-weight: 500;
            }
            .btn-approve { background: #28a745; color: white; }
            .btn-reject { background: #dc3545; color: white; }
            .btn-delete { background: #6c757d; color: white; }
            .btn:hover { opacity: 0.8; }
            .btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .filters {
              background: white;
              padding: 1rem;
              border-radius: 0.5rem;
              margin-bottom: 1rem;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .filter-group {
              display: flex;
              gap: 1rem;
              align-items: center;
              flex-wrap: wrap;
            }
            .filter-select, .filter-input {
              padding: 0.5rem;
              border: 1px solid #dee2e6;
              border-radius: 0.25rem;
              font-size: 0.875rem;
            }
            .loading {
              text-align: center;
              padding: 2rem;
              color: #6c757d;
            }
            .no-comments {
              text-align: center;
              padding: 3rem;
              color: #6c757d;
              background: white;
              border-radius: 0.5rem;
            }
            @media (max-width: 768px) {
              .comment-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
              .comment-actions { flex-direction: column; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Comment Moderation</h1>
              <p>Manage and moderate comments submitted through Netlify forms</p>
              <button onclick="logout()" class="btn" style="background: #dc3545; color: white;">Logout</button>
            </div>

            <div class="stats" id="stats">
              <div class="stat-card">
                <div class="stat-number" id="pending-count">-</div>
                <div class="stat-label">Pending</div>
              </div>
              <div class="stat-card">
                <div class="stat-number" id="approved-count">-</div>
                <div class="stat-label">Approved</div>
              </div>
              <div class="stat-card">
                <div class="stat-number" id="flagged-count">-</div>
                <div class="stat-label">Flagged</div>
              </div>
              <div class="stat-card">
                <div class="stat-number" id="total-count">-</div>
                <div class="stat-label">Total</div>
              </div>
            </div>

            <div class="filters">
              <div class="filter-group">
                <label for="status-filter">Status:</label>
                <select id="status-filter" class="filter-select" onchange="filterComments()">
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="flagged">Flagged</option>
                </select>

                <label for="page-filter">Page:</label>
                <select id="page-filter" class="filter-select" onchange="filterComments()">
                  <option value="">All Pages</option>
                </select>

                <input type="text" id="search-filter" class="filter-input" placeholder="Search comments..." onkeyup="filterComments()">

                <button onclick="refreshComments()" class="btn" style="background: #007bff; color: white;">Refresh</button>
              </div>
            </div>

            <div id="comments-container">
              <div class="loading">Loading comments...</div>
            </div>
          </div>

          <script>
            let allComments = [];
            const token = localStorage.getItem('moderationToken');

            // Load comments on page load
            document.addEventListener('DOMContentLoaded', function() {
              loadComments();
            });

            async function loadComments() {
              try {
                // In a real implementation, this would fetch from your database
                // For now, we'll simulate with sample data

                // This is where you'd call your API:
                // const response = await fetch('/.netlify/functions/get-all-comments', {
                //   headers: { 'Authorization': 'Bearer ' + token }
                // });
                // allComments = await response.json();

                // Sample data for demonstration
                allComments = [
                  {
                    id: '1',
                    name: 'John Doe',
                    email: 'john@example.com',
                    message: 'Great article! Really helped me understand the topic better.',
                    page: '/blog/sample-post',
                    pageTitle: 'Sample Blog Post',
                    date: '2024-01-15T10:30:00Z',
                    status: 'pending',
                    flagged: false
                  },
                  {
                    id: '2',
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                    message: 'I disagree with some points, but well written overall.',
                    page: '/blog/another-post',
                    pageTitle: 'Another Blog Post',
                    date: '2024-01-14T15:45:00Z',
                    status: 'approved',
                    flagged: false
                  },
                  {
                    id: '3',
                    name: 'Spammer',
                    email: 'spam@spam.com',
                    message: 'Check out my amazing casino website! Free money!',
                    page: '/blog/sample-post',
                    pageTitle: 'Sample Blog Post',
                    date: '2024-01-13T08:20:00Z',
                    status: 'pending',
                    flagged: true
                  }
                ];

                updateStats();
                populatePageFilter();
                displayComments(allComments);
              } catch (error) {
                console.error('Error loading comments:', error);
                document.getElementById('comments-container').innerHTML =
                  '<div class="no-comments">Error loading comments. Please try again.</div>';
              }
            }

            function updateStats() {
              const stats = allComments.reduce((acc, comment) => {
                acc.total++;
                if (comment.status === 'pending') acc.pending++;
                if (comment.status === 'approved') acc.approved++;
                if (comment.flagged) acc.flagged++;
                return acc;
              }, { pending: 0, approved: 0, flagged: 0, total: 0 });

              document.getElementById('pending-count').textContent = stats.pending;
              document.getElementById('approved-count').textContent = stats.approved;
              document.getElementById('flagged-count').textContent = stats.flagged;
              document.getElementById('total-count').textContent = stats.total;
            }

            function populatePageFilter() {
              const pages = [...new Set(allComments.map(c => c.page))];
              const pageFilter = document.getElementById('page-filter');

              // Clear existing options except "All Pages"
              pageFilter.innerHTML = '<option value="">All Pages</option>';

              pages.forEach(page => {
                const option = document.createElement('option');
                option.value = page;
                option.textContent = page;
                pageFilter.appendChild(option);
              });
            }

            function displayComments(comments) {
              const container = document.getElementById('comments-container');

              if (comments.length === 0) {
                container.innerHTML = '<div class="no-comments">No comments found.</div>';
                return;
              }

              container.innerHTML = comments.map(comment => \`
                <div class="comment-card" id="comment-\${comment.id}">
                  <div class="comment-header">
                    <div class="comment-meta">
                      <strong>\${escapeHtml(comment.name)}</strong> (\${escapeHtml(comment.email)})<br>
                      <small>\${formatDate(comment.date)} • \${escapeHtml(comment.pageTitle)}</small>
                    </div>
                    <div class="comment-status status-\${comment.status} \${comment.flagged ? 'status-flagged' : ''}">
                      \${comment.flagged ? 'FLAGGED' : comment.status.toUpperCase()}
                    </div>
                  </div>
                  <div class="comment-content">
                    <div><strong>Page:</strong> <a href="\${comment.page}" target="_blank">\${comment.page}</a></div>
                    <div class="comment-message">\${escapeHtml(comment.message)}</div>
                  </div>
                  <div class="comment-actions">
                    \${comment.status !== 'approved' ? \`<button class="btn btn-approve" onclick="moderateComment('\${comment.id}', 'approve')">Approve</button>\` : ''}
                    \${comment.status !== 'rejected' ? \`<button class="btn btn-reject" onclick="moderateComment('\${comment.id}', 'reject')">Reject</button>\` : ''}
                    <button class="btn btn-delete" onclick="moderateComment('\${comment.id}', 'delete')"
                            onclick="return confirm('Are you sure you want to permanently delete this comment?')">Delete</button>
                  </div>
                </div>
              \`).join('');
            }

            function filterComments() {
              const statusFilter = document.getElementById('status-filter').value;
              const pageFilter = document.getElementById('page-filter').value;
              const searchFilter = document.getElementById('search-filter').value.toLowerCase();

              let filtered = allComments.filter(comment => {
                if (statusFilter && comment.status !== statusFilter) return false;
                if (pageFilter && comment.page !== pageFilter) return false;
                if (searchFilter && !comment.message.toLowerCase().includes(searchFilter) &&
                    !comment.name.toLowerCase().includes(searchFilter)) return false;
                return true;
              });

              displayComments(filtered);
            }

            async function moderateComment(commentId, action) {
              if (action === 'delete' && !confirm('Are you sure you want to permanently delete this comment?')) {
                return;
              }

              try {
                const response = await fetch('/.netlify/functions/moderate-comment', {
                  method: 'POST',
                  headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ action, commentId })
                });

                if (response.ok) {
                  const result = await response.json();

                  // Update local data
                  const commentIndex = allComments.findIndex(c => c.id === commentId);
                  if (commentIndex !== -1) {
                    if (action === 'delete') {
                      allComments.splice(commentIndex, 1);
                    } else {
                      allComments[commentIndex].status = action === 'approve' ? 'approved' : 'rejected';
                    }
                  }

                  updateStats();
                  filterComments();

                  alert(\`Comment \${action}d successfully!\`);
                } else {
                  alert('Error moderating comment. Please try again.');
                }
              } catch (error) {
                console.error('Error moderating comment:', error);
                alert('Error moderating comment. Please try again.');
              }
            }

            function refreshComments() {
              loadComments();
            }

            function logout() {
              localStorage.removeItem('moderationToken');
              location.reload();
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
          </script>
        </body>
      </html>
    `
  }
}
