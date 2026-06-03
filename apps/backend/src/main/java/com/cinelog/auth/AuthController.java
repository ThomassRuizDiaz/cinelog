package com.cinelog.auth;

import com.cinelog.auth.dto.CurrentUserResponse;
import com.cinelog.auth.dto.CsrfTokenResponse;
import com.cinelog.auth.dto.LoginRequest;
import com.cinelog.common.api.ApiErrorResponse;
import com.cinelog.user.UserAccount;
import com.cinelog.user.UserAccountService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.authentication.rememberme.PersistentTokenBasedRememberMeServices;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final PersistentTokenBasedRememberMeServices rememberMeServices;
    private final UserAccountService userAccountService;

    public AuthController(
            AuthenticationManager authenticationManager,
            SecurityContextRepository securityContextRepository,
            PersistentTokenBasedRememberMeServices rememberMeServices,
            UserAccountService userAccountService) {
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.rememberMeServices = rememberMeServices;
        this.userAccountService = userAccountService;
    }

    @PostMapping("/login")
    ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest request,
            HttpServletResponse response) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            loginRequest.username(), loginRequest.password()));
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, request, response);
            if (loginRequest.rememberMe()) {
                rememberMeServices.loginSuccess(request, response, authentication);
            }
            return ResponseEntity.ok(currentUser(authentication));
        } catch (AuthenticationException exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiErrorResponse.of(
                    HttpStatus.UNAUTHORIZED,
                    "Unauthorized",
                    "Invalid username or password",
                    request.getRequestURI(),
                    Map.of()));
        }
    }

    @PostMapping("/logout")
    ResponseEntity<Void> logout(
            Authentication authentication,
            HttpServletRequest request,
            HttpServletResponse response) {
        rememberMeServices.logout(request, response, authentication);
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    CurrentUserResponse me(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            return CurrentUserResponse.unauthenticated();
        }
        return currentUser(authentication);
    }

    @GetMapping("/csrf")
    CsrfTokenResponse csrf(HttpServletRequest request) {
        CsrfToken token = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (token == null) {
            token = (CsrfToken) request.getAttribute("_csrf");
        }
        if (token == null) {
            throw new IllegalStateException("CSRF token is unavailable");
        }
        return new CsrfTokenResponse(token.getHeaderName(), token.getToken());
    }

    private CurrentUserResponse currentUser(Authentication authentication) {
        UserAccount account = userAccountService.findByUsername(authentication.getName());
        return new CurrentUserResponse(true, account.getUsername(), account.getDisplayName());
    }
}
