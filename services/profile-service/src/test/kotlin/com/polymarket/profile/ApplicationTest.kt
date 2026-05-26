package com.polymarket.profile

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class ApplicationTest {
    @Test
    fun `database settings require postgres password`() {
        val error = assertFailsWith<IllegalStateException> {
            configuredDatabaseSettings { null }
        }

        assertEquals("POSTGRES_PASSWORD env var required", error.message)
    }

    @Test
    fun `database settings keep local defaults except password`() {
        val settings = configuredDatabaseSettings { key ->
            when (key) {
                "POSTGRES_PASSWORD" -> "secret"
                else -> null
            }
        }

        assertEquals("jdbc:postgresql://localhost:5432/polymarket_profiles", settings.jdbcUrl)
        assertEquals("polymarket", settings.username)
        assertEquals("secret", settings.password)
    }

    @Test
    fun `database settings use configured values`() {
        val settings = configuredDatabaseSettings { key ->
            mapOf(
                "PROFILE_DATABASE_URL" to "jdbc:postgresql://postgres:5432/polymarket_profiles",
                "POSTGRES_USER" to "service-user",
                "POSTGRES_PASSWORD" to "service-password",
            )[key]
        }

        assertEquals("jdbc:postgresql://postgres:5432/polymarket_profiles", settings.jdbcUrl)
        assertEquals("service-user", settings.username)
        assertEquals("service-password", settings.password)
    }
}
