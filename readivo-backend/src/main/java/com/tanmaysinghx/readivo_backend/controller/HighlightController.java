package com.tanmaysinghx.readivo_backend.controller;

import com.tanmaysinghx.readivo_backend.dto.HighlightRequest;
import com.tanmaysinghx.readivo_backend.model.Highlight;
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
@RequestMapping("/api/books/{bookId}/highlights")
public class HighlightController {

    @Autowired
    private BookService bookService;

    // Create a new highlight for a book
    @PostMapping
    public ResponseEntity<Highlight> addHighlight(
            @PathVariable String bookId,
            @Valid @RequestBody HighlightRequest highlightRequest) {
        
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        
        Highlight highlight = bookService.addHighlight(userDetails.getId(), bookId, highlightRequest);
        return ResponseEntity.ok(highlight);
    }

    // Update an existing highlight's study note
    @PutMapping("/{highlightId}")
    public ResponseEntity<Highlight> updateHighlightNote(
            @PathVariable String bookId,
            @PathVariable String highlightId,
            @RequestBody Map<String, String> body) {
        
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        
        String note = body.get("note");
        return bookService.updateHighlightNote(userDetails.getId(), highlightId, note)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete a highlight
    @DeleteMapping("/{highlightId}")
    public ResponseEntity<?> deleteHighlight(
            @PathVariable String bookId,
            @PathVariable String highlightId) {
        
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        
        boolean deleted = bookService.deleteHighlight(userDetails.getId(), highlightId);
        if (deleted) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Highlight deleted successfully!");
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
