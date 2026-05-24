package com.polymarket.profile

import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.javatime.datetime
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDateTime
import java.util.UUID

// ── Exposed Table ──────────────────────────────────────────────
object Profiles : Table("profiles") {
    val id            = uuid("user_id")       // UUID from auth-service
    val username      = varchar("username", 100)
    val displayName   = varchar("display_name", 255).nullable()
    val bio           = text("bio").nullable()
    val avatarUrl     = varchar("avatar_url", 500).nullable()
    val phone         = varchar("phone", 30).nullable()
    val location      = varchar("location", 255).nullable()
    val sellerRating  = decimal("rating_avg", 3, 2).nullable()
    val totalSales    = integer("listings_count").default(0)
    val isVerified    = bool("is_verified").default(false)
    val createdAt     = datetime("created_at").clientDefault { LocalDateTime.now() }
    val updatedAt     = datetime("updated_at").clientDefault { LocalDateTime.now() }

    override val primaryKey = PrimaryKey(id)
}

// ── DTOs ──────────────────────────────────────────────────────
@Serializable
data class ProfileDto(
    val id: String,
    val displayName: String?,
    val bio: String?,
    val avatarUrl: String?,
    val location: String?,
    val sellerRating: Double?,
    val totalSales: Int,
    val isVerified: Boolean,
)

@Serializable
data class UpdateProfileRequest(
    val displayName: String? = null,
    val bio: String? = null,
    val avatarUrl: String? = null,
    val phone: String? = null,
    val location: String? = null,
)

// ── Route handlers ────────────────────────────────────────────
object ProfileRoutes {

    fun toDto(row: ResultRow) = ProfileDto(
        id          = row[Profiles.id].toString(),
        displayName = row[Profiles.displayName],
        bio         = row[Profiles.bio],
        avatarUrl   = row[Profiles.avatarUrl],
        location    = row[Profiles.location],
        sellerRating= row[Profiles.sellerRating]?.toDouble(),
        totalSales  = row[Profiles.totalSales],
        isVerified  = row[Profiles.isVerified],
    )

    suspend fun getProfile(call: ApplicationCall) {
        val userId = call.requireUuidParameter("userId") ?: return
        val profile = transaction {
            Profiles.selectAll().where { Profiles.id eq userId }.firstOrNull()?.let(::toDto)
        }
        if (profile == null) call.respond(io.ktor.http.HttpStatusCode.NotFound, mapOf("error" to "Not found"))
        else                 call.respond(profile)
    }

    suspend fun updateProfile(call: ApplicationCall) {
        val callerPrincipal = call.principal<JWTPrincipal>()!!
        val callerId        = callerPrincipal.payload.subject
        val callerRoles     = callerPrincipal.payload.getClaim("roles").asList(String::class.java) ?: emptyList()
        val targetId        = call.requireUuidParameter("userId") ?: return

        if (callerId != targetId.toString() && !callerRoles.contains("admin")) {
            call.respond(io.ktor.http.HttpStatusCode.Forbidden, mapOf("error" to "Forbidden")); return
        }

        val req = call.receive<UpdateProfileRequest>()
        transaction {
            Profiles.upsert {
                it[id]          = targetId
                it[username]    = targetId.toString()
                it[displayName] = req.displayName
                it[bio]         = req.bio
                it[avatarUrl]   = req.avatarUrl
                it[phone]       = req.phone
                it[location]    = req.location
                it[updatedAt]   = LocalDateTime.now()
            }
        }
        getProfile(call)
    }

    suspend fun getMyProfile(call: ApplicationCall) {
        val principal = call.principal<JWTPrincipal>()!!
        val userId = principal.payload.subject.toUuidOrNull() ?: run {
            call.respond(io.ktor.http.HttpStatusCode.Unauthorized, mapOf("error" to "Invalid user id")); return
        }
        val profile = transaction {
            Profiles.selectAll().where { Profiles.id eq userId }.firstOrNull()?.let(::toDto)
        }
        call.respond(profile ?: ProfileDto(
            id = userId.toString(), displayName = null, bio = null, avatarUrl = null,
            location = null, sellerRating = null, totalSales = 0, isVerified = false
        ))
    }

    suspend fun updateMyProfile(call: ApplicationCall) {
        val principal = call.principal<JWTPrincipal>()!!
        val userId    = principal.payload.subject.toUuidOrNull() ?: run {
            call.respond(io.ktor.http.HttpStatusCode.Unauthorized, mapOf("error" to "Invalid user id")); return
        }
        val req       = call.receive<UpdateProfileRequest>()
        transaction {
            Profiles.upsert {
                it[id]          = userId
                it[username]    = userId.toString()
                it[displayName] = req.displayName
                it[bio]         = req.bio
                it[avatarUrl]   = req.avatarUrl
                it[phone]       = req.phone
                it[location]    = req.location
                it[updatedAt]   = LocalDateTime.now()
            }
        }
        getMyProfile(call)
    }

    suspend fun getSellerListings(call: ApplicationCall) {
        // Delegates to listing-service — here we just return count from profiles
        val userId = call.requireUuidParameter("userId") ?: return
        val profile = transaction {
            Profiles.selectAll().where { Profiles.id eq userId }.firstOrNull()?.let(::toDto)
        }
        call.respond(
            mapOf(
                "seller_id" to userId.toString(),
                "total_sales" to (profile?.totalSales ?: 0),
            )
        )
    }

    private suspend fun ApplicationCall.requireUuidParameter(name: String): UUID? {
        val raw = parameters[name] ?: run {
            respond(io.ktor.http.HttpStatusCode.BadRequest, mapOf("error" to "Missing $name"))
            return null
        }

        return raw.toUuidOrNull() ?: run {
            respond(io.ktor.http.HttpStatusCode.BadRequest, mapOf("error" to "Invalid $name"))
            null
        }
    }

    private fun String.toUuidOrNull(): UUID? =
        try {
            UUID.fromString(this)
        } catch (_: IllegalArgumentException) {
            null
        }
}
