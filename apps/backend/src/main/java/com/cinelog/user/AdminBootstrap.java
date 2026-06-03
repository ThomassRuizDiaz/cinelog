package com.cinelog.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;
    private final String displayName;

    public AdminBootstrap(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            @Value("${cinelog.admin.username:}") String username,
            @Value("${cinelog.admin.password:}") String password,
            @Value("${cinelog.admin.display-name:}") String displayName) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.password = password;
        this.displayName = displayName;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userAccountRepository.count() > 0) {
            return;
        }
        if (!StringUtils.hasText(username)
                && !StringUtils.hasText(password)
                && !StringUtils.hasText(displayName)) {
            LOGGER.warn("No Cinelog admin exists. Set CINELOG_ADMIN_USERNAME, CINELOG_ADMIN_PASSWORD, "
                    + "and CINELOG_ADMIN_DISPLAY_NAME to create the initial account.");
            return;
        }
        if (!StringUtils.hasText(username)
                || !StringUtils.hasText(password)
                || !StringUtils.hasText(displayName)) {
            throw new IllegalStateException("Initial admin bootstrap requires username, password, and display name");
        }
        UserAccount account = new UserAccount(username, passwordEncoder.encode(password), displayName);
        userAccountRepository.save(account);
        LOGGER.info("Created initial Cinelog admin account for username '{}'", username);
    }
}
