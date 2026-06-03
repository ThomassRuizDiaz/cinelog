package com.cinelog.security;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@ActiveProfiles({"prod", "test"})
@SpringBootTest(properties = {
        "TMDB_API_KEY=test-api-key",
        "CINELOG_REMEMBER_ME_KEY=test-remember-me-key"
})
@AutoConfigureMockMvc
class SpringdocProductionExposureIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void springdocEndpointsAreDisabledInProductionEvenWhenAuthenticated() throws Exception {
        mockMvc.perform(get("/v3/api-docs").with(user("admin")))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/swagger-ui.html").with(user("admin")))
                .andExpect(status().isNotFound());
    }
}
