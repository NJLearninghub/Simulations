# NJ Learning Hub — Simulation App

React Native Expo app for browsing and viewing academic HTML simulations, filtered by class/standard and subject.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) and create a project
2. Add an Android app with package name `com.njlearninghub.simulations`
3. Enable **Firestore Database** (start in test mode)
4. Enable **Storage** (start in test mode)
5. Go to Project Settings → Your apps → SDK snippet → **Config**
6. Copy the config values into `src/config/firebase.js`

### 3. Run the app
```bash
npx expo start
```
Scan the QR code with **Expo Go** on your Android device.

## Adding Simulations (Admin)

1. Open the app
2. Tap the blue banner **5 times** quickly
3. Enter PIN (default: `1234`)
4. Fill in Title, Class, Subject
5. Tap **Pick HTML File** and select your `.html` simulation file
6. Tap **Upload Simulation**

The simulation will appear immediately for all users.

## Building an APK

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

## Firestore Security Rules (recommended for production)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /simulations/{doc} {
      allow read: if true;
      allow write: if false;  // enforce writes via Admin SDK or Firebase Auth
    }
  }
}
```
