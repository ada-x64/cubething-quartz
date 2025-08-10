#!/bin/bash

# Netlify Comments Setup Script
# This script helps set up the Netlify comments system for your Quartz site

set -e

echo "🌟 Setting up Netlify Comments for Quartz"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in a Quartz project
if [ ! -f "quartz.config.ts" ] || [ ! -f "package.json" ]; then
    echo -e "${RED}❌ This doesn't appear to be a Quartz project directory${NC}"
    echo "Please run this script from your Quartz project root"
    exit 1
fi

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo -e "${YELLOW}⚠️  Netlify CLI not found${NC}"
    echo "Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Check if we're linked to a Netlify site
if [ ! -f ".netlify/state.json" ]; then
    echo -e "${YELLOW}⚠️  Not linked to a Netlify site${NC}"
    echo "Please run 'netlify link' to connect to your Netlify site first"
    echo "Or run 'netlify init' to create a new site"
    exit 1
fi

echo -e "${GREEN}✅ Netlify CLI found and site linked${NC}"

# Generate a secure moderation token
generate_token() {
    openssl rand -base64 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_urlsafe(32))" 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
}

echo ""
echo "🔑 Setting up environment variables..."
echo "======================================"

# Check if moderation token exists
CURRENT_TOKEN=$(netlify env:get COMMENT_MODERATION_TOKEN 2>/dev/null || echo "")
if [ -z "$CURRENT_TOKEN" ]; then
    NEW_TOKEN=$(generate_token)
    echo -e "${BLUE}Setting COMMENT_MODERATION_TOKEN...${NC}"
    netlify env:set COMMENT_MODERATION_TOKEN "$NEW_TOKEN"
    echo -e "${GREEN}✅ Generated and set moderation token${NC}"
else
    echo -e "${GREEN}✅ COMMENT_MODERATION_TOKEN already exists${NC}"
fi

# Ask for moderator email
read -p "Enter moderator email address (for notifications): " MODERATOR_EMAIL
if [ ! -z "$MODERATOR_EMAIL" ]; then
    netlify env:set MODERATOR_EMAIL "$MODERATOR_EMAIL"
    echo -e "${GREEN}✅ Set moderator email${NC}"
fi

# Optional: SendGrid API key for email notifications
echo ""
echo -e "${YELLOW}Optional: Email notifications${NC}"
read -p "Do you want to set up SendGrid for email notifications? (y/n): " SETUP_SENDGRID
if [ "$SETUP_SENDGRID" = "y" ] || [ "$SETUP_SENDGRID" = "Y" ]; then
    read -p "Enter your SendGrid API key: " SENDGRID_KEY
    if [ ! -z "$SENDGRID_KEY" ]; then
        netlify env:set SENDGRID_API_KEY "$SENDGRID_KEY"
        echo -e "${GREEN}✅ Set SendGrid API key${NC}"
    fi
fi

# Create data directory if it doesn't exist
echo ""
echo "📁 Setting up data directory..."
if [ ! -d "data" ]; then
    mkdir -p data
    echo -e "${GREEN}✅ Created data directory${NC}"
else
    echo -e "${GREEN}✅ Data directory already exists${NC}"
fi

# Check if netlify.toml exists and has the right configuration
echo ""
echo "⚙️  Checking netlify.toml configuration..."
if [ ! -f "netlify.toml" ]; then
    echo -e "${RED}❌ netlify.toml not found${NC}"
    echo "Please ensure you have the netlify.toml file in your project root"
    exit 1
fi

# Check for required sections in netlify.toml
if grep -q "functions = \"netlify/functions\"" netlify.toml; then
    echo -e "${GREEN}✅ Functions directory configured${NC}"
else
    echo -e "${YELLOW}⚠️  Functions directory not configured in netlify.toml${NC}"
fi

# Check if functions exist
echo ""
echo "🔧 Checking Netlify functions..."
FUNCTIONS_DIR="netlify/functions"
REQUIRED_FUNCTIONS=("get-comments.mts" "comment-submitted.mts" "moderate-comment.mts" "moderate-ui.mts" "comment-storage.mts")

for func in "${REQUIRED_FUNCTIONS[@]}"; do
    if [ -f "$FUNCTIONS_DIR/$func" ]; then
        echo -e "${GREEN}✅ $func exists${NC}"
    else
        echo -e "${RED}❌ $func missing${NC}"
    fi
done

# Check if component is added to layout
echo ""
echo "📝 Layout configuration check..."
if grep -q "NetlifyComments" quartz.layout.ts 2>/dev/null; then
    echo -e "${GREEN}✅ NetlifyComments component found in layout${NC}"
else
    echo -e "${YELLOW}⚠️  NetlifyComments not found in quartz.layout.ts${NC}"
    echo "Please add NetlifyComments to your layout configuration"
    echo "See quartz.layout.example.ts for reference"
fi

# Deploy functions
echo ""
echo "🚀 Deploying to Netlify..."
echo "========================="
read -p "Do you want to deploy now? (y/n): " DEPLOY_NOW
if [ "$DEPLOY_NOW" = "y" ] || [ "$DEPLOY_NOW" = "Y" ]; then
    echo "Building and deploying..."
    npm run build 2>/dev/null || npx quartz build
    netlify deploy --prod
    echo -e "${GREEN}✅ Deployed to Netlify${NC}"
fi

# Final instructions
echo ""
echo "🎉 Setup complete!"
echo "=================="
echo ""
echo -e "${GREEN}Your Netlify comments system is now set up!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Make sure NetlifyComments is added to your quartz.layout.ts"
echo "2. Test the comment form on your site"
echo "3. Access the moderation interface at: https://yoursite.com/admin/comments"
echo ""
echo "🔐 Important security notes:"
echo "- Your moderation token is stored securely in Netlify"
echo "- Only share the moderation URL with trusted moderators"
echo "- The token is required to access the moderation interface"
echo ""
echo "📧 Moderation interface:"
echo "- URL: https://yoursite.com/admin/comments"
echo "- Use the moderation token when prompted"
if [ ! -z "$CURRENT_TOKEN" ]; then
    echo -e "- Your token: ${YELLOW}[Hidden for security]${NC}"
else
    echo "- Get your token with: netlify env:get COMMENT_MODERATION_TOKEN"
fi
echo ""
echo "📚 Documentation:"
echo "- See NETLIFY_COMMENTS.md for detailed configuration options"
echo "- Visit https://docs.netlify.com/forms/ for Netlify Forms documentation"
echo ""
echo -e "${GREEN}Happy blogging! 🌟${NC}"
