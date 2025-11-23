#!/bin/bash

# TaskFlow Deployment Aliases
# Source this file to use the aliases: source taskflow_aliases.sh

# Build and preview locally
alias deploy-local="npm run deploy:local"

# Build for production
alias build-prod="npm run build:prod"

# Deploy to Firebase hosting
alias deploy-prod="npm run deploy:prod"

echo "TaskFlow aliases loaded: deploy-local, build-prod, deploy-prod"
