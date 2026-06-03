package com.cinelog.security;

import com.cinelog.user.UserAccountService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.rememberme.CookieTheftException;
import org.springframework.security.web.authentication.rememberme.InvalidCookieException;
import org.springframework.security.web.authentication.rememberme.PersistentTokenBasedRememberMeServices;
import org.springframework.security.web.authentication.rememberme.PersistentTokenRepository;

public class GracefulPersistentTokenRememberMeServices extends PersistentTokenBasedRememberMeServices {

    private static final Logger LOGGER = LoggerFactory.getLogger(GracefulPersistentTokenRememberMeServices.class);

    public GracefulPersistentTokenRememberMeServices(
            String key,
            UserAccountService userDetailsService,
            PersistentTokenRepository tokenRepository) {
        super(key, userDetailsService, tokenRepository);
    }

    @Override
    protected UserDetails processAutoLoginCookie(
            String[] cookieTokens,
            HttpServletRequest request,
            HttpServletResponse response) {
        try {
            return super.processAutoLoginCookie(cookieTokens, request, response);
        } catch (CookieTheftException exception) {
            LOGGER.warn("Invalid remember-me cookie rejected and cleared for {}", request.getRequestURI());
            cancelCookie(request, response);
            throw new InvalidCookieException("Invalid remember-me token");
        }
    }
}
