package com.tanmaysinghx.readivo_backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class ViewController {

    // Forward key Angular client-side routes to index.html so the SPA router can handle them
    @RequestMapping(value = {
        "/",
        "/login",
        "/register",
        "/reader/**",
        "/library",
        "/notes",
        "/browse",
        "/admin"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
