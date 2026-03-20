# StudyFlow Staging Environment Guide

## Architecture

StudyFlow uses a branch-based deployment strategy with separate Firebase projects:

| Environment | Branch | Firebase Project | URL |
|-------------|--------|-----------------|-----|
| Development | feature/* | studyflow-app (local) | localhost:3000 |
| Staging | staging | studyflow-staging | studyflow-staging.web.app |
| Production | main | studyflow-app | studyflow-app.web.app |

## Setting Up Staging

### 1. Create Staging Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project called `studyflow-staging`
3. Enable Authentication (Email/Password)
4. Create Firestore database (test mode)
5. Copy the config values

### 2. Create Staging Environment File

Copy `.env.staging.example` to `.env.staging.local` and fill in the staging Firebase credentials.

### 3. Deploy to Staging

```bash
# Build with staging env
cp .env.staging.local .env.local
npm run build

# Deploy to staging
npm run deploy:staging
```

Or use the CI/CD pipeline: push to the `staging` branch and GitHub Actions handles it automatically.

## Local Development

```bash
# Copy .env.example to .env.local and fill in your dev Firebase credentials
cp .env.example .env.local

# Start dev server
npm run dev
```

## Workflow

1. Create a feature branch from `main`
2. Make changes, test locally with `npm run dev`
3. Run `npm run type-check` and `npm run lint` to verify
4. Push branch and create PR to `staging`
5. CI runs: lint, type-check, build, structural tests
6. Merge to `staging` — auto-deploys to staging Firebase
7. QA on staging environment
8. Create PR from `staging` to `main`
9. Merge to `main` — auto-deploys to production

## Data Isolation

Staging uses a completely separate Firebase project, so:
- Test accounts don't affect production
- You can freely delete/modify test data
- Security rules can be tested without risk

To seed staging with test data, create test accounts manually or use the migration script:
```bash
npx ts-node scripts/migrate-to-groups.ts
```
