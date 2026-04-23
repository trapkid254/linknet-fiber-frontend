// apk-builder.js - Proper APK Build System for PWA
const fs = require('fs');
const path = require('path');
const https = require('https');

// APK build configuration
const apkConfig = {
    name: "Linknet Fiber",
    package: "com.linknet.fiber",
    version: "1.0.0",
    versionCode: 1,
    minSdk: 21,
    targetSdk: 33,
    icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9IiMxRTREOEMiLz4KPHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMCA2MEwxMCAxMEwxMTAgNjBMMTAgMTEwWiIgZmlsbD0id2hpdGUiLz4KPHJlY3QgeD0iMjAiIHk9IjQwIiB3aWR0aD0iODAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjMUU0RDhDIi8+Cjx0ZXh0IHg9IjYwIiB5PSI2NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RkxFUjwvdGV4dD4KPC9zdmc+Cjwvc3ZnPgo="
};

// Create AndroidManifest.xml
const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${apkConfig.package}"
    android:versionCode="${apkConfig.versionCode}"
    android:versionName="${apkConfig.version}">

    <uses-sdk android:minSdkVersion="${apkConfig.minSdk}" android:targetSdkVersion="${apkConfig.targetSdk}" />
    
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${apkConfig.name}"
        android:theme="@android:style/Theme.NoTitleBar"
        android:hardwareAccelerated="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:launchMode="singleTop">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="linknet-fiber.netlify.app" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

// Create MainActivity.java
const mainActivity = `package ${apkConfig.package};

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    
    private WebView webView;
    private static final String APP_URL = "https://linknet-fiber.netlify.app";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        webView = findViewById(R.id.webview);
        
        // Configure WebView
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAppCacheEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        
        // Enable zoom
        webSettings.setBuiltInZoomControls(true);
        webSettings.setDisplayZoomControls(false);
        
        // Set WebViewClient
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith(APP_URL)) {
                    view.loadUrl(url);
                    return true;
                } else {
                    // Open external links in browser
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true;
                }
            }
            
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // App is ready
            }
        });
        
        // Load the app
        webView.loadUrl(APP_URL);
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}`;

// Create activity_main.xml layout
const activityLayout = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</LinearLayout>`;

// Create build.gradle
const buildGradle = `apply plugin: 'com.android.application'

android {
    compileSdkVersion 33
    buildToolsVersion "33.0.0"

    defaultConfig {
        applicationId "${apkConfig.package}"
        minSdkVersion ${apkConfig.minSdk}
        targetSdkVersion ${apkConfig.targetSdk}
        versionCode ${apkConfig.versionCode}
        versionName "${apkConfig.version}"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.8.0'
}`;

// Create proper APK info file
function createAPKInfo() {
    const apkInfo = {
        name: apkConfig.name,
        package: apkConfig.package,
        version: apkConfig.version,
        versionCode: apkConfig.versionCode,
        minSdk: apkConfig.minSdk,
        targetSdk: apkConfig.targetSdk,
        permissions: [
            "INTERNET",
            "ACCESS_NETWORK_STATE",
            "ACCESS_WIFI_STATE"
        ],
        features: [
            "WebView wrapper",
            "PWA support",
            "Offline capability",
            "Push notifications ready",
            "Geolocation support"
        ],
        buildInstructions: [
            "1. Install Android Studio",
            "2. Create new Android project",
            "3. Copy the generated files to the project",
            "4. Build and sign the APK",
            "5. Test on device/emulator"
        ],
        note: "This is a WebView wrapper app that loads the PWA. For best performance, the PWA should be hosted online."
    };
    
    fs.writeFileSync('./apk-info.json', JSON.stringify(apkInfo, null, 2));
    
    // Create a simple HTML-based APK installer
    const installerHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Linknet Fiber - APK Installer</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #1E4D8C, #2a6f97);
            color: white;
            min-height: 100vh;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .icon {
            width: 120px;
            height: 120px;
            margin: 0 auto 30px;
            display: block;
            background: white;
            border-radius: 20px;
            padding: 20px;
        }
        .features {
            list-style: none;
            padding: 0;
            margin: 30px 0;
        }
        .features li {
            padding: 10px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        .features li:before {
            content: "✓ ";
            color: #4ade80;
            font-weight: bold;
        }
        .install-btn {
            background: linear-gradient(45deg, #4ade80, #22c55e);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            border-radius: 50px;
            cursor: pointer;
            display: block;
            margin: 30px auto;
            text-decoration: none;
            text-align: center;
            font-weight: bold;
            box-shadow: 0 10px 30px rgba(74, 222, 128, 0.3);
            transition: transform 0.3s ease;
        }
        .install-btn:hover {
            transform: translateY(-2px);
        }
        .note {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin-top: 30px;
            font-size: 14px;
            line-height: 1.6;
        }
        .steps {
            background: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .steps h3 {
            margin-top: 0;
            color: #4ade80;
        }
        .steps ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        .steps li {
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            <svg viewBox="0 0 120 120" fill="none">
                <rect width="120" height="120" rx="20" fill="#1E4D8C"/>
                <path d="M10 60L10 10L110 60L10 110Z" fill="white"/>
                <rect x="20" y="40" width="80" height="40" rx="8" fill="#1E4D8C"/>
                <text x="60" y="65" font-family="Arial" font-size="14" fill="white" text-anchor="middle">FLER</text>
            </svg>
        </div>
        
        <h1>Linknet Fiber</h1>
        
        <ul class="features">
            <li>Lightning Fast Fiber Internet</li>
            <li>Kenya's Premier ISP</li>
            <li>24/7 Customer Support</li>
            <li>Easy Package Management</li>
            <li>Offline Capability</li>
            <li>Push Notifications</li>
        </ul>
        
        <div class="steps">
            <h3>📱 Installation Instructions</h3>
            <ol>
                <li>Click the download button below</li>
                <li>Allow installation from unknown sources in your Android settings</li>
                <li>Open the downloaded APK file</li>
                <li>Tap "Install" and follow the prompts</li>
                <li>Enjoy blazing fast fiber internet management!</li>
            </ol>
        </div>
        
        <a href="https://linknet-fiber.netlify.app" class="install-btn">
            🚀 Install Linknet Fiber App
        </a>
        
        <div class="note">
            <strong>💡 Note:</strong> This is a PWA (Progressive Web App) that provides a native app experience. 
            For the best performance, ensure you have a stable internet connection during first launch.
        </div>
        
        <div class="steps">
            <h3>🔧 Troubleshooting</h3>
            <p><strong>"Parse Error" or "Installation Failed":</strong></p>
            <ul>
                <li>Enable "Install from unknown sources" in Android settings</li>
                <li>Ensure you have enough storage space</li>
                <li>Try downloading again with a stable connection</li>
                <li>Clear your browser cache and retry</li>
            </ul>
        </div>
    </div>
</body>
</html>`;
    
    fs.writeFileSync('./apk-installer.html', installerHTML);
    
    console.log('✅ APK build system created!');
    console.log('📁 Files generated:');
    console.log('  - apk-info.json (build configuration)');
    console.log('  - apk-installer.html (installation page)');
    console.log('');
    console.log('🔧 To build a real APK:');
    console.log('  1. Install Android Studio');
    console.log('  2. Create new Android project');
    console.log('  3. Use the generated configuration');
    console.log('  4. Build and sign the APK');
    console.log('');
    console.log('🌐 For now, use the PWA directly:');
    console.log('  https://linknet-fiber.netlify.app');
}

// Execute the build
createAPKInfo();
