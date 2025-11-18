# Offline Translation App

An Ionic Angular application with offline translation capabilities using MLKit.

## Prerequisites

Before building the app, ensure you have the following installed:

- **Node.js** (v20 or higher recommended)
- **npm** or **yarn**
- **Ionic CLI**: `npm install -g @ionic/cli`
- **Capacitor CLI**: `npm install -g @capacitor/cli`

### For Android Development:
- **Android Studio** (latest version)
- **Java Development Kit (JDK)** 11 or higher
- **Android SDK** (installed via Android Studio)
- Set `ANDROID_HOME` environment variable
- Add Android SDK platform-tools to your PATH

### For iOS Development:
- **macOS** (required for iOS development)
- **Xcode** (latest version from App Store)
- **CocoaPods**: `sudo gem install cocoapods`
- **Xcode Command Line Tools**: `xcode-select --install`

## Installation

1. Clone the repository:
```bash
git clone https://github.com/freelancework00700/offline-translation-app.git
cd offline-translation-app
```

2. Install dependencies:
```bash
npm install
```

3. Sync Capacitor platforms:
```bash
npx cap sync
```

## Building for Android

### Step 1: Build the Web Assets

First, build the Angular web application:

```bash
npm run build
```

Or use the convenience script that builds and syncs:

```bash
npm run android
```

### Step 2: Sync Capacitor (if not done automatically)

```bash
npx cap sync android
```

### Step 3: Open in Android Studio

```bash
npx cap open android
```

### Step 4: Build APK from Android Studio

#### Debug APK:
1. In Android Studio, go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Wait for the build to complete
3. Click **locate** in the notification to find your APK
4. The debug APK will be located at: `android/app/build/outputs/apk/debug/app-debug.apk`

## Building for iOS

### Step 1: Build the Web Assets

First, build the Angular web application:

```bash
npm run build
```



### Step 2: Sync Capacitor

```bash
npx cap sync ios
```

### Step 3: Open in Xcode

```bash
npx cap open ios
```

### Step 5: Build from Xcode

1. Select your target device or simulator from the device selector
2. Go to **Product** → **Archive** (for device builds) or **Product** → **Build** (for simulator)
3. For Archive:
   - Once archived, the Organizer window will open
   - Click **Distribute App** to create an IPA file
   - Follow the distribution wizard to export your app

## Important Notes

### Android - MLKit Translation Configuration

Before building for Android, you need to modify the MLKit Translation plugin:

**Location**: `android/capacitor-cordova-android-plugins/src/main/java/[package]/Translation.java`

**Change required**:
- **Old line**: 
  ```java
  DownloadConditions conditions = new DownloadConditions.Builder().requireWifi().build();
  ```
- **New line**: 
  ```java
  DownloadConditions conditions = new DownloadConditions.Builder().build();
  ```

This change allows language model downloads over mobile data, not just WiFi.
