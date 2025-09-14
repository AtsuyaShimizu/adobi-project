package com.asobi.domain.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ドメインモデル: アカウント情報を表す。
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Account {
    /** ユーザーID */
    private String username;

    /** パスワード */
    private String password;

    /** 表示名 */
    private String displayName;
}
