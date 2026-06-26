package com.tanmaysinghx.readivo_backend.controller;

import com.tanmaysinghx.readivo_backend.dto.ProgressRequest;
import com.tanmaysinghx.readivo_backend.security.UserDetailsImpl;
import com.tanmaysinghx.readivo_backend.service.BookService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/books/{bookId}/progress")
public class ProgressController {

    @Autowired
    private BookService bookService;

    // Update reading progress and/or shelf status for a book
    @PostMapping
    public ResponseEntity<?> updateProgress(
            @PathVariable String bookId,
            @Valid @RequestBody ProgressRequest progressRequest) {
        
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        
        bookService.updateProgress(
                userDetails.getId(), 
                bookId, 
                progressRequest.getProgress(), 
                progressRequest.getInShelf()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Progress updated successfully!");
        response.put("progress", progressRequest.getProgress());
        response.put("inShelf", progressRequest.getInShelf());
        
        return ResponseEntity.ok(response);
    }
}
