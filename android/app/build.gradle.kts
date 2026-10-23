import java.io.File

plugins {
    id("com.android.application")
}

// One version for the web build and the app: package.json is the source of truth.
val pkgVersion: String = Regex("\"version\"\\s*:\\s*\"([^\"]+)\"")
    .find(File(rootDir, "../package.json").readText())!!.groupValues[1]
val (major, minor, patch) = pkgVersion.split(".").map { it.takeWhile(Char::isDigit).toInt() }

android {
    namespace = "cloud.hellman.fimbulvetr"
    compileSdk = 36

    defaultConfig {
        applicationId = "cloud.hellman.fimbulvetr"
        minSdk = 24
        targetSdk = 36
        versionCode = major * 10000 + minor * 100 + patch
        versionName = pkgVersion
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

// The game itself is the web build: refuse to package an app without it.
tasks.named("preBuild") {
    doFirst {
        if (!File(projectDir, "src/main/assets/web/index.html").exists()) {
            throw GradleException("No web build in app/src/main/assets/web. Run `pnpm android:web` first.")
        }
    }
}
