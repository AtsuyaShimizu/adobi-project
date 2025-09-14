package com.asobi.domain.service.impl;

import com.asobi.domain.model.Account;
import com.asobi.domain.repository.IF.LoginRepositoryIF;
import com.asobi.domain.service.IF.LoginServiceIF;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * ログインサービスの実装。
 */
@Service
public class LoginServiceImpl implements LoginServiceIF {

    private final LoginRepositoryIF loginRepository;

    public LoginServiceImpl(LoginRepositoryIF loginRepository) {
        this.loginRepository = loginRepository;
    }

    @Override
    public Optional<Account> login(String username, String password) {
        return loginRepository.findByCredentials(username, password);
    }
}
