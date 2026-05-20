plugins {
    kotlin("jvm") version "2.0.0"
    kotlin("plugin.serialization") version "2.0.0"
    id("io.ktor.plugin") version "2.3.12"
    id("com.github.jmongard.git-semver-plugin") version "0.4.2"
}

group = "com.polymarket"
version = "0.1.0"

kotlin {
    jvmToolchain(21)
}

ktor {
    fatJar { archiveFileName.set("profile-service-fat.jar") }
}

repositories {
    mavenCentral()
}

dependencies {
    // Ktor server
    implementation("io.ktor:ktor-server-core-jvm")
    implementation("io.ktor:ktor-server-netty-jvm")
    implementation("io.ktor:ktor-server-content-negotiation-jvm")
    implementation("io.ktor:ktor-serialization-kotlinx-json-jvm")
    implementation("io.ktor:ktor-server-auth-jvm")
    implementation("io.ktor:ktor-server-auth-jwt-jvm")
    implementation("io.ktor:ktor-server-cors-jvm")
    implementation("io.ktor:ktor-server-call-logging-jvm")
    implementation("io.ktor:ktor-server-request-validation-jvm")
    implementation("io.ktor:ktor-server-status-pages-jvm")
    implementation("io.ktor:ktor-server-metrics-micrometer-jvm")

    // Database (Postgres via Exposed)
    implementation("org.jetbrains.exposed:exposed-core:0.52.0")
    implementation("org.jetbrains.exposed:exposed-dao:0.52.0")
    implementation("org.jetbrains.exposed:exposed-jdbc:0.52.0")
    implementation("org.jetbrains.exposed:exposed-java-time:0.52.0")
    implementation("org.postgresql:postgresql:42.7.3")
    implementation("com.zaxxer:HikariCP:5.1.0")

    // Kafka
    implementation("org.apache.kafka:kafka-clients:3.7.0")

    // Observability
    implementation("io.micrometer:micrometer-registry-prometheus:1.13.1")
    implementation("io.opentelemetry.instrumentation:opentelemetry-ktor-2.0:2.5.0-alpha")

    // Utilities
    implementation("ch.qos.logback:logback-classic:1.5.6")
    implementation("io.insert-koin:koin-ktor:3.5.6")
    implementation("io.insert-koin:koin-logger-slf4j:3.5.6")
    implementation("com.sksamuel.hoplite:hoplite-hocon:2.7.5")
    implementation("org.mindrot:jbcrypt:0.4")

    testImplementation("io.ktor:ktor-server-test-host-jvm")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testImplementation("io.mockk:mockk:1.13.11")
    testImplementation("org.testcontainers:postgresql:1.20.1")
}
