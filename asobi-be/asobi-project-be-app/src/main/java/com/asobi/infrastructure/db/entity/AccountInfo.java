package com.asobi.infrastructure.db.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

/**
 * DBエンティティ: アカウント情報。
 */
@Entity
@Table(name = "account")
@Data
public class AccountInfo {
    /** ユーザーID */
    @Id
    private String username;

    /** パスワード */
    private String password;

    /** 表示名 */
    private String displayName;
}
