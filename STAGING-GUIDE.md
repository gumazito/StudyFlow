# StudyFlow Staging Environment Guide

## How Staging Works

StudyFlow uses a branch-based staging approach:

- **main** branch = Production (auto-deploys to gumazito.github.io/StudyFlow/)
- **staging** branch = Staging (test changes before merging to main)

## Setting Up Staging

### Option 1: Local Testing (Simplest)
Just open index.html directly in your browser from the StudyFlow folder.
This uses the same Firebase database but lets you test UI changes locally before pushing.

### Option 2: Separate Staging Firebase (Recommended for data isolation)

1. Create a second Firebase project called "studyflow-staging"
2. Copy the config and create a staging version of index.html
3. Use environment detection to switch configs:

The app already supports this. Add ?staging=true to the URL to use staging mode.

### Option 3: GitHub Branch + Netlify (Full Isolation)

1. Create a "staging" branch in GitHub Desktop
2. Connect it to Netlify for free hosting at studyflow-staging.netlify.app
3. Test everything on Netlify before merging to main

## Workflow

1. Create a new branch in GitHub Desktop (e.g., "feature/new-thing")
2. Make changes to index.html
3. Test locally by opening the file in your browser
4. Commit and push the branch
5. GitHub Actions runs the test suite automatically
6. If tests pass, create a Pull Request to merge into main
7. Review the changes, then merge
8. GitHub Actions auto-deploys to production

## Data Mirroring

To test with production-like data in staging:
1. Go to Firebase Console > Firestore
2. Export your production data (three dots menu > Export)
3. Import into your staging project

Or use the app in staging mode — create test accounts and test courses
that mirror your production setup.
