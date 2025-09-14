package com.asobi.domain.repository.IF;

import com.asobi.domain.model.Account;
import java.util.Optional;

/**
 * ログイン処理用リポジトリのインターフェース。
 */
public interface LoginRepositoryIF {

    /**
     * ユーザーIDとパスワードでアカウントを取得する。
     *
     * @param username ユーザーID
     * @param password パスワード
     * @return アカウント。存在しない場合は空。
     */
    Optional<Account> findByCredentials(String username, String password);
}
