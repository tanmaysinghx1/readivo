package com.tanmaysinghx.readivo_backend.controller;

import com.tanmaysinghx.readivo_backend.dto.BookResponse;
import com.tanmaysinghx.readivo_backend.model.Book;
import com.tanmaysinghx.readivo_backend.security.UserDetailsImpl;
import com.tanmaysinghx.readivo_backend.service.BookService;
import com.tanmaysinghx.readivo_backend.service.R2StorageService;
import com.tanmaysinghx.readivo_backend.service.FileParsingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Slf4j
@RestController
@RequestMapping("/api/books")
public class BookController {

    @Autowired
    private BookService bookService;

    @Autowired
    private R2StorageService storageService;

    @Autowired
    private FileParsingService parsingService;

    // Endpoint to upload a book file (PDF/TXT) to R2 and parse its contents
    @PostMapping("/upload")
    public ResponseEntity<?> uploadBookFile(@RequestParam("file") MultipartFile file) {
        try {
            log.info("Received file upload request for file: {}, size: {} bytes", 
                    file.getOriginalFilename(), file.getSize());
            
            // 1. Upload to R2 (or local fallback)
            String fileUrl = storageService.uploadFile(file);
            
            // 2. Parse file text contents (PDF text extraction or TXT parsing)
            FileParsingService.ParsedBookData parsedData = parsingService.parseFile(file);
            
            // 3. Construct response mapping
            Map<String, Object> response = new HashMap<>();
            response.put("fileUrl", fileUrl);
            response.put("title", parsedData.getTitle());
            response.put("author", parsedData.getAuthor());
            response.put("readTime", parsedData.getReadTime());
            response.put("chapters", parsedData.getChapters());
            
            log.info("File upload and parsing successful for: {}. Chapters parsed: {}", 
                    parsedData.getTitle(), parsedData.getChapters().size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to upload/parse book file", e);
            return ResponseEntity.status(500).body("File upload and parsing failed: " + e.getMessage());
        }
    }

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
