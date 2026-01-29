#!/bin/bash

# PeakActivity Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e

ENV=${1:-production}
PROJECT_ID="peakactivity-$ENV"
FRONTEND_URL="https://$ENV.peakactivity.com"

echo "Deploying to $ENV environment..."

# Check prerequisites
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found. Install with: npm install -g firebase-tools"
    exit 1
fi

if [ ! -f "functions/serviceAccountKey.json" ]; then
    echo "Service account key not found. Please set up Firebase project."
    exit 1
fi

# Use appropriate project
firebase use $PROJECT_ID

# Check if project exists
if ! firebase projects:list | grep -q $PROJECT_ID; then
    echo "Project $PROJECT_ID not found. Creating..."
    firebase projects:create $PROJECT_ID --set-as-default
fi

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build project
echo "Building project..."
npm run build

# Deploy functions
echo "Deploying functions..."
firebase deploy --only functions --project $PROJECT_ID

# Deploy hosting
echo "Deploying hosting..."
firebase deploy --only hosting --project $PROJECT_ID

# Set environment variables
echo "Setting environment variables..."
firebase functions:config:set frontend.url="$FRONTEND_URL" --project $PROJECT_ID

# Run tests
echo "Running tests..."
npm test

echo "Deployment completed successfully for $ENV!"
echo "Frontend: https://$ENV.peakactivity.com"
echo "Functions: https://$ENV-$PROJECT_ID.cloudfunctions.net"

# Rollback procedure (manual)
echo "Rollback: Use Firebase Console to revert to previous version or run:"
echo "firebase deploy --only functions,hosting --version <previous-version> --project $PROJECT_ID"
