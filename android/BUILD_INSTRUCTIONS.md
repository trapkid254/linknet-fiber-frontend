# Build Linknet Fiber Android APK

## Prerequisites
- **Android Studio** installed (required for building)
- **JDK 8 or higher** installed
- **Android SDK** (API 21 - 33) installed via Android Studio

## Quick Start (Recommended)

### Step 1: Install Android Studio
1. Download from https://developer.android.com/studio
2. Install and open Android Studio
3. Go to SDK Manager and install:
   - Android SDK Platform 33
   - Android SDK Build-Tools 33.0.0
   - Android SDK Platform-Tools

### Step 2: Build the APK
1. Open Android Studio
2. **File → Open** → Navigate to `android/` folder in this project
3. Wait for Gradle sync to complete (may take a few minutes)
4. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
5. Wait for build to complete
6. Click "locate" in the notification or find at: `app/build/outputs/apk/debug/app-debug.apk`

### Step 3: Copy APK to frontend
1. Copy `app-debug.apk` to `frontend/linknet-fiber.apk`
2. The download page will now serve the working APK

## Alternative: Online Build Services

If you don't have Android Studio installed, you can use online services:
- **AppGeyser**: https://appgeyser.com/ (Convert website to APK)
- **PWABuilder**: https://www.pwabuilder.com/ (PWA to APK)
- **GoNative**: https://gonative.io/ (PWA to native app)

Simply enter your URL: `https://trapkid254.github.io/linknet-fiber-frontend` and they'll generate the APK for you.

## Build Release APK (Signed)

For production use, you need a signed release APK:

1. **Generate Keystore**
   ```bash
   keytool -genkey -v -keystore linknet-fiber.keystore -alias linknet -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing in app/build.gradle**
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file("linknet-fiber.keystore")
               storePassword "your_keystore_password"
               keyAlias "linknet"
               keyPassword "your_key_password"
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled true
               proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

3. **Build release APK**
   ```bash
   ./gradlew assembleRelease
   ```

4. **Locate APK**
   - Find it at: `app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

### Gradle sync fails
- Check internet connection
- Update Android SDK in SDK Manager
- Try File → Invalidate Caches / Restart

### Build fails
- Ensure JDK 8+ is installed
- Check Android SDK is installed for API 33
- Run `./gradlew clean` then rebuild

### APK won't install
- Enable "Install from Unknown Sources" on device
- Check Android version compatibility (minSdk 21)
- Ensure APK is not corrupted

## App Configuration

The app is configured to load:
- URL: `https://linknet-fiber-backend.onrender.com`
- Package: `com.linknet.fiber`
- Min SDK: 21 (Android 5.0)
- Target SDK: 33 (Android 13)

To change the loaded URL, edit `MainActivity.java`:
```java
webView.loadUrl("https://your-url.com");
```
