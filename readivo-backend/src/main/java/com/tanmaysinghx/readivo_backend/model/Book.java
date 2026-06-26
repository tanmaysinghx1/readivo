package com.tanmaysinghx.readivo_backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "books")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Book {
    @Id
    @Column(length = 50)
    private String id;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @NotBlank
    @Column(nullable = false)
    private String author;

    @NotBlank
    @Column(nullable = false)
    private String category;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double rating;

    @Column(name = "read_time", nullable = false)
    private String readTime;

    @Column(name = "cover_gradient", nullable = false)
    private String coverGradient;

    @Column(name = "cover_text_color", nullable = false)
    private String coverTextColor;

    @Column(name = "file_url", length = 512)
    private String fileUrl;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id")
    @OrderBy("id ASC")
    private List<Chapter> chapters = new ArrayList<>();
}
