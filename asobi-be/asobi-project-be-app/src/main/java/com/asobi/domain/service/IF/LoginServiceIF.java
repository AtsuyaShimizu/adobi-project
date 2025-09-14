package com.asobi.domain.service.IF;

import com.asobi.domain.model.Account;
import java.util.Optional;

/**
 * ログイン処理のサービスインターフェース。
 */
public interface LoginServiceIF {

    /**
     * ログインを実行する。
     *
     * @param username ユーザーID
     * @param password パスワード
     * @return アカウント。認証失敗時は空。
     */
    Optional<Account> login(String username, String password);
}
