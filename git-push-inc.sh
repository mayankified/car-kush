#!/bin/bash

# Exit if any command fails
set -e

# Default base commit message
BASE_MESSAGE="Update code"

# Get last commit message
LAST_MSG=$(git log -1 --pretty=%B 2>/dev/null || echo "")

# Extract last number from commit message
if [[ $LAST_MSG =~ \#([0-9]+) ]]; then
  LAST_NUM=${BASH_REMATCH[1]}
  NEXT_NUM=$((LAST_NUM + 1))
else
  NEXT_NUM=1
fi

COMMIT_MESSAGE="$BASE_MESSAGE #$NEXT_NUM"

echo "📌 Commit message: $COMMIT_MESSAGE"

git add .
git commit -m "$COMMIT_MESSAGE"
git push

echo "✅ Pushed successfully"
