# Netlify Comments Component for Quartz

This document explains how to set up and use the NetlifyComments component in your Quartz site.

## Overview

The NetlifyComments component provides a comment system powered by Netlify Forms with built-in moderation capabilities. Unlike the default Giscus-based comments, this system:

- Works entirely within Netlify's infrastructure
- Provides comment moderation before publishing
- Includes spam protection and honeypot filtering
- Supports email notifications for new comments
- Has a web-based moderation interface

## Setup

### 1. Environment Variables

Set these environment variables in your Netlify dashboard (Site Settings → Environment Variables):

```bash
# Required: Token for accessing moderation interface
COMMENT_MODERATION_TOKEN=your-secure-random-token-here

# Optional: Email for moderation notifications
MODERATOR_EMAIL=admin@yoursite.com

# Optional: For email notifications (requires SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
```

**Important**: Generate a strong, random token for `COMMENT_MODERATION_TOKEN`. This protects your moderation interface.

### 2. Database Setup (Required for Production)

The current implementation includes placeholder code for comment storage. You'll need to implement one of these options:

#### Option A: Fauna DB
```bash
npm install faunadb
```

#### Option B: Supabase
```bash
npm install @supabase/supabase-js
```

#### Option C: Airtable
```bash
npm install airtable
```

#### Option D: Simple JSON Storage
For small sites, you can store comments in a JSON file in your repository.

### 3. Update Your Layout

Add the NetlifyComments component to your Quartz layout configuration:

```typescript
// quartz.layout.ts
import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// Shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/jackyzha0/quartz",
    },
  }),
}

// Components for pages
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer()),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
  afterBody: [
    // Add NetlifyComments here instead of or alongside the default Comments
    Component.NetlifyComments({
      moderationEmail: process.env.MODERATOR_EMAIL,
      honeypotField: "website",
      allowAnonymous: false,
      requireEmail: true
    }),
  ],
}
```

### 4. Deploy to Netlify

The component requires Netlify's form processing and serverless functions. Make sure:

1. Your site is deployed to Netlify
2. Forms processing is enabled (should be automatic)
3. Functions are properly deployed (check Functions tab in Netlify dashboard)

## Configuration Options

```typescript
Component.NetlifyComments({
  // Email address to send moderation notifications to
  moderationEmail?: string,

  // Name of the honeypot field for spam protection
  honeypotField?: string, // default: "website"

  // Allow anonymous comments (no name required)
  allowAnonymous?: boolean, // default: false

  // Require email address
  requireEmail?: boolean, // default: true
})
```

## Moderation Interface

Access the moderation interface at: `https://yoursite.com/admin/comments`

You'll need to authenticate with the moderation token you set in your environment variables.

### Features:
- View all pending, approved, and flagged comments
- Filter by status, page, or search content
- Approve, reject, or delete comments
- View comment statistics
- Responsive design for mobile moderation

## Disabling Comments on Specific Pages

Add to your page's frontmatter:

```yaml
---
title: "Page Title"
comments: false
---
```

## Customization

### Styling

The component includes comprehensive CSS that follows Quartz's design system. You can customize the appearance by overriding these CSS classes:

- `.netlify-comments` - Main container
- `.comment-form` - Form styling
- `.comment` - Individual comment styling
- `.comment-status` - Status messages

### Spam Protection

The component includes several spam protection measures:

1. **Honeypot Field**: Hidden field that bots typically fill out
2. **Content Filtering**: Basic patterns to detect spam content
3. **Manual Moderation**: All comments require approval
4. **Rate Limiting**: Netlify's built-in form submission limits

## Troubleshooting

### Comments Not Appearing
1. Check that the form name matches: `name="comments"`
2. Verify Netlify forms processing is enabled
3. Check the Functions tab in Netlify dashboard for errors

### Moderation Interface Not Working
1. Verify `COMMENT_MODERATION_TOKEN` is set
2. Check browser console for JavaScript errors
3. Ensure functions are deployed properly

### Email Notifications Not Sending
1. Verify `MODERATOR_EMAIL` and `SENDGRID_API_KEY` are set
2. Check SendGrid account and API key permissions
3. Review function logs in Netlify dashboard

## Database Implementation Examples

### Fauna DB Example
```typescript
// In comment-submitted.mts
import { Client, query as q } from 'faunadb'

const client = new Client({
  secret: process.env.FAUNA_SECRET_KEY!
})

// Store comment
await client.query(
  q.Create(
    q.Collection('comments'),
    { data: comment }
  )
)
```

### Supabase Example
```typescript
// In comment-submitted.mts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// Store comment
const { data, error } = await supabase
  .from('comments')
  .insert(comment)
```

## Security Considerations

1. **Always validate and sanitize input** on the server side
2. **Use HTTPS** for your site to protect form submissions
3. **Keep your moderation token secure** and rotate it periodically
4. **Monitor for spam** and adjust filtering rules as needed
5. **Consider rate limiting** for high-traffic sites

## Migration from Giscus

If you're switching from the default Giscus comments:

1. Replace `Component.Comments()` with `Component.NetlifyComments()` in your layout
2. Existing Giscus comments will remain in GitHub Discussions
3. New comments will use the Netlify system
4. Consider adding a notice about the comment system change

## Support

This component is designed to work with Quartz v4+. For issues:

1. Check the Netlify function logs
2. Verify environment variables are set correctly
3. Test the moderation interface functionality
4. Review the browser console for client-side errors

## Contributing

To enhance this component:

1. Fork the repository
2. Make your changes to the component files
3. Test with a real Netlify deployment
4. Submit a pull request with documentation updates
