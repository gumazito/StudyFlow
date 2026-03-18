# StudyFlow — Setup & Deployment Guide

Follow these steps to get StudyFlow live on the internet so you and your daughter can use it from any device.

**What you'll end up with:** A free website (like `yourname.github.io/studyflow`) where you log in as Author to create courses, and your daughter logs in as Student to learn and take tests. Updates you make automatically go live.

---

## Step 1: Set Up Firebase (Free — handles login and data storage)

Firebase gives you real user accounts and a database for free. Here's how:

1. Go to **https://console.firebase.google.com**
2. Click **"Create a project"** (or "Add project")
3. Name it `studyflow` → click Continue
4. Turn OFF Google Analytics (you don't need it) → click **Create Project**
5. Wait for it to finish, then click **Continue**

### Enable Email/Password Login

1. In the Firebase console, click **"Authentication"** in the left sidebar
2. Click **"Get started"**
3. Click **"Email/Password"** under "Sign-in providers"
4. Toggle the **first switch ON** (Email/Password) → click **Save**

### Create Your Database

1. Click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** → click **Next**
4. Pick the location closest to you (e.g. `australia-southeast1` for Australia) → click **Enable**

### Get Your Config Keys

1. Click the **gear icon** (⚙️) next to "Project Overview" → click **"Project settings"**
2. Scroll down to **"Your apps"** section
3. Click the **web icon** (`</>`) to add a web app
4. Name it `StudyFlow` → click **Register app**
5. You'll see a code block with `firebaseConfig`. **Copy these values** — you need them in Step 2:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

---

## Step 2: Add Your Firebase Config to the App

1. Open the `studyflow.html` file in a text editor (right-click → Open With → Notepad or TextEdit)
2. Find this section near the top of the file (search for `PASTE YOUR`):

```
apiKey: "PASTE YOUR API KEY HERE",
authDomain: "PASTE YOUR AUTH DOMAIN HERE",
projectId: "PASTE YOUR PROJECT ID HERE",
```

3. Replace each `PASTE YOUR...` value with the actual values from Step 1
4. Save the file

---

## Step 3: Create Your Author Account

1. Open `studyflow.html` in your browser (just double-click it)
2. Click **"Create Account"**
3. Enter your name, email, and password
4. Select role: **Author**
5. Click **Sign Up**

You're now logged in as an Author and can create learning packages!

---

## Step 4: Deploy to GitHub Pages (Free)

This puts your app on the internet so anyone with the link can access it.

1. Go to **https://github.com** and log in
2. Click the **"+"** button (top right) → **"New repository"**
3. Name it `studyflow`
4. Make sure **"Public"** is selected
5. Check **"Add a README file"**
6. Click **"Create repository"**

### Upload Your File

1. In your new repository, click **"Add file"** → **"Upload files"**
2. Drag your `studyflow.html` file into the upload area
3. **IMPORTANT:** Rename the file to `index.html` before uploading (or after — click the pencil icon to rename)
4. Click **"Commit changes"**

### Turn On GitHub Pages

1. Go to your repository's **Settings** tab (gear icon at the top)
2. Click **"Pages"** in the left sidebar
3. Under "Source", select **"Deploy from a branch"**
4. Under "Branch", select **"main"** and **"/ (root)"** → click **Save**
5. Wait 2-3 minutes, then refresh the page
6. You'll see: **"Your site is live at https://yourusername.github.io/studyflow/"**

**That's your URL!** Share it with your daughter.

---

## Step 5: Invite Your Daughter

1. Send your daughter the URL from Step 4
2. She visits it on her phone or laptop
3. She clicks **"Create Account"**
4. She enters her name, email, password, and selects **Student**
5. She can now see all published courses and start learning!

---

## Step 6: Making Updates

Whenever you want to update the app:

1. Go to your GitHub repository
2. Click on `index.html`
3. Click the **pencil icon** (edit)
4. Paste in the updated file content
5. Click **"Commit changes"**
6. Wait 2-3 minutes — the live site automatically updates!

**Or even easier:** Ask me to make changes, I'll give you an updated file, and you just replace it on GitHub.

---

## Securing Your Database (Do This After Testing)

Once everything works, lock down your database so only logged-in users can read/write:

1. Go to Firebase Console → **Firestore Database** → **Rules** tab
2. Replace the rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /packages/{doc} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'author';
    }
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"**

This means: anyone logged in can read packages, but only Authors can create/edit them.

---

## Troubleshooting

**"Firebase not configured" error:** Double-check you pasted the config values correctly in Step 2.

**Can't see the site:** Make sure you renamed the file to `index.html` (not `studyflow.html`) on GitHub.

**Login not working:** Make sure you enabled Email/Password in Firebase Authentication (Step 1).

**Changes not showing:** GitHub Pages can take 2-5 minutes to update. Try a hard refresh (Ctrl+Shift+R).

---

## Cost

Everything in this setup is **completely free**:
- **Firebase**: Free tier covers 50,000 reads/day and 20,000 writes/day (more than enough)
- **GitHub Pages**: Free hosting for public repositories
- **Your domain**: Free subdomain at `yourusername.github.io/studyflow`
