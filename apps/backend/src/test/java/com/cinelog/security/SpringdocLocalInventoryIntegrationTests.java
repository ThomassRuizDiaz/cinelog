package com.cinelog.security;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class SpringdocLocalInventoryIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void springdocRequiresAuthenticationOutsideProduction() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void authenticatedOpenApiContainsFrontendIntegrationSurface() throws Exception {
        mockMvc.perform(get("/v3/api-docs").with(user("admin")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/status'].get").exists())
                .andExpect(jsonPath("$.paths['/api/auth/csrf'].get").exists())
                .andExpect(jsonPath("$.paths['/api/auth/login'].post").exists())
                .andExpect(jsonPath("$.paths['/api/auth/logout'].post").exists())
                .andExpect(jsonPath("$.paths['/api/auth/me'].get").exists())
                .andExpect(jsonPath("$.paths['/api/external/movies/search'].get").exists())
                .andExpect(jsonPath("$.paths['/api/external/movies/tmdb/{tmdbId}'].get").exists())
                .andExpect(jsonPath("$.paths['/api/movies'].get").exists())
                .andExpect(jsonPath("$.paths['/api/movies'].post").exists())
                .andExpect(jsonPath("$.paths['/api/movies/{id}'].get").exists())
                .andExpect(jsonPath("$.paths['/api/movies/{id}'].put").exists())
                .andExpect(jsonPath("$.paths['/api/movies/{id}'].delete").exists())
                .andExpect(jsonPath("$.paths['/api/movies/import'].post").exists())
                .andExpect(jsonPath("$.paths['/api/movies/{movieId}/watch-entries'].get").exists())
                .andExpect(jsonPath("$.paths['/api/movies/{movieId}/watch-entries'].post").exists())
                .andExpect(jsonPath("$.paths['/api/watch-entries/{id}'].get").exists())
                .andExpect(jsonPath("$.paths['/api/watch-entries/{id}'].put").exists())
                .andExpect(jsonPath("$.paths['/api/watch-entries/{id}'].delete").exists())
                .andExpect(jsonPath("$.paths['/api/watch-entries/{watchEntryId}/rating'].get").exists())
                .andExpect(jsonPath("$.paths['/api/watch-entries/{watchEntryId}/rating'].put").exists())
                .andExpect(jsonPath("$.paths['/api/watch-entries/{watchEntryId}/rating'].delete").exists())
                .andExpect(jsonPath("$.paths['/api/rankings'].get").exists())
                .andExpect(jsonPath("$.paths['/api/dashboard'].get").exists());
    }
}
