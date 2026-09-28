#!/usr/bin/env bash
# Push this project to your GitHub repo.
# Run this script after extracting the project on your computer.
#
# Usage:
#   1. Create an empty repo on GitHub first (https://github.com/new)
#      Owner: Mehreen676
#      Name:  python-exam-prep-ai
#      DO NOT initialize with README/.gitignore/license.
#   2. Generate a Personal Access Token at https://github.com/settings/tokens
#      (scope: repo). Copy it.
#   3. Run this script. It will ask for your token. The token is not saved
#      anywhere on disk — it lives only in this shell session's memory.
#   4. Done. Your code is now on GitHub.

set -e

REPO_URL="https://github.com/Mehreen676/python-exam-prep-ai.git"

echo "=== Pushing to $REPO_URL ==="
echo ""

# Ask for the token at runtime (do NOT save it anywhere)
read -r -s -p "Paste your GitHub Personal Access Token (ghp_...): " TOKEN
echo ""
echo ""

if [ -z "$TOKEN" ]; then
  echo "No token entered. Aborting."
  exit 1
fi

# Configure your name/email for this repo only
git config user.name "Mehreen Zohair"
git config user.email "Mehreen676@users.noreply.github.com"

# Strip the token out of the URL after we use it (we don't want it in
# .git/config). We push with an inlined credential and then replace the
# remote with the bare URL so nothing is persisted.
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

# Push using the token in the URL temporarily
GIT_ASKPASS=/bin/echo git -c "credential.helper=" push "https://Mehreen676:${TOKEN}@github.com/Mehreen676/python-exam-prep-ai.git" main:main

# Reset the remote to the bare URL (no token saved in .git/config)
git remote set-url origin "$REPO_URL"

echo ""
echo "✅ Done! Your code is at https://github.com/Mehreen676/python-exam-prep-ai"
