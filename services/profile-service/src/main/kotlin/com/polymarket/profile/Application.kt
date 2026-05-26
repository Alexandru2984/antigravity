package com.polymarket.profile

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.security.KeyFactory
import java.security.interfaces.RSAPublicKey
import java.util.Base64
import kotlin.system.exitProcess

data class DatabaseSettings(
    val jdbcUrl: String,
    val username: String,
    val password: String,
)

fun configuredCorsOrigins(): List<URI> {
    val configured = System.getenv("CORS_ORIGINS")
        ?: System.getenv("FRONTEND_URL")
        ?: "http://localhost:3000"

    return configured
        .split(",")
        .map { it.trim() }
        .filter { it.isNotEmpty() }
        .map { origin ->
            val uri = URI(origin)
            require(uri.scheme == "http" || uri.scheme == "https") {
                "CORS origin must use http or https: $origin"
            }
            require(!uri.host.isNullOrBlank()) {
                "CORS origin must include a host: $origin"
            }
            uri
        }
}

fun main(args: Array<String>) {
    if (args.contains("--health")) {
        exitProcess(runHealthCheck())
    }

    embeddedServer(Netty, port = System.getenv("PORT")?.toInt() ?: 4007) {
        install(ContentNegotiation) {
            json(Json { ignoreUnknownKeys = true; prettyPrint = false })
        }

        install(CORS) {
            configuredCorsOrigins().forEach { origin ->
                val host = if (origin.port == -1) origin.host else "${origin.host}:${origin.port}"
                allowHost(host, schemes = listOf(origin.scheme))
            }
            allowHeader(HttpHeaders.Authorization)
            allowHeader(HttpHeaders.ContentType)
            allowHeader("X-Request-ID")
            allowMethod(HttpMethod.Options)
            allowMethod(HttpMethod.Get)
            allowMethod(HttpMethod.Put)
            allowMethod(HttpMethod.Delete)
        }

        install(StatusPages) {
            exception<Throwable> { call, cause ->
                call.respond(
                    HttpStatusCode.InternalServerError,
                    mapOf("error" to (cause.message ?: "Internal server error"))
                )
            }
        }

        // ── JWT Auth (RS256 public key verify only) ───────────────
        install(Authentication) {
            jwt("jwt") {
                realm = "polymarket"
                verifier(buildJwtVerifier())
                validate { credential ->
                    if (credential.payload.subject != null) JWTPrincipal(credential.payload) else null
                }
            }
        }

        // ── Database ───────────────────────────────────────────────
        val databaseSettings = configuredDatabaseSettings()
        val ds = HikariDataSource(HikariConfig().apply {
            jdbcUrl  = databaseSettings.jdbcUrl
            username = databaseSettings.username
            password = databaseSettings.password
            maximumPoolSize = 10
            driverClassName = "org.postgresql.Driver"
        })
        Database.connect(ds)

        transaction {
            SchemaUtils.createMissingTablesAndColumns(Profiles)
        }

        // ── Routes ─────────────────────────────────────────────────
        routing {
            get("/health") {
                call.respond(mapOf("status" to "ok", "service" to "profile-service"))
            }

            authenticate("jwt") {
                route("/profiles") {
                    get("/{userId}") { ProfileRoutes.getProfile(call) }
                    put("/{userId}") { ProfileRoutes.updateProfile(call) }
                    get("/{userId}/listings") { ProfileRoutes.getSellerListings(call) }
                }
                route("/me/profile") {
                    get  { ProfileRoutes.getMyProfile(call) }
                    put  { ProfileRoutes.updateMyProfile(call) }
                }
            }
        }
    }.start(wait = true)
}

fun configuredDatabaseSettings(
    env: (String) -> String? = System::getenv,
): DatabaseSettings {
    return DatabaseSettings(
        jdbcUrl = env("PROFILE_DATABASE_URL")
            ?: "jdbc:postgresql://localhost:5432/polymarket_profiles",
        username = env("POSTGRES_USER") ?: "polymarket",
        password = env("POSTGRES_PASSWORD")
            ?: throw IllegalStateException("POSTGRES_PASSWORD env var required"),
    )
}

fun runHealthCheck(): Int {
    return try {
        val port = System.getenv("PORT") ?: "4007"
        val request = HttpRequest.newBuilder()
            .uri(URI("http://127.0.0.1:$port/health"))
            .GET()
            .build()
        val response = HttpClient.newHttpClient()
            .send(request, HttpResponse.BodyHandlers.discarding())

        if (response.statusCode() == 200) 0 else 1
    } catch (_: Exception) {
        1
    }
}

fun buildJwtVerifier(): com.auth0.jwt.interfaces.JWTVerifier {
    val publicKeyPem = System.getenv("JWT_PUBLIC_KEY")
        ?: throw IllegalStateException("JWT_PUBLIC_KEY env var required")
    val stripped = publicKeyPem
        .replace("-----BEGIN PUBLIC KEY-----", "")
        .replace("-----END PUBLIC KEY-----", "")
        .replace("\\n", "")
        .replace("\n", "")
        .trim()
    val keyBytes    = Base64.getDecoder().decode(stripped)
    val publicKey   = KeyFactory.getInstance("RSA")
        .generatePublic(java.security.spec.X509EncodedKeySpec(keyBytes)) as RSAPublicKey

    return com.auth0.jwt.JWT.require(com.auth0.jwt.algorithms.Algorithm.RSA256(publicKey, null))
        .withIssuer("polymarket")
        .build()
}
