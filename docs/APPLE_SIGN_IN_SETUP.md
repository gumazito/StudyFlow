# Apple Sign In — Complete Setup Guide for StudyFlow

## Overview
Apple Sign In is already coded in StudyFlow (`OAuthProvider('apple.com')`).
You just need to configure it in both the Apple Developer Console and Firebase Console.

---

## Prerequisites
- Apple Developer Account ($99/year) — https://developer.apple.com/programs/
- Access to Firebase Console for studyflow-f2e7a

---

## Step 1: Apple Developer Console

### 1.1 Create an App ID
1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click **"+"** → Select **"App IDs"** → Continue
3. Select **"App"** type → Continue
4. Fill in:
   - **Description:** `StudyFlow`
   - **Bundle ID:** `com.studyflow.app` (Explicit)
5. Scroll down to **Capabilities** → Check **"Sign In with Apple"**
6. Click **Continue** → **Register**

### 1.2 Create a Services ID (for web login)
1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click **"+"** → Select **"Services IDs"** → Continue
3. Fill in:
   - **Description:** `StudyFlow Web`
   - **Identifier:** `com.studyflow.web` (this becomes your OAuth client ID)
4. Click **Continue** → **Register**
5. Click on the newly created Services ID
6. Check **"Sign In with Apple"** → Click **Configure**
7. In the configuration:
   - **Primary App ID:** Select `StudyFlow` (com.studyflow.app)
   - **Domains and Subdomains:** Add:
     ```
     studyflow-f2e7a.firebaseapp.com
     studyflow-f2e7a.web.app
     ```
     (Add your custom domain too if you have one)
   - **Return URLs:** Add:
     ```
     https://studyflow-f2e7a.firebaseapp.com/__/auth/handler
     ```
8. Click **Save** → **Continue** → **Save**

### 1.3 Create a Private Key
1. Go to https://developer.apple.com/account/resources/authkeys/list
2. Click **"+"** to create a new key
3. **Key Name:** `StudyFlow Sign In`
4. Check **"Sign In with Apple"** → Click **Configure**
5. Select **Primary App ID:** `StudyFlow` (com.studyflow.app)
6. Click **Save** → **Continue** → **Register**
7. **IMPORTANT:** Download the `.p8` key file — you can only download it once!
8. Note the **Key ID** (shown on the key details page)

### 1.4 Note Your Team ID
1. Go to https://developer.apple.com/account/#/membership
2. Your **Team ID** is shown on this page (10-character alphanumeric)

---

## Step 2: Firebase Console

1. Go to https://console.firebase.google.com/project/studyflow-f2e7a/authentication/providers
2. Click **"Apple"** in the sign-in providers list
3. Click **Enable**
4. Fill in:
   - **Service ID:** `com.studyflow.web` (from Step 1.2)
   - **Apple Team ID:** Your team ID (from Step 1.4)
   - **Key ID:** The key ID (from Step 1.3)
   - **Private Key:** Open the `.p8` file in a text editor, copy the entire contents including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines
5. Click **Save**

---

## Step 3: Test It

1. Deploy StudyFlow: `bash deploy-all.sh`
2. Open https://studyflow-f2e7a.web.app
3. Click the Apple sign-in button
4. You should see Apple's sign-in popup

### Common Issues:
- **"Invalid client_id"** → Services ID doesn't match Firebase config
- **"Redirect URI mismatch"** → Return URL in Apple Console doesn't match Firebase auth handler
- **Popup blocked** → User needs to allow popups for the domain
- **"Sign In with Apple is not available"** → Enable it in the App ID capabilities

---

## Step 4: For Future iOS App (React Native/Expo)

When you build the mobile app, you'll use the App ID (com.studyflow.app) directly:

```bash
# In Expo/React Native
npx expo install expo-apple-authentication
```

The Bundle ID in your app.json must match `com.studyflow.app`.

---

## Summary of Values to Save

| Item | Value |
|------|-------|
| App ID (Bundle ID) | `com.studyflow.app` |
| Services ID | `com.studyflow.web` |
| Team ID | (from Apple membership page) |
| Key ID | (from the .p8 key you created) |
| Private Key | (contents of the .p8 file) |

---

## Estimated Time: 15-20 minutes
