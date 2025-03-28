package com.example.oauthbackend;

import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    @GetMapping("/login/oauth2/code/google")
    public String oauthRedirect() {
        return "OAuth Login Success";
    }

//    @GetMapping("/oauth/redirect")  //
//    public String oauthRedirect(OAuth2AuthenticationToken token) {
//        return "OAuth Login Success! User Info: " + token.getPrincipal().getAttributes().toString();
//    }
//
//    @GetMapping("/user/me")
//    public String userInfo(OAuth2AuthenticationToken token) {
//        return token.getPrincipal().getAttributes().toString();
//    }
}