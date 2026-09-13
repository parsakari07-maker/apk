import JSZip from 'jszip';
import { ANDROID_FILES } from '../data/sourceCode';

/**
 * Utility to generate a 100% complete, ready-to-upload GitHub repository zip
 * containing Android Gradle project + GitHub Actions CI/CD workflow (.github/workflows/build-apk.yml).
 */
export async function generateGitHubProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // 1. GitHub Actions CI/CD Workflow for automated cloud APK compilation
  zip.file(
    '.github/workflows/build-apk.yml',
    `name: Build NetMaster Android APK

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout Repository
      uses: actions/checkout@v4

    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
        cache: gradle

    - name: Grant Execute Permission for Gradlew
      run: chmod +x gradlew

    - name: Build Android Debug APK
      run: ./gradlew assembleDebug --stacktrace

    - name: Upload APK Artifact
      uses: actions/upload-artifact@v4
      with:
        name: NetMaster-OfflineSuite-APK
        path: app/build/outputs/apk/debug/app-debug.apk
        retention-days: 14
`
  );

  // 2. Root Project configuration
  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "NetMaster"
include(":app")
`
  );

  zip.file(
    'build.gradle.kts',
    `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
`
  );

  zip.file(
    'gradle.properties',
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`
  );

  // 3. Gradle Version Catalog
  zip.file(
    'gradle/libs.versions.toml',
    `[versions]
agp = "8.7.2"
kotlin = "2.0.0"
coreKtx = "1.15.0"
lifecycleRuntimeKtx = "2.8.7"
activityCompose = "1.9.3"
composeBom = "2024.10.01"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-compose-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-compose-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-compose-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-compose-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-compose-material-icons-extended = { group = "androidx.compose.material", name = "material-icons-extended" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
`
  );

  // 4. Gradle Wrapper
  zip.file(
    'gradle/wrapper/gradle-wrapper.properties',
    `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.9-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
  );

  // Executable Gradle wrapper shell script
  zip.file(
    'gradlew',
    `#!/bin/sh
APP_BASE_NAME=\`basename "$0"\`
CLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar
exec gradle "\$@"
`,
    { unixPermissions: '755' }
  );

  zip.file(
    'gradlew.bat',
    `@rem NetMaster Gradle Wrapper for Windows
@if "%DEBUG%" == "" @echo off
gradle %*
`
  );

  // 5. App Module & Source Kotlin files from ANDROID_FILES
  Object.values(ANDROID_FILES).forEach((file) => {
    zip.file(file.path, file.code);
  });

  // 6. Theme & Settings Kotlin (additional standalone compatibility helpers)
  zip.file(
    'app/src/main/java/com/localnet/netmaster/theme/ThemeManager.kt',
    `package com.localnet.netmaster.theme

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.dataStore by preferencesDataStore(name = "netmaster_settings")

enum class AppThemeMode {
    LIGHT,
    DARK,
    SYSTEM
}

class ThemeManager(private val context: Context) {
    companion object {
        val THEME_KEY = stringPreferencesKey("app_theme_mode")
        val USERNAME_KEY = stringPreferencesKey("app_username")
    }

    val themeModeFlow: Flow<AppThemeMode> = context.dataStore.data.map { preferences ->
        when (preferences[THEME_KEY]) {
            "LIGHT" -> AppThemeMode.LIGHT
            "DARK" -> AppThemeMode.DARK
            else -> AppThemeMode.SYSTEM
        }
    }

    val usernameFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[USERNAME_KEY] ?: "دستگاه تاکتیکی محلی"
    }

    suspend fun setThemeMode(mode: AppThemeMode) {
        context.dataStore.edit { preferences ->
            preferences[THEME_KEY] = mode.name
        }
    }

    suspend fun setUsername(username: String) {
        context.dataStore.edit { preferences ->
            preferences[USERNAME_KEY] = username
        }
    }
}
`
  );

  zip.file(
    'app/src/main/java/com/localnet/netmaster/ui/theme/Color.kt',
    `package com.localnet.netmaster.ui.theme

import androidx.compose.ui.graphics.Color

val SlateBgDark = Color(0xFF111318)
val MutedDarkSurface = Color(0xFF1B1F28)
val DarkSurfaceBorder = Color(0xFF262C38)
val SoftCyan = Color(0xFF4CC9F0)
val MutedIceBlue = Color(0xFF70A5D8)

val SlateBgLight = Color(0xFFF8FAFC)
val MutedLightSurface = Color(0xFFFFFFFF)
val LightSurfaceBorder = Color(0xFFE2E8F0)
val DeepTextLight = Color(0xFF0F172A)
`
  );

  zip.file(
    'app/src/main/java/com/localnet/netmaster/ui/theme/Theme.kt',
    `package com.localnet.netmaster.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import com.localnet.netmaster.theme.AppThemeMode

private val DarkColorScheme = darkColorScheme(
    primary = SoftCyan,
    secondary = MutedIceBlue,
    background = SlateBgDark,
    surface = MutedDarkSurface,
    outline = DarkSurfaceBorder
)

private val LightColorScheme = lightColorScheme(
    primary = MutedIceBlue,
    secondary = SoftCyan,
    background = SlateBgLight,
    surface = MutedLightSurface,
    outline = LightSurfaceBorder
)

@Composable
fun NetMasterTheme(
    themeMode: AppThemeMode = AppThemeMode.DARK,
    content: @Composable () -> Unit
) {
    val darkTheme = when (themeMode) {
        AppThemeMode.DARK -> true
        AppThemeMode.LIGHT -> false
        AppThemeMode.SYSTEM -> isSystemInDarkTheme()
    }

    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
`
  );

  // 7. Complete Instructions README
  zip.file(
    'README.md',
    `# سامانه آفلاین NetMaster Suite (پروژه کامل اندروید برای GitHub Actions)

این مخزن شامل تمام کدهای کامل، مانیفست، ماژول‌ها و اکشن اتوماتیک گیت‌هاب برای کامپایل فایل نصبی APK اندروید به صورت ۱۰۰٪ ابری و رایگان است.

## مراحل دریافت فایل نصبی (APK) با گیت‌هاب در ۳ دقیقه:
1. در سایت **GitHub.com** یک مخزن جدید (New Repository) با نام دلخواه (مثلاً \`NetMaster-Android\`) بسازید.
2. تمام محتویات این پوشه زیپ را داخل مخزن گیت‌هاب آپلود کنید (یا از دکمه Upload files استفاده کنید).
3. به برگه **Actions** در بالای مخزن گیت‌هاب خود بروید. می‌بینید که اکشن \`Build NetMaster Android APK\` به صورت خودکار شروع به ساخت برنامه می‌کند.
4. پس از حدود ۲ دقیقه، عملیات سبز شده و فایل نهایی \`NetMaster-OfflineSuite-APK\` در بخش **Artifacts** برای دانلود مستقیم در اختیار شما قرار می‌گیرد!
`
  );

  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
