package com.cinelog.security;

import com.cinelog.user.UserAccountService;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.rememberme.JdbcTokenRepositoryImpl;
import org.springframework.security.web.authentication.rememberme.PersistentTokenBasedRememberMeServices;
import org.springframework.security.web.authentication.rememberme.PersistentTokenRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.util.Assert;

@Configuration
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    PersistentTokenRepository persistentTokenRepository(DataSource dataSource) {
        JdbcTokenRepositoryImpl tokenRepository = new JdbcTokenRepositoryImpl();
        tokenRepository.setDataSource(dataSource);
        return tokenRepository;
    }

    @Bean
    PersistentTokenBasedRememberMeServices rememberMeServices(
            @Value("${cinelog.security.remember-me-key}") String rememberMeKey,
            @Value("${cinelog.security.secure-cookies:false}") boolean secureCookies,
            UserAccountService userAccountService,
            PersistentTokenRepository tokenRepository) {
        Assert.hasText(rememberMeKey, "CINELOG_REMEMBER_ME_KEY must be configured");
        PersistentTokenBasedRememberMeServices services =
                new PersistentTokenBasedRememberMeServices(rememberMeKey, userAccountService, tokenRepository);
        services.setCookieName("CINELOG_REMEMBER_ME");
        services.setAlwaysRemember(true);
        services.setUseSecureCookie(secureCookies);
        services.setCookieCustomizer(cookie -> cookie.setAttribute("SameSite", "Lax"));
        return services;
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler,
            PersistentTokenBasedRememberMeServices rememberMeServices) throws Exception {
        return http
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/api/status", "/api/auth/login", "/api/auth/me", "/api/auth/csrf").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").authenticated()
                        .anyRequest().authenticated())
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .rememberMe(remember -> remember.rememberMeServices(rememberMeServices))
                .build();
    }
}
