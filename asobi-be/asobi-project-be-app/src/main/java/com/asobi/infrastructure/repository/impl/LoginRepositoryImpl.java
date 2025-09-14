package com.asobi.infrastructure.repository.impl;

import com.asobi.domain.model.Account;
import com.asobi.domain.repository.IF.LoginRepositoryIF;
import com.asobi.infrastructure.db.entity.AccountInfo;
import com.asobi.infrastructure.db.stored.LoginStoredProc;
import java.util.Optional;
import org.springframework.stereotype.Repository;

/**
 * ログインリポジトリの実装。
 */
@Repository
public class LoginRepositoryImpl implements LoginRepositoryIF {

    private final LoginStoredProc storedProc;

    public LoginRepositoryImpl(LoginStoredProc storedProc) {
        this.storedProc = storedProc;
    }

    @Override
    public Optional<Account> findByCredentials(String username, String password) {
        AccountInfo info = storedProc.call(username, password);
        if (info == null) {
            return Optional.empty();
        }
        Account account = new Account(info.getUsername(), info.getPassword(), info.getDisplayName());
        return Optional.of(account);
    }
}
