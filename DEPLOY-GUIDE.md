# StudyFlow — Production Deployment Guide

This guide walks you through getting StudyFlow live. Follow each step in order.

---

## What You'll Need Open

- **Terminal** (the built-in Mac Terminal app — find it in Applications → Utilities → Terminal)
- **A web browser** (for Firebase Console)

---

## Step 1: Open Terminal and Go to Your Project

Open Terminal and paste this command, then press Enter:

```
cd ~/Development/StudyFlow
```

---

## Step 2: Install Everything

Run these two commands one at a time (paste each, press Enter, wait for it to finish):

```
npm install
```

```
cd functions && npm install && cd ..
```

---

## Step 3: Install Firebase Tools (if not already installed)

```
npm install -g firebase-tools
```

Then log in to Firebase (a browser window will open — log in with your Google account):

```
firebase login
```

---

## Step 4: Enable Firebase Services

Go to your Firebase Console in a browser:
**https://console.firebase.google.com/project/studyflow-f2e7a**

You need to enable these services (click each one in the left sidebar):

1. **Authentication** → Click "Get Started" → Enable these sign-in providers:
   - Email/Password (toggle ON)
   - Google (toggle ON, add your project's support email)
   - Apple (toggle ON — requires Apple Developer account, can skip for now)
   - Microsoft (toggle ON — requires Azure app registration, can skip for now)

2. **Firestore Database** → Click "Create Database" → Choose "Start in production mode" → Select a region (australia-southeast1 is closest to you)

3. **Storage** → Click "Get Started" → Choose "Start in production mode" → Same region

4. **Functions** → This requires the **Blaze (pay-as-you-go)** plan. Click "Upgrade" in the bottom left. You won't be charged unless usage exceeds the free tier (which is very generous). You need this for Cloud Functions.

5. **Hosting** → Click "Get Started" (we'll deploy from Terminal, just enable it here)

---

## Step 5: Deploy Firestore Security Rules & Indexes

Back in Terminal:

```
firebase deploy --only firestore
```

This sets up your database security rules and search indexes.

---

## Step 6: Build and Deploy Cloud Functions

```
cd functions && npm run build && cd .. && firebase deploy --only functions
```

Wait for this to finish. It may take 2-3 minutes. You should see green checkmarks for each function.

If you see errors about `@sendgrid/mail` or `twilio` — that's OK. Those are optional services. The core functions will still work.

---

## Step 7: Build and Deploy the Website

```
npm run build
```

If the build succeeds (you'll see "Export successful"), deploy it:

```
firebase deploy --only hosting
```

When it finishes, it will show you your live URL — something like:
**https://studyflow-f2e7a.web.app**

That's your site! Open it in a browser to check.

---

## Step 8: Commit Everything to Git

Back in Terminal:

```
git add -A
git commit -m "Complete Phase 8: Premium tiers, content moderation, scheduled notifications, background audio, video upload, deployment config"
git push origin main
```

---

## Step 9 (Optional): Set Up Cloud Function Secrets

These are only needed if you want specific features to work. Each one is optional:

**For Stripe payments** (premium subscriptions):
```
firebase functions:config:set stripe.secret_key="sk_live_YOUR_KEY"
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_KEY"
firebase functions:config:set stripe.price_id_monthly="price_YOUR_ID"
firebase functions:config:set stripe.price_id_yearly="price_YOUR_ID"
firebase functions:config:set app.url="https://studyflow-f2e7a.web.app"
```

**For SendGrid emails** (weekly summaries, notifications):
```
firebase functions:config:set sendgrid.api_key="SG.YOUR_KEY"
firebase functions:config:set sendgrid.from_email="noreply@studyflow.app"
```

**For Spotify integration**:
```
firebase functions:config:set spotify.client_id="YOUR_CLIENT_ID"
firebase functions:config:set spotify.client_secret="YOUR_CLIENT_SECRET"
firebase functions:config:set spotify.redirect_uri="https://us-central1-studyflow-f2e7a.cloudfunctions.net/spotifyCallback"
```

**For Text-to-Speech** (podcast mode):
```
firebase functions:config:set openai.api_key="sk-YOUR_KEY"
```

After setting any of these, redeploy functions:
```
firebase deploy --only functions
```

---

## Troubleshooting

**"Error: No project active"**
Run: `firebase use studyflow-f2e7a`

**"Permission denied" on deploy**
Make sure you're logged in: `firebase login`

**Build fails with TypeScript errors**
Try: `npx next build` — if it shows specific errors, let me know and I'll fix them.

**"Error: Functions directory does not exist"**
Make sure you're in the StudyFlow folder: `cd ~/Development/StudyFlow`

**Site shows blank page after deploy**
Check that `.env.local` has your Firebase config. The file should NOT be committed to git (it's in .gitignore), but it needs to exist on your machine for the build.

---

## Quick Reference — Future Deploys

After making changes, the process is just:

```
cd ~/Development/StudyFlow
npm run build
firebase deploy --only hosting
git add -A
git commit -m "Description of changes"
git push origin main
```

If you changed Cloud Functions:
```
npm run deploy:functions
```

---

*Your live URL: https://studyflow-f2e7a.web.app*
*Firebase Console: https://console.firebase.google.com/project/studyflow-f2e7a*
