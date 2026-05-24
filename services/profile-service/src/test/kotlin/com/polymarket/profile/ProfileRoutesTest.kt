package com.polymarket.profile

import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class ProfileRoutesTest {
    @Test
    fun `admin role requires exact match`() {
        assertTrue(ProfileRoutes.hasAdminRole(listOf("admin")))
        assertTrue(ProfileRoutes.hasAdminRole(listOf("user", " admin ")))
        assertTrue(ProfileRoutes.hasAdminRole(listOf("ADMIN")))

        assertFalse(ProfileRoutes.hasAdminRole(emptyList()))
        assertFalse(ProfileRoutes.hasAdminRole(listOf("notadmin")))
        assertFalse(ProfileRoutes.hasAdminRole(listOf("superadministrator")))
        assertFalse(ProfileRoutes.hasAdminRole(listOf("admin-assistant")))
    }
}
