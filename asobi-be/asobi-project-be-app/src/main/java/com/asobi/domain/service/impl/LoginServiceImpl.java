package com.asobi.domain.service.impl;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.asobi.domain.model.Account;
import com.asobi.domain.repository.IF.LoginRepositoryIF;
import com.asobi.domain.service.IF.LoginServiceIF;

/**
 * ログインサービスの実装。
 */
@Service
public class LoginServiceImpl implements LoginServiceIF {

    private final LoginRepositoryIF loginRepository;

    public LoginServiceImpl(LoginRepositoryIF loginRepository) {
        this.loginRepository = loginRepository;
    }
    
    public void logout(String username) {
    	loginRepository.findByCredentials(username, "aaa");
    }

    @Override
    public Optional<Account> login(String username, String password) {
        return loginRepository.findByCredentials(username, password);
    }
}
