package com.cinelog.user;

import java.util.Collections;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserAccountService implements UserDetailsService {

    private final UserAccountRepository userAccountRepository;

    public UserAccountService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) {
        UserAccount account = findByUsername(username);
        return new User(
                account.getUsername(),
                account.getPasswordHash(),
                account.isEnabled(),
                true,
                true,
                true,
                Collections.emptyList());
    }

    @Transactional(readOnly = true)
    public UserAccount findByUsername(String username) {
        return userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid username or password"));
    }
}
