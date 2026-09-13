/**
 * NetMaster Suite: Production-ready Kotlin & Jetpack Compose architecture
 * Operates strictly offline over local Wi-Fi / Hotspot without internet.
 */

export const ANDROID_FILES = {
  manifest: {
    filename: 'AndroidManifest.xml',
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    title: 'فایل مانیفست اندروید (مجوزها، سرویس‌ها و دسترسی به سنسورها)',
    code: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.localnet.netmaster">

    <!-- 🎙️ 1. مجوزهای ضبط و استریم زنده صدا (Walkie-Talkie & NoiseSuppressor) -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <!-- 📷 2. مجوزهای دسترسی به دوربین، فوکوس و فلش (CCTV & Stealth Mode) -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
    <uses-feature android:name="android.hardware.camera.flash" android:required="false" />

    <!-- 🌐 3. مجوزهای ارتباطات شبکه محلی (سوکت UDP، برادکست و سرور HTTP) -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />
    <uses-permission android:name="android.permission.NEARBY_WIFI_DEVICES" android:usesPermissionFlags="neverForLocation" tools:targetApi="33" />

    <!-- 📡 4. سنسورها و موقعیت‌یابی محلی (Wi-Fi RSSI Radar & Compass Gyroscope) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-feature android:name="android.hardware.sensor.compass" android:required="false" />
    <uses-feature android:name="android.hardware.sensor.gyroscope" android:required="false" />

    <!-- 🖥️ 5. ضبط و اشتراک صفحه نمایش (MediaProjection Screen Mirroring) -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />

    <!-- 📁 6. انتقال فایل و ایردراپ محلی (AirDrop HTTP File Transfer) -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" tools:ignore="ScopedStorage" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
    <uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" tools:ignore="ScopedStorage" />

    <!-- 📳 7. سیستم لرزش و هپتیک تاکتیکی (Tactical Haptics) -->
    <uses-permission android:name="android.permission.VIBRATE" />

    <!-- 🔋 8. پایداری در پس‌زمینه و جلوگیری از خاموش شدن پردازنده -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CAMERA" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />

    <application
        android:name=".NetMasterApp"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="NetMaster Suite"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.NetMaster"
        android:usesCleartextTraffic="true"
        tools:targetApi="34">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:windowSoftInputMode="adjustResize"
            android:theme="@style/Theme.NetMaster">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- سرویس پس‌زمینه اشتراک صفحه MediaProjection -->
        <service
            android:name=".service.ScreenMirrorCaptureService"
            android:foregroundServiceType="mediaProjection"
            android:exported="false" />

        <!-- سرویس پس‌زمینه بی‌سیم و دوربین نامرئی -->
        <service
            android:name=".service.NetMasterBackgroundService"
            android:foregroundServiceType="microphone|camera|connectedDevice"
            android:exported="false" />

    </application>

</manifest>`
  },

  gradle: {
    filename: 'build.gradle.kts',
    path: 'app/build.gradle.kts',
    language: 'kotlin',
    title: 'تنظیمات بیلد گریدل و وابستگی‌های مدرن (Jetpack Compose & CameraX & Ktor)',
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
}

android {
    namespace = "com.localnet.netmaster"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.localnet.netmaster"
        minSdk = 26
        targetSdk = 34
        versionCode = 2
        versionName = "2.0.0-PRO"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += listOf(
            "-opt-in=androidx.compose.material3.ExperimentalMaterial3Api",
            "-opt-in=kotlinx.coroutines.ExperimentalCoroutinesApi"
        )
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    // 🎨 1. Jetpack Compose BOM & Material 3
    val composeBom = platform("androidx.compose:compose-bom:2024.06.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // 📷 2. CameraX Suite
    val cameraxVersion = "1.3.4"
    implementation("androidx.camera:camera-core:$cameraxVersion")
    implementation("androidx.camera:camera-camera2:$cameraxVersion")
    implementation("androidx.camera:camera-lifecycle:$cameraxVersion")
    implementation("androidx.camera:camera-view:$cameraxVersion")

    // 🌐 3. سرور سبک HTTP و WebSocket برای انتقال فایل و استریم (Ktor Embedded Server)
    val ktorVersion = "2.3.11"
    implementation("io.ktor:ktor-server-core:$ktorVersion")
    implementation("io.ktor:ktor-server-cio:$ktorVersion")
    implementation("io.ktor:ktor-server-websockets:$ktorVersion")
    implementation("io.ktor:ktor-client-core:$ktorVersion")
    implementation("io.ktor:ktor-client-cio:$ktorVersion")

    // ⚡ 4. اسکنر بارکد ML Kit و تولید QR با ZXing
    implementation("com.google.mlkit:barcode-scanning:17.3.0")
    implementation("com.google.zxing:core:3.5.3")

    // 🧵 5. Coroutines & Lifecycle
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.3")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.3")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")

    // 💾 6. ذخیره‌سازی ترجیحات کاربر و تم ظاهری با Jetpack DataStore
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // 🌐 7. WebView Asset Loader برای بارگذاری امن محلی و فعال‌سازی کامل getUserMedia و دسترسی سنسورها
    implementation("androidx.webkit:webkit:1.12.1")
}
`
  },

  netMasterApp: {
    filename: 'NetMasterApp.kt',
    path: 'app/src/main/java/com/localnet/netmaster/NetMasterApp.kt',
    language: 'kotlin',
    title: 'کلاس اصلی اپلیکیشن اندروید (Application Base Class)',
    code: `package com.localnet.netmaster

import android.app.Application

/**
 * 🚀 کلاس اصلی اپلیکیشن برای مقداردهی اولیه‌ی سرویس‌ها و تنظیمات سیستمی
 */
class NetMasterApp : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}
`
  },

  mainActivity: {
    filename: 'MainActivity.kt',
    path: 'app/src/main/java/com/localnet/netmaster/MainActivity.kt',
    language: 'kotlin',
    title: 'اکتیویتی اصلی، مدیریت تمام صفحه Edge-to-Edge، بارگذاری امن با WebViewAssetLoader و پل ارتباطی UDP و مجوزها',
    code: `package com.localnet.netmaster

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.webkit.*
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader
import org.json.JSONObject
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.Inet4Address
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.NetworkInterface

/**
 * 📱 اکتیویتی اصلی با اجرای تمام‌صفحه بدون نوار اضافه (Edge-to-Edge)
 * بارگذاری امن محلی با WebViewAssetLoader جهت فعال‌سازی getUserMedia و وب‌کم/میکروفون
 * و پل کامل ارتباطی بین وب‌ویو و سوکت‌های UDP و مجوزهای سخت‌افزاری اندروید
 */
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private var pendingPermissionRequest: PermissionRequest? = null
    private val networkBridge = AndroidNetworkBridge()

    // مدیریت دریافت چندگانه مجوزهای سیستمی اندروید با ActivityResultContracts
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissionsResult ->
        runOnUiThread {
            val micGranted = hasMicrophonePermission()
            val camGranted = hasCameraPermission()

            // پاسخ دقیق به درخواست رسانه‌ای وب‌ویو
            pendingPermissionRequest?.let { req ->
                val grantedList = mutableListOf<String>()
                for (res in req.resources) {
                    if (res == PermissionRequest.RESOURCE_AUDIO_CAPTURE && micGranted) {
                        grantedList.add(PermissionRequest.RESOURCE_AUDIO_CAPTURE)
                    }
                    if (res == PermissionRequest.RESOURCE_VIDEO_CAPTURE && camGranted) {
                        grantedList.add(PermissionRequest.RESOURCE_VIDEO_CAPTURE)
                    }
                }
                if (grantedList.isNotEmpty()) {
                    req.grant(grantedList.toTypedArray())
                } else {
                    req.deny()
                }
                pendingPermissionRequest = null
            }

            // مخابره رویداد وضعیت زنده مجوزها به لایه جاوااسکریپت و React UI
            permissionsResult.forEach { (permission, isGranted) ->
                val shortName = when (permission) {
                    Manifest.permission.RECORD_AUDIO -> "microphone"
                    Manifest.permission.CAMERA -> "camera"
                    Manifest.permission.POST_NOTIFICATIONS -> "notification"
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION -> "location"
                    Manifest.permission.READ_EXTERNAL_STORAGE,
                    Manifest.permission.WRITE_EXTERNAL_STORAGE,
                    Manifest.permission.READ_MEDIA_IMAGES,
                    Manifest.permission.READ_MEDIA_VIDEO,
                    Manifest.permission.READ_MEDIA_AUDIO -> "storage"
                    else -> permission
                }

                val permanentlyDenied = !isGranted && !shouldShowRequestPermissionRationale(permission)

                webView.evaluateJavascript(
                    "if (window.dispatchEvent) { window.dispatchEvent(new CustomEvent('androidPermissionChanged', { detail: { permission: '$shortName', granted: $isGranted, permanentlyDenied: $permanentlyDenied } })); }",
                    null
                )
            }

            // ارسال رویداد جامع اتمام بسته مجوزها
            webView.evaluateJavascript(
                "if (window.dispatchEvent) { window.dispatchEvent(new CustomEvent('androidPermissionChanged', { detail: { permission: 'all', granted: true } })); }",
                null
            )
        }
    }

    fun hasMicrophonePermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED
    }

    fun hasCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }

    fun hasNotificationPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
    }

    fun hasStoragePermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.READ_MEDIA_IMAGES
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.READ_EXTERNAL_STORAGE
            ) == PackageManager.PERMISSION_GRANTED
        }
    }

    fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // اجرای صددرصد تمام‌صفحه لبه‌به‌لبه بدون حاشیه (Edge-to-Edge)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        // پیکربندی استاندارد WebViewAssetLoader برای پشتیبانی معتبر از پروتکل امن و اجازه اجرای WebRTC/getUserMedia
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                mediaPlaybackRequiresUserGesture = false
            }

            // مدیریت خودکار فاصله نوار وضعیت و نوار ناوبری پایین صفحه (System Bar Insets)
            ViewCompat.setOnApplyWindowInsetsListener(this) { view, insets ->
                val statusBar = insets.getInsets(WindowInsetsCompat.Type.statusBars())
                val navBar = insets.getInsets(WindowInsetsCompat.Type.navigationBars())
                val cutout = insets.getInsets(WindowInsetsCompat.Type.displayCutout())
                
                val topPad = maxOf(statusBar.top, cutout.top)
                val bottomPad = maxOf(navBar.bottom, cutout.bottom)
                
                view.setPadding(0, topPad, 0, bottomPad)
                insets
            }

            // مدیریت دقیق درخواست‌های مجوز درون وب‌ویو متصل به سیستم‌عامل اندروید
            webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest) {
                    runOnUiThread {
                        val needed = mutableListOf<String>()
                        for (res in request.resources) {
                            if (res == PermissionRequest.RESOURCE_AUDIO_CAPTURE && !hasMicrophonePermission()) {
                                needed.add(Manifest.permission.RECORD_AUDIO)
                            }
                            if (res == PermissionRequest.RESOURCE_VIDEO_CAPTURE && !hasCameraPermission()) {
                                needed.add(Manifest.permission.CAMERA)
                            }
                        }

                        if (needed.isEmpty()) {
                            // فقط منابع درخواست شده را تأیید می‌کند
                            request.grant(request.resources)
                        } else {
                            pendingPermissionRequest = request
                            permissionLauncher.launch(needed.toTypedArray())
                        }
                    }
                }
            }

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? {
                    return assetLoader.shouldInterceptRequest(request.url)
                }
            }

            // اتصال پل جاوااسکریپت به نام window.AndroidPermissions و window.AndroidNetwork
            addJavascriptInterface(AndroidPermissionsBridge(), "AndroidPermissions")
            addJavascriptInterface(networkBridge, "AndroidNetwork")
        }

        setContentView(webView)
        webView.loadUrl("https://appassets.androidplatform.net/assets/dist/index.html")

        // آغاز خودکار شنود سوکت UDP روی پورت استاندارد ۸۸۸۸
        networkBridge.startListening(8888)
    }

    override fun onDestroy() {
        super.onDestroy()
        networkBridge.stopListening()
    }

    inner class AndroidNetworkBridge {
        private var multicastLock: WifiManager.MulticastLock? = null
        private var isListening = false
        private var listenSocket: DatagramSocket? = null
        private var listenThread: Thread? = null

        @JavascriptInterface
        fun startListening(port: Int): Boolean {
            if (isListening) return true

            try {
                val wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as? WifiManager
                multicastLock = wifiManager?.createMulticastLock("NetMasterMulticastLock")?.apply {
                    setReferenceCounted(true)
                    acquire()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            isListening = true
            listenThread = Thread {
                try {
                    listenSocket = DatagramSocket(null).apply {
                        reuseAddress = true
                        broadcast = true
                        bind(InetSocketAddress(port))
                    }
                    val buffer = ByteArray(65535)
                    while (isListening && listenSocket?.isClosed == false) {
                        val packet = DatagramPacket(buffer, buffer.size)
                        listenSocket?.receive(packet)
                        val senderIp = packet.address?.hostAddress ?: ""
                        val senderPort = packet.port
                        val message = String(packet.data, packet.offset, packet.length, Charsets.UTF_8)
                        val quotedData = JSONObject.quote(message)

                        runOnUiThread {
                            webView.evaluateJavascript(
                                "if (window.dispatchEvent) { window.dispatchEvent(new CustomEvent('androidNetworkPacket', { detail: { data: $quotedData, senderIp: '$senderIp', senderPort: $senderPort } })); }",
                                null
                            )
                        }
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }.apply {
                isDaemon = true
                start()
            }
            return true
        }

        @JavascriptInterface
        fun stopListening(): Boolean {
            isListening = false
            try {
                listenSocket?.close()
                listenSocket = null
            } catch (e: Exception) {
                e.printStackTrace()
            }
            try {
                multicastLock?.let {
                    if (it.isHeld) it.release()
                }
                multicastLock = null
            } catch (e: Exception) {
                e.printStackTrace()
            }
            return true
        }

        @JavascriptInterface
        fun getWifiIpAddress(): String {
            try {
                val interfaces = NetworkInterface.getNetworkInterfaces()
                while (interfaces.hasMoreElements()) {
                    val networkInterface = interfaces.nextElement()
                    if (networkInterface.isLoopback || !networkInterface.isUp) continue
                    val addresses = networkInterface.inetAddresses
                    while (addresses.hasMoreElements()) {
                        val addr = addresses.nextElement()
                        if (!addr.isLoopbackAddress && addr is Inet4Address) {
                            return addr.hostAddress ?: "192.168.1.104"
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
            return "192.168.1.104"
        }

        @JavascriptInterface
        fun getWifiSsid(): String {
            return "شبکه محلی (Wi-Fi Local)"
        }

        @JavascriptInterface
        fun sendUdpBroadcast(payload: String, port: Int): Boolean {
            Thread {
                try {
                    val socket = DatagramSocket()
                    socket.broadcast = true
                    val data = payload.toByteArray(Charsets.UTF_8)
                    val broadcastAddresses = mutableSetOf<InetAddress>()

                    try {
                        val interfaces = NetworkInterface.getNetworkInterfaces()
                        while (interfaces.hasMoreElements()) {
                            val networkInterface = interfaces.nextElement()
                            if (networkInterface.isLoopback || !networkInterface.isUp) continue
                            for (interfaceAddress in networkInterface.interfaceAddresses) {
                                val broadcast = interfaceAddress.broadcast
                                if (broadcast != null) {
                                    broadcastAddresses.add(broadcast)
                                }
                            }
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }

                    // افزوده شدن آدرس برادکست استاندارد عمومی به عنوان فال‌بک
                    broadcastAddresses.add(InetAddress.getByName("255.255.255.255"))

                    for (target in broadcastAddresses) {
                        try {
                            val packet = DatagramPacket(data, data.size, target, port)
                            socket.send(packet)
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                    socket.close()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }.start()
            return true
        }

        @JavascriptInterface
        fun sendUdpPacket(targetIp: String, port: Int, payload: String): Boolean {
            Thread {
                try {
                    val socket = DatagramSocket()
                    val data = payload.toByteArray(Charsets.UTF_8)
                    val target = InetAddress.getByName(targetIp)
                    val packet = DatagramPacket(data, data.size, target, port)
                    socket.send(packet)
                    socket.close()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }.start()
            return true
        }
    }

    inner class AndroidPermissionsBridge {

        @JavascriptInterface
        fun isNativeAndroid(): Boolean = true

        @JavascriptInterface
        fun getAllPermissionStates(): String {
            val mic = hasMicrophonePermission()
            val cam = hasCameraPermission()
            val notif = hasNotificationPermission()
            val storage = hasStoragePermission()
            val location = hasLocationPermission()
            return "{\"microphone\":$mic,\"camera\":$cam,\"notification\":$notif,\"storage\":$storage,\"location\":$location}"
        }

        @JavascriptInterface
        fun hasMicrophonePermission(): Boolean {
            return this@MainActivity.hasMicrophonePermission()
        }

        @JavascriptInterface
        fun hasCameraPermission(): Boolean {
            return this@MainActivity.hasCameraPermission()
        }

        @JavascriptInterface
        fun hasNotificationPermission(): Boolean {
            return this@MainActivity.hasNotificationPermission()
        }

        @JavascriptInterface
        fun hasStoragePermission(): Boolean {
            return this@MainActivity.hasStoragePermission()
        }

        @JavascriptInterface
        fun hasLocationPermission(): Boolean {
            return this@MainActivity.hasLocationPermission()
        }

        @JavascriptInterface
        fun requestMicrophone(): Boolean {
            runOnUiThread {
                permissionLauncher.launch(arrayOf(Manifest.permission.RECORD_AUDIO))
            }
            return true
        }

        @JavascriptInterface
        fun requestCamera(): Boolean {
            runOnUiThread {
                permissionLauncher.launch(arrayOf(Manifest.permission.CAMERA))
            }
            return true
        }

        @JavascriptInterface
        fun requestNotification(): Boolean {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                runOnUiThread {
                    permissionLauncher.launch(arrayOf(Manifest.permission.POST_NOTIFICATIONS))
                }
            }
            return true
        }

        @JavascriptInterface
        fun requestStorage(): Boolean {
            val perms = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                arrayOf(
                    Manifest.permission.READ_MEDIA_IMAGES,
                    Manifest.permission.READ_MEDIA_VIDEO,
                    Manifest.permission.READ_MEDIA_AUDIO
                )
            } else {
                arrayOf(
                    Manifest.permission.READ_EXTERNAL_STORAGE,
                    Manifest.permission.WRITE_EXTERNAL_STORAGE
                )
            }
            runOnUiThread {
                permissionLauncher.launch(perms)
            }
            return true
        }

        @JavascriptInterface
        fun requestLocation(): Boolean {
            val perms = arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            )
            runOnUiThread {
                permissionLauncher.launch(perms)
            }
            return true
        }

        @JavascriptInterface
        fun requestAllPermissions(): Boolean {
            val list = mutableListOf(
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.CAMERA,
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            )
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                list.add(Manifest.permission.POST_NOTIFICATIONS)
                list.add(Manifest.permission.READ_MEDIA_IMAGES)
                list.add(Manifest.permission.READ_MEDIA_VIDEO)
                list.add(Manifest.permission.READ_MEDIA_AUDIO)
            } else {
                list.add(Manifest.permission.READ_EXTERNAL_STORAGE)
                list.add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            }
            runOnUiThread {
                permissionLauncher.launch(list.toTypedArray())
            }
            return true
        }

        @JavascriptInterface
        fun openAppSettings(): Boolean {
            runOnUiThread {
                try {
                    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                        data = Uri.fromParts("package", packageName, null)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    startActivity(intent)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
            return true
        }

        @JavascriptInterface
        fun shouldShowRationale(permission: String): Boolean {
            val androidPerm = when (permission) {
                "microphone" -> Manifest.permission.RECORD_AUDIO
                "camera" -> Manifest.permission.CAMERA
                "notification" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) Manifest.permission.POST_NOTIFICATIONS else ""
                "storage" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) Manifest.permission.READ_MEDIA_IMAGES else Manifest.permission.READ_EXTERNAL_STORAGE
                "location" -> Manifest.permission.ACCESS_FINE_LOCATION
                else -> permission
            }
            return if (androidPerm.isNotEmpty()) {
                shouldShowRequestPermissionRationale(androidPerm)
            } else {
                false
            }
        }
    }
}
`
  },

  themeManager: {
    filename: 'ThemeManager.kt',
    path: 'app/src/main/java/com/localnet/netmaster/ui/theme/ThemeManager.kt',
    language: 'kotlin',
    title: 'مدیریت تم داینامیک و ذخیره در Jetpack DataStore Preferences',
    code: `package com.localnet.netmaster.ui.theme

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

val Context.themeDataStore: DataStore<Preferences> by preferencesDataStore(name = "theme_preferences")

enum class ThemeMode {
    LIGHT,
    DARK,
    SYSTEM
}

class ThemeManager(private val context: Context) {

    private val themeKey = stringPreferencesKey("app_theme_mode")

    val themeModeFlow: Flow<ThemeMode> = context.themeDataStore.data.map { preferences ->
        when (preferences[themeKey]) {
            ThemeMode.LIGHT.name -> ThemeMode.LIGHT
            ThemeMode.DARK.name -> ThemeMode.DARK
            else -> ThemeMode.SYSTEM
        }
    }

    suspend fun setThemeMode(mode: ThemeMode) {
        context.themeDataStore.edit { preferences ->
            preferences[themeKey] = mode.name
        }
    }
}`
  },

  themeCompose: {
    filename: 'Theme.kt',
    path: 'app/src/main/java/com/localnet/netmaster/ui/theme/Theme.kt',
    language: 'kotlin',
    title: 'قالب‌های ظاهری تیره و روشن (Material 3 Dark/Light ColorSchemes)',
    code: `package com.localnet.netmaster.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// 🎨 رنگ‌های اختصاصی حالت تیره (Cyber Tactical Dark)
private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF00F59B),
    onPrimary = Color(0xFF07090E),
    primaryContainer = Color(0xFF0D121F),
    onPrimaryContainer = Color(0xFF00F59B),
    secondary = Color(0xFF00D2FF),
    onSecondary = Color(0xFF07090E),
    secondaryContainer = Color(0xFF141A26),
    onSecondaryContainer = Color(0xFF00D2FF),
    tertiary = Color(0xFFA855F7),
    background = Color(0xFF07090E),
    onBackground = Color(0xFFF3F4F6),
    surface = Color(0xFF0D121F),
    onSurface = Color(0xFFF3F4F6),
    surfaceVariant = Color(0xFF141A26),
    onSurfaceVariant = Color(0xFF8B95A8),
    outline = Color(0xFF1E2638)
)

// ☀️ رنگ‌های اختصاصی حالت روشن (High-Contrast Tactical Light)
private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF00A86B),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE6F9F0),
    onPrimaryContainer = Color(0xFF004D30),
    secondary = Color(0xFF0284C7),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFE0F2FE),
    onSecondaryContainer = Color(0xFF0369A1),
    tertiary = Color(0xFF7E22CE),
    background = Color(0xFFF8FAFC),
    onBackground = Color(0xFF0F172A),
    surface = Color.White,
    onSurface = Color(0xFF0F172A),
    surfaceVariant = Color(0xFFF1F5F9),
    onSurfaceVariant = Color(0xFF64748B),
    outline = Color(0xFFE2E8F0)
)

@Composable
fun NetMasterTheme(
    themeMode: ThemeMode = ThemeMode.SYSTEM,
    content: @Composable () -> Unit
) {
    val isDark = when (themeMode) {
        ThemeMode.DARK -> true
        ThemeMode.LIGHT -> false
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
    }

    val colorScheme = if (isDark) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}`
  },

  settingsScreen: {
    filename: 'SettingsScreen.kt',
    path: 'app/src/main/java/com/localnet/netmaster/ui/screens/SettingsScreen.kt',
    language: 'kotlin',
    title: 'صفحه تنظیمات تغییر تم داینامیک، پارامترهای صوتی و پایداری سرویس پس‌زمینه',
    code: `package com.localnet.netmaster.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.localnet.netmaster.ui.theme.ThemeMode
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(
    currentTheme: ThemeMode,
    onThemeSelected: (ThemeMode) -> Unit,
    noiseSuppressionEnabled: Boolean,
    onToggleNoiseSuppression: (Boolean) -> Unit,
    autoAcceptCctv: Boolean,
    onToggleAutoAcceptCctv: (Boolean) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp)
    ) {
        Text(
            text = "تنظیمات پیشرفته سیستم (Settings)",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground
        )

        Spacer(modifier = Modifier.height(16.dp))

        // 1. کارت تم ظاهری پویا (Dynamic Theming)
        Surface(
            color = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(16.dp),
            tonalElevation = 2.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "قالب ظاهری برنامه (Theme Mode)",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "ذخیره‌سازی در Jetpack DataStore",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ThemeOptionButton(
                        label = "تیره (Dark)",
                        icon = Icons.Default.DarkMode,
                        isSelected = currentTheme == ThemeMode.DARK,
                        onClick = { onThemeSelected(ThemeMode.DARK) },
                        modifier = Modifier.weight(1f)
                    )
                    ThemeOptionButton(
                        label = "روشن (Light)",
                        icon = Icons.Default.LightMode,
                        isSelected = currentTheme == ThemeMode.LIGHT,
                        onClick = { onThemeSelected(ThemeMode.LIGHT) },
                        modifier = Modifier.weight(1f)
                    )
                    ThemeOptionButton(
                        label = "سیستم (Auto)",
                        icon = Icons.Default.SettingsBrightness,
                        isSelected = currentTheme == ThemeMode.SYSTEM,
                        onClick = { onThemeSelected(ThemeMode.SYSTEM) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 2. تنظیمات صوتی و کاهش نویز
        Surface(
            color = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(16.dp),
            tonalElevation = 2.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "فیلتر حذف نویز سخت‌افزاری (NoiseSuppressor)",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "حذف صدای باد و نویزهای محیطی در بیسیم",
                            fontSize = 10.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Switch(
                        checked = noiseSuppressionEnabled,
                        onCheckedChange = onToggleNoiseSuppression
                    )
                }

                Divider(modifier = Modifier.padding(vertical = 10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "تأیید خودکار مانیتورینگ دوربین (Auto Accept CCTV)",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "اتصال بدون نیاز به لمس صفحه (مخصوص حالت استقرار)",
                            fontSize = 10.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Switch(
                        checked = autoAcceptCctv,
                        onCheckedChange = onToggleAutoAcceptCctv
                    )
                }
            }
        }
    }
}

@Composable
private fun ThemeOptionButton(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        color = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = label,
                fontSize = 11.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}`
  },

  backgroundService: {
    filename: 'NetMasterBackgroundService.kt',
    path: 'app/src/main/java/com/localnet/netmaster/service/NetMasterBackgroundService.kt',
    language: 'kotlin',
    title: 'سرویس پس‌زمینه با WakeLock و WifiLock و ForegroundServiceType برای اندروید ۱۴',
    code: `package com.localnet.netmaster.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.wifi.WifiManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import com.localnet.netmaster.MainActivity

/**
 * 🔋 سرویس ممتد پس‌زمینه:
 * ۱. قفل پردازنده (Partial WakeLock) جهت جلوگیری از خاموشی CPU هنگام قفل بودن گوشی
 * ۲. قفل وای‌فای (WifiLock High Performance) برای حفظ سرعت دریافت پکت‌های صوتی UDP
 * ۳. اعلان ثابت (Persistent Notification) با مشخصه FOREGROUND_SERVICE_TYPE در اندروید ۱۴
 */
class NetMasterBackgroundService : Service() {

    private var wakeLock: PowerManager.WakeLock? = null
    private var wifiLock: WifiManager.WifiLock? = null

    companion object {
        private const val NOTIFICATION_ID = 2001
        private const val CHANNEL_ID = "netmaster_background_channel"

        fun startService(context: Context) {
            val intent = Intent(context, NetMasterBackgroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, NetMasterBackgroundService::class.java)
            context.stopService(intent)
        }
    }

    override fun onCreate() {
        super.onCreate()
        acquireLocks()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = createNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or
                ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
        return START_STICKY
    }

    private fun acquireLocks() {
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "NetMaster::AudioCpuWakeLock").apply {
            setReferenceCounted(false)
            acquire()
        }

        val wifiManager = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            WifiManager.WIFI_MODE_FULL_LOW_LATENCY
        } else {
            @Suppress("DEPRECATION")
            WifiManager.WIFI_MODE_FULL_HIGH_PERF
        }
        wifiLock = wifiManager.createWifiLock(mode, "NetMaster::HighPerfWifiLock").apply {
            setReferenceCounted(false)
            acquire()
        }
    }

    private fun releaseLocks() {
        wakeLock?.let {
            if (it.isHeld) it.release()
        }
        wakeLock = null

        wifiLock?.let {
            if (it.isHeld) it.release()
        }
        wifiLock = null
    }

    private fun createNotification(): Notification {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "سرویس ارتباط محلی NetMaster",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "شنود پکت‌های بلادرنگ بیسیم و دوربین در شبکه آفلاین"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        val openAppIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("NetMaster Suite فعال است")
            .setContentText("شبکه آفلاین محلی در حال اجرا - آماده دریافت پیام صوتی")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(openAppIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        releaseLocks()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}`
  },

  mainScreen: {
    filename: 'NetMasterMainScreen.kt',
    path: 'app/src/main/java/com/localnet/netmaster/ui/NetMasterMainScreen.kt',
    language: 'kotlin',
    title: 'صفحه اصلی و نویگیشن ۵ ماژول در Jetpack Compose (Vazirmatn RTL)',
    code: `package com.localnet.netmaster.ui

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.localnet.netmaster.ui.screens.*

enum class NetMasterModule(val label: String, val icon: ImageVector, val accentColor: Color) {
    RADAR("رادار & شبکه", Icons.Default.Explore, Color(0xFF00E676)),
    WALKIE("بیسیم", Icons.Default.Radio, Color(0xFF00E676)),
    CCTV("دوربین", Icons.Default.Videocam, Color(0xFF3A86FF)),
    AIRDROP("چت & فایل", Icons.Default.Chat, Color(0xFFFFB74D)),
    SCREEN_SHARE("اشتراک صفحه", Icons.Default.ScreenShare, Color(0xFF9C27B0))
}

@Composable
fun NetMasterMainScreen(
    viewModel: NetMasterViewModel
) {
    var currentModule by remember { mutableStateOf(NetMasterModule.WALKIE) }
    val uiState by viewModel.uiState.collectAsState()

    CompositionLocalProvider(androidx.compose.ui.platform.LocalLayoutDirection provides androidx.compose.ui.unit.LayoutDirection.Rtl) {
        Scaffold(
            containerColor = Color(0xFF121214),
            topBar = {
                NetMasterTopBar(
                    currentModule = currentModule,
                    onModuleSelect = { currentModule = it },
                    connectedPeersCount = uiState.connectedPeers.size,
                    networkSsid = uiState.networkSsid,
                    isHost = uiState.isHost
                )
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                AnimatedContent(
                    targetState = currentModule,
                    transitionSpec = {
                        fadeIn() + slideInHorizontally() togetherWith fadeOut() + slideOutHorizontally()
                    },
                    label = "ModuleTransition"
                ) { module ->
                    when (module) {
                        NetMasterModule.RADAR -> RadarCompassScreen(viewModel)
                        NetMasterModule.WALKIE -> WalkieTalkieScreen(viewModel)
                        NetMasterModule.CCTV -> CctvStealthScreen(viewModel)
                        NetMasterModule.AIRDROP -> LocalAirDropScreen(viewModel)
                        NetMasterModule.SCREEN_SHARE -> ScreenMirrorScreen(viewModel)
                    }
                }
            }
        }
    }
}

@Composable
fun NetMasterTopBar(
    currentModule: NetMasterModule,
    onModuleSelect: (NetMasterModule) -> Unit,
    connectedPeersCount: Int,
    networkSsid: String,
    isHost: Boolean
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF121214))
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        // وضعیت شبکه محلی و تعداد کلاینت‌ها
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(Color(0xFF00E676))
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = networkSsid,
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.width(6.dp))
                Surface(
                    color = Color(0xFF1E1E24),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = if (isHost) "میزبان (Hotspot)" else "کلاینت",
                        color = Color(0xFFA0A0AB),
                        fontSize = 10.sp,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            Surface(
                color = Color(0xFF1E1E24),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Group,
                        contentDescription = null,
                        tint = Color(0xFF00E676),
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "$connectedPeersCount دستگاه",
                        color = Color.White,
                        fontSize = 11.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // کپسول تب ۵گانه ناوبری سوئیچ بین ماژول‌ها
        Surface(
            color = Color(0xFF1E1E24),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(3.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                NetMasterModule.values().forEach { module ->
                    val isSelected = currentModule == module
                    Surface(
                        onClick = { onModuleSelect(module) },
                        color = if (isSelected) module.accentColor else Color.Transparent,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center,
                            modifier = Modifier.padding(vertical = 6.dp)
                        ) {
                            Icon(
                                module.icon,
                                contentDescription = module.label,
                                tint = if (isSelected) Color.Black else Color(0xFFA0A0AB),
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = module.label,
                                color = if (isSelected) Color.Black else Color(0xFFA0A0AB),
                                fontSize = 9.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                maxLines = 1
                            )
                        }
                    }
                }
            }
        }
    }
}`
  },

  radarScreen: {
    filename: 'RadarCompassScreen.kt',
    path: 'app/src/main/java/com/localnet/netmaster/ui/screens/RadarCompassScreen.kt',
    language: 'kotlin',
    title: 'رادار امواج Wi-Fi RSSI، قطب‌نمای ژیروسکوپ و کنترل‌پنل میزبان (Kick & Mute)',
    code: `package com.localnet.netmaster.ui.screens

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.localnet.netmaster.model.PeerDevice
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun RadarCompassScreen(
    viewModel: NetMasterViewModel
) {
    val context = LocalContext.current
    var compassHeading by remember { mutableStateOf(0f) }
    val peers by viewModel.peers.collectAsState()
    val isHost by viewModel.isHost.collectAsState()
    val speakerModeOnly by viewModel.speakerModeOnly.collectAsState()

    // اتصال به سنسور چرخش دستگاه (Rotation Vector / Magnetometer)
    DisposableEffect(Unit) {
        val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
        val rotationSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)
        val listener = object : SensorEventListener {
            override fun onSensorChanged(event: SensorEvent?) {
                if (event?.sensor?.type == Sensor.TYPE_ROTATION_VECTOR) {
                    val rotationMatrix = FloatArray(9)
                    SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values)
                    val orientation = FloatArray(3)
                    SensorManager.getOrientation(rotationMatrix, orientation)
                    val azimuthInDegrees = Math.toDegrees(orientation[0].toDouble()).toFloat()
                    compassHeading = (azimuthInDegrees + 360) % 360
                }
            }
            override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
        }
        sensorManager.registerListener(listener, rotationSensor, SensorManager.SENSOR_DELAY_UI)
        onDispose { sensorManager.unregisterListener(listener) }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF121214))
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // هدر اطلاعات قطب‌نما
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "رادار سیگنال و قطب‌نمای محلی",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold
            )
            Surface(
                color = Color(0xFF1E1E24),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = "\${compassHeading.toInt()}° شمال",
                    color = Color(0xFF00E676),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // بوم رادار با دوایر متحدالمرکز بر مبنای RSSI و پرتو اسکنر گردان
        Box(
            modifier = Modifier
                .size(240.dp)
                .background(Color(0xFF18181C), shape = CircleShape),
            contentAlignment = Alignment.Center
        ) {
            val infiniteTransition = rememberInfiniteTransition(label = "RadarSweep")
            val sweepAngle by infiniteTransition.animateFloat(
                initialValue = 0f,
                targetValue = 360f,
                animationSpec = infiniteRepeatable(
                    animation = tween(3500, easing = LinearEasing),
                    repeatMode = RepeatMode.Restart
                ),
                label = "RadarSweepAngle"
            )

            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2, size.height / 2)
                val radius = size.width / 2

                // رسم حلقه‌های فاصله سیگنال: دور، متوسط، نزدیک
                drawCircle(Color(0xFF2A2A35), radius = radius * 0.9f, style = Stroke(width = 1.dp.toPx()))
                drawCircle(Color(0xFF3A86FF).copy(alpha = 0.3f), radius = radius * 0.6f, style = Stroke(width = 1.dp.toPx()))
                drawCircle(Color(0xFF00E676).copy(alpha = 0.5f), radius = radius * 0.3f, style = Stroke(width = 1.dp.toPx()))

                // خطوط محور
                drawLine(Color(0xFF2A2A35), Offset(0f, center.y), Offset(size.width, center.y))
                drawLine(Color(0xFF2A2A35), Offset(center.x, 0f), Offset(center.x, size.height))

                // رسم پرتو اسکنر لیزری
                val endX = center.x + radius * 0.9f * cos(Math.toRadians(sweepAngle.toDouble())).toFloat()
                val endY = center.y + radius * 0.9f * sin(Math.toRadians(sweepAngle.toDouble())).toFloat()
                drawLine(
                    brush = Brush.radialGradient(
                        listOf(Color(0xFF00E676), Color.Transparent),
                        center = center,
                        radius = radius
                    ),
                    start = center,
                    end = Offset(endX, endY),
                    strokeWidth = 2.dp.toPx()
                )
            }

            // نشانگر مرکز (میزبان)
            Icon(
                Icons.Default.Navigation,
                contentDescription = null,
                tint = Color(0xFF00E676),
                modifier = Modifier
                    .size(28.dp)
                    .rotate(compassHeading)
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        // پنل مدیریت میزبان (اخراج کاربر / حالت تک‌گوینده Mute All)
        if (isHost) {
            Surface(
                color = Color(0xFF1E1E24),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "کنترل پنل اختیارات میزبان (Host Control)",
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Icon(
                            Icons.Default.Security,
                            contentDescription = null,
                            tint = Color(0xFF00E676),
                            modifier = Modifier.size(16.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // حالت تک‌گوینده (Mute All Clients)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "حالت گوینده اختصاصی (Speaker Mode)",
                                color = Color.White,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "تمام کلاینت‌ها بی‌صدا شده و تنها صدای شما پخش می‌شود",
                                color = Color(0xFFA0A0AB),
                                fontSize = 9.sp
                            )
                        }

                        Switch(
                            checked = speakerModeOnly,
                            onCheckedChange = { viewModel.toggleSpeakerMode() },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = Color(0xFF00E676)
                            )
                        )
                    }
                }
            }
        }
    }
}`
  },

  walkieEngine: {
    filename: 'WalkieTalkieEngine.kt',
    path: 'app/src/main/java/com/localnet/netmaster/audio/WalkieTalkieEngine.kt',
    language: 'kotlin',
    title: 'موتور استریم زنده صوتی UDP با پشتیبانی از NoiseSuppressor بومی اندروید',
    code: `package com.localnet.netmaster.audio

import android.annotation.SuppressLint
import android.media.*
import android.media.audiofx.NoiseSuppressor
import kotlinx.coroutines.*
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.net.InetSocketAddress
import java.nio.ByteBuffer
import java.util.UUID

/**
 * 🎙️ موتور بلادرنگ صوت محلی (Low-Latency Local Audio Streamer)
 * رفع باگ تداخل پورت با SO_REUSEADDR و حذف اکوی صدای خودی (Self-Echo) با شناسه اختصاصی
 */
class WalkieTalkieEngine(
    private val broadcastPort: Int = 8888,
    private val sampleRate: Int = 16000,
    private val bufferSize: Int = AudioRecord.getMinBufferSize(
        16000,
        AudioFormat.CHANNEL_IN_MONO,
        AudioFormat.ENCODING_PCM_16BIT
    )
) {
    private var audioRecord: AudioRecord? = null
    private var audioTrack: AudioTrack? = null
    private var noiseSuppressor: NoiseSuppressor? = null
    private var isRecording = false
    private var isReceiving = false

    // شناسه ۶۴بیتی منحصربه‌فرد دستگاه جهت نادیده‌گرفتن پکت‌های ارسالی خودمان در شبکه برادکست
    private val localDeviceUid: Long = UUID.randomUUID().mostSignificantBits
    private var packetSequenceNumber: Int = 0

    private val engineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    /**
     * آغاز ضبط و ارسال استریم میکروفون روی سوکت UDP با هدر ۸ بایتی ضد اکو
     */
    @SuppressLint("MissingPermission")
    fun startTransmitting(targetIp: String = "255.255.255.255") {
        if (isRecording) return
        isRecording = true

        engineScope.launch {
            var socket: DatagramSocket? = null
            try {
                audioRecord = AudioRecord(
                    MediaRecorder.AudioSource.VOICE_COMMUNICATION,
                    sampleRate,
                    AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT,
                    bufferSize
                )

                if (NoiseSuppressor.isAvailable()) {
                    noiseSuppressor = NoiseSuppressor.create(audioRecord!!.audioSessionId)?.apply {
                        enabled = true
                    }
                }

                audioRecord?.startRecording()
                socket = DatagramSocket().apply {
                    broadcast = true
                }
                val targetAddress = InetAddress.getByName(targetIp)

                // هدر ۱۲ بایتی: ۸ بایت DeviceUid + ۴ بایت شماره ترتیب Sequence
                val pcmBuffer = ByteArray(bufferSize)
                val packetBuffer = ByteArray(bufferSize + 12)

                while (isRecording) {
                    val bytesRead = audioRecord?.read(pcmBuffer, 0, pcmBuffer.size) ?: 0
                    if (bytesRead > 0) {
                        val header = ByteBuffer.wrap(packetBuffer)
                        header.putLong(localDeviceUid)
                        header.putInt(++packetSequenceNumber)
                        System.arraycopy(pcmBuffer, 0, packetBuffer, 12, bytesRead)

                        val packet = DatagramPacket(packetBuffer, bytesRead + 12, targetAddress, broadcastPort)
                        socket.send(packet)
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                socket?.close()
                stopTransmitting()
            }
        }
    }

    fun stopTransmitting() {
        isRecording = false
        noiseSuppressor?.release()
        noiseSuppressor = null
        try {
            audioRecord?.stop()
            audioRecord?.release()
        } catch (ignored: Exception) {}
        audioRecord = null
    }

    /**
     * شنود سوکت محلی با SO_REUSEADDR و فیلتر کردن پکت‌های ارسالی خود
     */
    fun startReceiving() {
        if (isReceiving) return
        isReceiving = true

        engineScope.launch {
            var socket: DatagramSocket? = null
            try {
                audioTrack = AudioTrack.Builder()
                    .setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .build()
                    )
                    .setAudioFormat(
                        AudioFormat.Builder()
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(sampleRate)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build()
                    )
                    .setBufferSizeInBytes(bufferSize * 2)
                    .setTransferMode(AudioTrack.MODE_STREAM)
                    .build()

                audioTrack?.play()

                // اتصال ایمن با قابلیت استفاده مجدد از آدرس پورت جهت جلوگیری از BindException
                socket = DatagramSocket(null).apply {
                    reuseAddress = true
                    broadcast = true
                    bind(InetSocketAddress(broadcastPort))
                }

                val receiveBuffer = ByteArray(bufferSize + 12)
                val packet = DatagramPacket(receiveBuffer, receiveBuffer.size)

                while (isReceiving) {
                    socket.receive(packet)

                    if (packet.length > 12) {
                        val header = ByteBuffer.wrap(packet.data)
                        val senderUid = header.long
                        val seq = header.int

                        // فیلتر اکو: پکت‌هایی که از گوشی خودمان فرستاده شده‌اند را دور بینداز
                        if (senderUid != localDeviceUid) {
                            val audioLength = packet.length - 12
                            audioTrack?.write(packet.data, 12, audioLength)
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                socket?.close()
                stopReceiving()
            }
        }
    }

    fun stopReceiving() {
        isReceiving = false
        try {
            audioTrack?.stop()
            audioTrack?.release()
        } catch (ignored: Exception) {}
        audioTrack = null
    }
}`
  },

  walkieSound: {
    filename: 'WalkieSoundManager.kt',
    path: 'app/src/main/java/com/localnet/netmaster/audio/WalkieSoundManager.kt',
    language: 'kotlin',
    title: 'تولید افکت صوتی روجر بیپ (Roger Beep 1200Hz/1000Hz) و ویبره تاکتیکی',
    code: `package com.localnet.netmaster.audio

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.media.ToneGenerator
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlin.math.sin

/**
 * 📻 مدیریت جلوه‌های صوتی و لرزش تاکتیکی (Tactical Haptics & Roger Beep)
 */
class WalkieSoundManager(private val context: Context) {

    private val vibrator: Vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
        vibratorManager.defaultVibrator
    } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }

    private val toneGenerator = ToneGenerator(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION, 80)
    private val scope = CoroutineScope(Dispatchers.Default)

    /**
     * کلیک رادیویی در لحظه لمس PTT (Mic Click) + پالس ویبره کوتاه ۲۸ میلی‌ثانیه‌ای
     */
    fun onPttPressed() {
        // ویبره تاکتیکی
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(28, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(28)
        }

        // صدای کوتاه کلیک سوئیچ میکروفون
        toneGenerator.startTone(ToneGenerator.TONE_PROP_BEEP, 35)
    }

    /**
     * بوق نظامی معروف روجر بیپ (Roger Beep: 1200Hz به مدت 70ms و سپس 1000Hz به مدت 85ms)
     */
    fun onPttReleased() {
        // پترن دو ضرب لرزش هپتیک
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val timings = longArrayOf(0, 35, 40, 45)
            val amplitudes = intArrayOf(0, 180, 0, 220)
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(longArrayOf(0, 35, 40, 45), -1)
        }

        // سنتز ریاضی موج سینوسی Roger Beep با AudioTrack
        scope.launch {
            playDualToneRogerBeep()
        }
    }

    private fun playDualToneRogerBeep() {
        val sampleRate = 44100
        val freq1 = 1200.0 // فرکانس اول: ۱۲۰۰ هرتز
        val dur1 = 0.070    // ۷۰ میلی‌ثانیه
        val freq2 = 1000.0 // فرکانس دوم: ۱۰۰۰ هرتز
        val dur2 = 0.085    // ۸۵ میلی‌ثانیه

        val numSamples1 = (sampleRate * dur1).toInt()
        val numSamples2 = (sampleRate * dur2).toInt()
        val totalSamples = numSamples1 + numSamples2
        val generatedSnd = ShortArray(totalSamples)

        for (i in 0 until numSamples1) {
            val sample = sin(2.0 * Math.PI * i / (sampleRate / freq1))
            generatedSnd[i] = (sample * Short.MAX_VALUE * 0.75).toInt().toShort()
        }

        for (i in 0 until numSamples2) {
            val sample = sin(2.0 * Math.PI * i / (sampleRate / freq2))
            generatedSnd[numSamples1 + i] = (sample * Short.MAX_VALUE * 0.75).toInt().toShort()
        }

        val audioTrack = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(sampleRate)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build()
            )
            .setBufferSizeInBytes(generatedSnd.size * 2)
            .setTransferMode(AudioTrack.MODE_STATIC)
            .build()

        audioTrack.write(generatedSnd, 0, generatedSnd.size)
        audioTrack.play()
    }
}`
  },

  cctvStealth: {
    filename: 'CctvStealthEngine.kt',
    path: 'app/src/main/java/com/localnet/netmaster/cctv/CctvStealthEngine.kt',
    language: 'kotlin',
    title: 'موتور استریم CameraX با حالت نامرئی (Stealth Black-Out Mode) و انتخاب کیفیت',
    code: `package com.localnet.netmaster.cctv

import android.app.Activity
import android.content.Context
import android.graphics.ImageFormat
import android.graphics.Rect
import android.graphics.YuvImage
import android.util.Size
import android.view.WindowManager
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import java.io.ByteArrayOutputStream
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

enum class StreamResolution(val width: Int, val height: Int, val label: String) {
    SD_480P(640, 480, "480p (حداقل مصرف باتری)"),
    HD_720P(1280, 720, "720p (متعادل)"),
    FHD_1080P(1920, 1080, "1080p (حداکثر ووضوح)")
}

class CctvStealthEngine(private val context: Context) {

    private var cameraControl: CameraControl? = null
    private var cameraInfo: CameraInfo? = null
    private var imageAnalysis: ImageAnalysis? = null
    private var isStealthActive = false
    private var cameraExecutor: ExecutorService? = null
    private var cameraProvider: ProcessCameraProvider? = null

    /**
     * پیکربندی استریم با وضوح انتخابی و فشرده‌سازی در پس‌زمینه بدون مسدودسازی UI Thread
     */
    fun startCameraStream(
        lifecycleOwner: LifecycleOwner,
        resolution: StreamResolution = StreamResolution.HD_720P,
        facing: Int = CameraSelector.LENS_FACING_BACK,
        onFrameEncoded: (ByteArray) -> Unit
    ) {
        cameraExecutor?.shutdown()
        cameraExecutor = Executors.newSingleThreadExecutor()

        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            cameraProvider = cameraProviderFuture.get()
            val cameraSelector = CameraSelector.Builder().requireLensFacing(facing).build()

            imageAnalysis = ImageAnalysis.Builder()
                .setTargetResolution(Size(resolution.width, resolution.height))
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()

            imageAnalysis?.setAnalyzer(cameraExecutor!!) { imageProxy ->
                // استفاده اجباری از try/finally جهت جلوگیری از قفل شدن خط لوله سنسور دوربین
                try {
                    val yBuffer = imageProxy.planes[0].buffer
                    val uBuffer = imageProxy.planes[1].buffer
                    val vBuffer = imageProxy.planes[2].buffer

                    val ySize = yBuffer.remaining()
                    val uSize = uBuffer.remaining()
                    val vSize = vBuffer.remaining()

                    val nv21 = ByteArray(ySize + uSize + vSize)
                    yBuffer.get(nv21, 0, ySize)
                    vBuffer.get(nv21, ySize, vSize)
                    uBuffer.get(nv21, ySize + vSize, uSize)

                    val yuvImage = YuvImage(nv21, ImageFormat.NV21, imageProxy.width, imageProxy.height, null)
                    val out = ByteArrayOutputStream()
                    yuvImage.compressToJpeg(Rect(0, 0, imageProxy.width, imageProxy.height), 65, out)
                    onFrameEncoded(out.toByteArray())
                } catch (e: Exception) {
                    e.printStackTrace()
                } finally {
                    imageProxy.close()
                }
            }

            cameraProvider?.unbindAll()
            val camera = cameraProvider?.bindToLifecycle(lifecycleOwner, cameraSelector, imageAnalysis)
            cameraControl = camera?.cameraControl
            cameraInfo = camera?.cameraInfo
        }, ContextCompat.getMainExecutor(context))
    }

    fun stopCameraStream() {
        try {
            cameraProvider?.unbindAll()
            cameraExecutor?.shutdown()
            cameraExecutor = null
        } catch (ignored: Exception) {}
    }

    /**
     * 🕵️‍♂️ فعال‌سازی حالت نامرئی (Stealth Mode):
     * ۱. رساندن روشنایی نمایشگر به صفر مطلق (Blackout)
     * ۲. غیرفعال کردن نور پس‌زمینه بدون توقف دوربین در اندروید
     */
    fun setStealthMode(activity: Activity, enable: Boolean) {
        isStealthActive = enable
        val layoutParams = activity.window.attributes
        layoutParams.screenBrightness = if (enable) 0.0f else WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE
        activity.window.attributes = layoutParams
    }

    fun toggleTorch(enable: Boolean) {
        cameraControl?.enableTorch(enable)
    }

    fun setZoom(linearZoom: Float) {
        cameraControl?.setLinearZoom(linearZoom.coerceIn(0f, 1f))
    }
}`
  },

  airDropEngine: {
    filename: 'LocalAirDropEngine.kt',
    path: 'app/src/main/java/com/localnet/netmaster/airdrop/LocalAirDropEngine.kt',
    language: 'kotlin',
    title: 'سرور محلی Ktor برای ارسال فوق‌سریع فایل و پیام‌های متنی بدون اینترنت',
    code: `package com.localnet.netmaster.airdrop

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.cio.*
import io.ktor.server.engine.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

/**
 * 📁 سرور فوق‌سبک محلی جهت انتقال فایل‌ها با نهایت سرعت پهنای باند Wi-Fi (AirDrop LAN)
 */
class LocalAirDropEngine(private val port: Int = 9090) {

    private var server: EmbeddedServer<CIOApplicationEngine, CIOApplicationEngine.Configuration>? = null
    private val sharedFiles = mutableMapOf<String, File>()

    fun startServer() {
        server = embeddedServer(CIO, port = port) {
            routing {
                // دانلود فایل با سرعت کامل شبکه Wi-Fi 5GHz (تا ۴۰ مگابایت بر ثانیه)
                get("/download/{fileId}") {
                    val fileId = call.parameters["fileId"]
                    val file = sharedFiles[fileId]
                    if (file != null && file.exists()) {
                        call.response.header(
                            HttpHeaders.ContentDisposition,
                            ContentDisposition.Attachment.withParameter(ContentDisposition.Parameters.FileName, file.name).toString()
                        )
                        call.respondFile(file)
                    } else {
                        call.respond(HttpStatusCode.NotFound, "فایل در شبکه محلی یافت نشد")
                    }
                }
            }
        }.start(wait = false)
    }

    fun registerFileForSharing(fileId: String, file: File) {
        sharedFiles[fileId] = file
    }

    fun stopServer() {
        server?.stop(1000, 2000)
        server = null
    }
}`
  },

  screenMirror: {
    filename: 'ScreenMirrorService.kt',
    path: 'app/src/main/java/com/localnet/netmaster/mirror/ScreenMirrorService.kt',
    language: 'kotlin',
    title: 'سرویس ضبط و پخش زنده صفحه نمایش با Android MediaProjection API',
    code: `package com.localnet.netmaster.mirror

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class ScreenMirrorService : Service() {

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val resultCode = intent?.getIntExtra("RESULT_CODE", -1) ?: -1
        val resultData = intent?.getParcelableExtra<Intent>("DATA")

        startForeground(101, createNotification())

        if (resultCode != -1 && resultData != null) {
            val mpManager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            mediaProjection = mpManager.getMediaProjection(resultCode, resultData)

            // ایجاد VirtualDisplay برای کدهای فریم با انکودر و استریم سوکت
            val metrics = resources.displayMetrics
            virtualDisplay = mediaProjection?.createVirtualDisplay(
                "NetMasterScreenMirror",
                metrics.widthPixels,
                metrics.heightPixels,
                metrics.densityDpi,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                null,
                null,
                null
            )
        }

        return START_STICKY
    }

    private fun createNotification(): Notification {
        val channelId = "screen_mirror_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "پخش زنده صفحه نمایش", NotificationManager.IMPORTANCE_LOW)
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("NetMaster Screen Mirroring")
            .setContentText("صفحه نمایش شما در حال پخش زنده در شبکه محلی است")
            .setSmallIcon(android.R.drawable.ic_menu_slideshow)
            .build()
    }

    override fun onDestroy() {
        virtualDisplay?.release()
        mediaProjection?.stop()
        super.onDestroy()
    }
}`
  },

  qrUtils: {
    filename: 'QRCodeUtils.kt',
    path: 'app/src/main/java/com/localnet/netmaster/qr/QRCodeUtils.kt',
    language: 'kotlin',
    title: 'تولید بارکد اتصال سریع QR بر پایه ZXing و اعتبارسنجی JSON',
    code: `package com.localnet.netmaster.qr

import android.graphics.Bitmap
import android.graphics.Color
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Serializable
data class ConnectionPayload(
    val ip: String,
    val port: Int,
    val hostName: String,
    val appVersion: String = "2.0.0"
)

object QRCodeUtils {

    fun generateConnectionQR(payload: ConnectionPayload, size: Int = 512): Bitmap {
        val jsonString = Json.encodeToString(payload)
        val writer = QRCodeWriter()
        val bitMatrix = writer.encode(jsonString, BarcodeFormat.QR_CODE, size, size)
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)

        for (x in 0 until size) {
            for (y in 0 until size) {
                bitmap.setPixel(
                    x, y,
                    if (bitMatrix[x, y]) Color.parseColor("#00E676") else Color.parseColor("#121214")
                )
            }
        }
        return bitmap
    }

    private val jsonSerializer = Json { 
        ignoreUnknownKeys = true 
        isLenient = true 
    }

    fun parsePayload(rawText: String): ConnectionPayload? {
        val trimmed = rawText.trim()
        
        // تلاش اول: دیکود JSON منعطف
        try {
            return jsonSerializer.decodeFromString<ConnectionPayload>(trimmed)
        } catch (ignored: Exception) {}

        // تلاش دوم: پشتیبانی از ساختار URI استاندارد (netmaster://connect?ip=...&port=...&name=...)
        try {
            if (trimmed.startsWith("netmaster://")) {
                val uri = android.net.Uri.parse(trimmed)
                val ip = uri.getQueryParameter("ip")
                val port = uri.getQueryParameter("port")?.toIntOrNull() ?: 8888
                val hostName = uri.getQueryParameter("name") ?: "دستگاه ناشناس"
                if (!ip.isNullOrBlank()) {
                    return ConnectionPayload(ip = ip, port = port, hostName = hostName)
                }
            }
        } catch (ignored: Exception) {}

        return null
    }
}`
  },

  qrScanner: {
    filename: 'QRScannerScreen.kt',
    path: 'app/src/main/java/com/localnet/netmaster/ui/screens/QRScannerScreen.kt',
    language: 'kotlin',
    title: 'اسکنر بلادرنگ بارکد QR با Google ML Kit و فریم‌ورک CameraX',
    code: `package com.localnet.netmaster.ui.screens

import android.annotation.SuppressLint
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import com.localnet.netmaster.qr.ConnectionPayload
import com.localnet.netmaster.qr.QRCodeUtils

@Composable
fun QRScannerScreen(
    onPayloadScanned: (ConnectionPayload) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var hasScanned by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                val previewView = PreviewView(ctx)
                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)

                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()
                    val preview = Preview.Builder().build().also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }

                    val scanner = BarcodeScanning.getClient()
                    val imageAnalysis = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()

                    imageAnalysis.setAnalyzer(ContextCompat.getMainExecutor(ctx)) { imageProxy ->
                        @SuppressLint("UnsafeOptInUsageError")
                        val mediaImage = imageProxy.image
                        if (mediaImage != null && !hasScanned) {
                            val inputImage = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
                            scanner.process(inputImage)
                                .addOnSuccessListener { barcodes ->
                                    for (barcode in barcodes) {
                                        barcode.rawValue?.let { raw ->
                                            val payload = QRCodeUtils.parsePayload(raw)
                                            if (payload != null) {
                                                hasScanned = true
                                                onPayloadScanned(payload)
                                            }
                                        }
                                    }
                                }
                                .addOnCompleteListener { imageProxy.close() }
                        } else {
                            imageProxy.close()
                        }
                    }

                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview,
                        imageAnalysis
                    )
                }, ContextCompat.getMainExecutor(ctx))

                previewView
            },
            modifier = Modifier.fillMaxSize()
        )

        // رتیکل و کادر تاکتیکی اسکنر
        Canvas(modifier = Modifier.fillMaxSize()) {
            val boxSize = size.width * 0.65f
            val left = (size.width - boxSize) / 2
            val top = (size.height - boxSize) / 2

            drawRoundRect(
                color = Color(0xFF00E676),
                topLeft = Offset(left, top),
                size = Size(boxSize, boxSize),
                cornerRadius = CornerRadius(16.dp.toPx()),
                style = Stroke(width = 3.dp.toPx())
            )
        }
    }
}`
  },

  pttButton: {
    filename: 'PTTButtonWithEffects.kt',
    path: 'app/src/main/java/com/localnet/netmaster/ui/components/PTTButtonWithEffects.kt',
    language: 'kotlin',
    title: 'دکمه PTT اختصاصی با تشخیص لمس، افکت نورانی و لرزش تاکتیکی',
    code: `package com.localnet.netmaster.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.waitForUpOrCancellation
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.localnet.netmaster.audio.WalkieSoundManager

@Composable
fun PTTButtonWithEffects(
    soundManager: WalkieSoundManager,
    isChannelBusy: Boolean,
    onStartTransmitting: () -> Unit,
    onStopTransmitting: () -> Unit
) {
    var isPressed by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(64.dp)
            .clip(RoundedCornerShape(28.dp))
            .background(
                if (isPressed) {
                    Brush.horizontalGradient(listOf(Color(0xFF00E676), Color(0xFF00C853)))
                } else {
                    Brush.horizontalGradient(listOf(Color(0xFF1E1E24), Color(0xFF25252E)))
                }
            )
            .pointerInput(isChannelBusy) {
                if (isChannelBusy) return@pointerInput
                awaitEachGesture {
                    val down = awaitFirstDown(requireUnconsumed = false)
                    down.consume()
                    isPressed = true
                    soundManager.onPttPressed()
                    onStartTransmitting()

                    val up = waitForUpOrCancellation()
                    isPressed = false
                    soundManager.onPttReleased()
                    onStopTransmitting()
                }
            },
        contentAlignment = Alignment.Center
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                Icons.Default.Mic,
                contentDescription = null,
                tint = if (isPressed) Color.Black else Color(0xFF00E676),
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = if (isPressed) "در حال ارسال صدا به شبکه..." else "برای صحبت نگه‌دارید (Push-To-Talk)",
                color = if (isPressed) Color.Black else Color.White,
                fontSize = 14.sp
            )
        }
    }
}`
  },

  githubWorkflow: {
    filename: 'build-apk.yml',
    path: '.github/workflows/build-apk.yml',
    language: 'yaml',
    title: 'بیلد خودکار ابری APK گیت‌هاب (NetMaster Suite GitHub Actions)',
    code: `name: Build NetMaster Suite APK

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    name: Build & Package APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Grant Execute Permission for Gradlew
        run: chmod +x gradlew

      - name: Build Debug APK with Gradle
        run: ./gradlew assembleDebug --stacktrace

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: NetMaster_Suite_Debug_APK
          path: app/build/outputs/apk/debug/app-debug.apk
          retention-days: 14`
  }
};
