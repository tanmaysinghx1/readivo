package com.tanmaysinghx.readivo_backend.controller;

import com.tanmaysinghx.readivo_backend.dto.BookResponse;
import com.tanmaysinghx.readivo_backend.model.Book;
import com.tanmaysinghx.readivo_backend.security.UserDetailsImpl;
import com.tanmaysinghx.readivo_backend.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/books")
public class BookController {

    @Autowired
    private BookService bookService;

    // Get all books in the catalog, merging progress and highlights for the authenticated user
    @GetMapping
    public ResponseEntity<List<BookResponse>> getAllBooks() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        List<BookResponse> books = bookService.getAllBooksForUser(userDetails.getId());
        return ResponseEntity.ok(books);
    }

    // Get a specific book by ID, merging progress and highlights for the authenticated user
    @GetMapping("/{id}")
    public ResponseEntity<BookResponse> getBookById(@PathVariable String id) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return bookService.getBookForUser(userDetails.getId(), id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Admin endpoint to add a new book to the catalog
    @PostMapping
    public ResponseEntity<Book> createBook(@RequestBody Book book) {
        Book created = bookService.createBook(book);
        return ResponseEntity.ok(created);
    }
}
