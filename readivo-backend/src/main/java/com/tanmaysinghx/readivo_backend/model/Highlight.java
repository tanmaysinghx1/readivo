package com.tanmaysinghx.readivo_backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "highlights",
       indexes = {
         @Index(name = "idx_highlight_user_book", columnList = "user_id, book_id")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Highlight {
    @Id
    @Column(length = 50)
    private String id;

    @NotBlank
    @Column(name = "book_id", length = 50, nullable = false)
    private String bookId;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @NotBlank
    @Lob
    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;

    @NotBlank
    @Column(length = 20, nullable = false)
    private String color; // yellow, teal, rose

    @Lob
    @Column(columnDefinition = "TEXT")
    private String note;

    @NotNull
    @Column(name = "created_at", nullable = false)
    private Long createdAt;
}
