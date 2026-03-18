# Branch Protection Setup

To prevent accidental pushes to production, set up branch protection on main:

## Steps (do this once in GitHub)

1. Go to: https://github.com/gumazito/studyflow/settings/branches
2. Click "Add branch protection rule"
3. Branch name pattern: main
4. Enable these options:
   - [x] Require a pull request before merging
   - [x] Require status checks to pass before merging
     - Search and add: "structural-tests"
   - [x] Require branches to be up to date before merging
5. Click "Create"

## What This Means

- You can no longer push directly to main
- All changes go through a Pull Request
- The test suite must pass before merging
- This prevents broken code from reaching production

## Workflow After Protection

1. In GitHub Desktop: create new branch (e.g., "update-feature")
2. Make changes, commit, push the branch
3. Go to GitHub.com and create a Pull Request
4. Wait for tests to pass (green checkmark)
5. Click "Merge pull request"
6. Production auto-deploys

## Note
You can skip this for now and add it later when you have
other people contributing. For solo development, pushing
directly to main is fine.
