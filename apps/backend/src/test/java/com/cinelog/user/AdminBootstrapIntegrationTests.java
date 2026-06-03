package com.cinelog.user;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@ActiveProfiles("test")
@SpringBootTest
@Transactional
class AdminBootstrapIntegrationTests {

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void createsHashedAdminOnlyWhenNoUserExistsAndDoesNotOverwriteIt() {
        userAccountRepository.deleteAll();
        AdminBootstrap bootstrap =
                new AdminBootstrap(userAccountRepository, passwordEncoder, "admin", "initial-password", "Thomas");

        bootstrap.run(new DefaultApplicationArguments(new String[0]));
        bootstrap.run(new DefaultApplicationArguments(new String[0]));

        UserAccount account = userAccountRepository.findByUsername("admin").orElseThrow();
        assertThat(userAccountRepository.count()).isEqualTo(1);
        assertThat(account.getPasswordHash()).isNotEqualTo("initial-password");
        assertThat(passwordEncoder.matches("initial-password", account.getPasswordHash())).isTrue();
    }
}
