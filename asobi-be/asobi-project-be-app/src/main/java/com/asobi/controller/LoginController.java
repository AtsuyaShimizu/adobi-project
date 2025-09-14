package com.asobi.controller;

import com.asobi.domain.model.Account;
import com.asobi.domain.service.IF.LoginServiceIF;
import java.util.Optional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * ログイン用のRESTコントローラ。
 */
@RestController
@RequestMapping("/api")
public class LoginController {

    private final LoginServiceIF loginService;

    public LoginController(LoginServiceIF loginService) {
        this.loginService = loginService;
    }

    @PostMapping("/login")
    public ResponseEntity<Account> login(@RequestBody LoginRequest request) {
        Optional<Account> account = loginService.login(request.getUsername(), request.getPassword());
        return account.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(401).build());
    }

    /**
     * ログインリクエスト。
     */
    public static class LoginRequest {
        private String username;
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}
