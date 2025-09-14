package com.asobi.infrastructure.db.stored;

import com.asobi.infrastructure.db.entity.AccountInfo;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.ParameterMode;
import jakarta.persistence.StoredProcedureQuery;
import org.springframework.stereotype.Repository;

/**
 * ログイン用ストアドプロシージャを呼び出すクラス。
 */
@Repository
public class LoginStoredProc {

    private final EntityManager entityManager;

    public LoginStoredProc(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    /**
     * ユーザーIDとパスワードでストアドを実行し、該当するアカウント情報を取得する。
     *
     * @param username ユーザーID
     * @param password パスワード
     * @return アカウント情報。存在しない場合はnull。
     */
    public AccountInfo call(String username, String password) {
        StoredProcedureQuery query = entityManager
                .createStoredProcedureQuery("login_proc", AccountInfo.class);
        query.registerStoredProcedureParameter("p_username", String.class, ParameterMode.IN);
        query.registerStoredProcedureParameter("p_password", String.class, ParameterMode.IN);
        query.setParameter("p_username", username);
        query.setParameter("p_password", password);
        try {
            return (AccountInfo) query.getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }
}
