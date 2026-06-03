package com.cinelog.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cinelog.user.UserAccount;
import com.cinelog.user.UserAccountRepository;
import jakarta.servlet.http.Cookie;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class AuthSecurityIntegrationTests {

    private static final String LOGIN_JSON = """
            {
              "username": "admin",
              "password": "correct-password",
              "rememberMe": false
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcClient jdbcClient;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        jdbcClient.sql("DELETE FROM persistent_logins").update();
        userAccountRepository.deleteAll();
        userAccountRepository.saveAndFlush(
                new UserAccount("admin", passwordEncoder.encode("correct-password"), "Thomas"));
    }

    @Test
    void statusRemainsPublic() throws Exception {
        mockMvc.perform(get("/api/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    void currentUserIsPublicWhenUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(false))
                .andExpect(jsonPath("$.username").doesNotExist());
    }

    @Test
    void csrfEndpointReturnsReadableToken() throws Exception {
        mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headerName").value("X-CSRF-TOKEN"))
                .andExpect(jsonPath("$.token").isString());
    }

    @Test
    void csrfEndpointTokenAllowsLoginMutation() throws Exception {
        MvcResult csrf = mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode csrfBody = objectMapper.readTree(csrf.getResponse().getContentAsString());

        mockMvc.perform(post("/api/auth/login")
                        .session(session(csrf))
                        .header(csrfBody.get("headerName").asText(), csrfBody.get("token").asText())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true));
    }

    @Test
    void ratingValidationUsesCommonErrorEnvelopeWithFieldDetails() throws Exception {
        mockMvc.perform(put("/api/watch-entries/999/rating")
                        .with(user("admin"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.timestamp").isString())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.path").value("/api/watch-entries/999/rating"))
                .andExpect(jsonPath("$.fields.storyScreenplay").isString());
    }

    @Test
    void privateRatingEndpointReturnsJsonUnauthorized() throws Exception {
        mockMvc.perform(get("/api/watch-entries/999/rating"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.timestamp").isString())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.path").value("/api/watch-entries/999/rating"))
                .andExpect(jsonPath("$.fields").isMap());
    }

    @Test
    void externalMovieEndpointRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/external/movies/search").param("query", "prestige"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.path").value("/api/external/movies/search"));
    }

    @Test
    void rankingsAndDashboardRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/rankings").param("mode", "PERSONAL"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    void movieAndWatchEntryEndpointsRequireAuthenticationAndCsrfForMutations() throws Exception {
        mockMvc.perform(get("/api/movies"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/watch-entries/999"))
                .andExpect(status().isUnauthorized());

        MvcResult login = login(LOGIN_JSON);
        mockMvc.perform(post("/api/movies")
                        .session(session(login))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"No CSRF\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.timestamp").isString())
                .andExpect(jsonPath("$.error").value("Forbidden"))
                .andExpect(jsonPath("$.message").value("Access is denied"))
                .andExpect(jsonPath("$.path").value("/api/movies"))
                .andExpect(jsonPath("$.fields").isMap());
    }

    @Test
    void validLoginCreatesAuthenticatedSession() throws Exception {
        MvcResult login = login(LOGIN_JSON);

        mockMvc.perform(get("/api/auth/me").session(session(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.displayName").value("Thomas"));
    }

    @Test
    void invalidLoginFailsWithoutCredentialDetails() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "admin",
                                  "password": "wrong-password",
                                  "rememberMe": false
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    void logoutInvalidatesSession() throws Exception {
        MvcResult login = login(LOGIN_JSON);
        MockHttpSession session = session(login);

        mockMvc.perform(post("/api/auth/logout").session(session).with(csrf()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(false));
    }

    @Test
    void csrfIsRequiredForAuthenticatedRatingMutation() throws Exception {
        MvcResult login = login(LOGIN_JSON);

        mockMvc.perform(put("/api/watch-entries/999/rating")
                        .session(session(login))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void rememberMeCreatesPersistentTokenAndAuthenticatesWithoutSession() throws Exception {
        MvcResult login = login("""
                {
                  "username": "admin",
                  "password": "correct-password",
                  "rememberMe": true
                }
                """);

        Cookie rememberMeCookie = login.getResponse().getCookie("CINELOG_REMEMBER_ME");
        assertThat(rememberMeCookie).isNotNull();
        assertThat(rememberMeCookie.isHttpOnly()).isTrue();
        assertThat(rememberMeCookie.getSecure()).isFalse();
        assertThat(rememberMeCookie.getAttribute("SameSite")).isEqualTo("Lax");
        assertThat(jdbcClient.sql("SELECT COUNT(*) FROM persistent_logins")
                .query(Integer.class)
                .single()).isEqualTo(1);

        mockMvc.perform(get("/api/auth/me").cookie(rememberMeCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.username").value("admin"));
    }

    @Test
    void staleRememberMeCookieReturnsJsonUnauthorizedAndClearsCookie() throws Exception {
        MvcResult login = login("""
                {
                  "username": "admin",
                  "password": "correct-password",
                  "rememberMe": true
                }
                """);
        Cookie rememberMeCookie = login.getResponse().getCookie("CINELOG_REMEMBER_ME");
        assertThat(rememberMeCookie).isNotNull();

        jdbcClient.sql("UPDATE persistent_logins SET token = 'stale-token-value'").update();

        mockMvc.perform(get("/api/movies").cookie(rememberMeCookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("Authentication is required"))
                .andExpect(jsonPath("$.path").value("/api/movies"))
                .andExpect(cookie().maxAge("CINELOG_REMEMBER_ME", 0));
    }

    @Test
    void passwordIsStoredAsBcryptHash() {
        UserAccount account = userAccountRepository.findByUsername("admin").orElseThrow();

        assertThat(account.getPasswordHash()).isNotEqualTo("correct-password");
        assertThat(passwordEncoder.matches("correct-password", account.getPasswordHash())).isTrue();
    }

    private MvcResult login(String body) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andReturn();
    }

    private MockHttpSession session(MvcResult login) {
        return (MockHttpSession) login.getRequest().getSession(false);
    }
}
