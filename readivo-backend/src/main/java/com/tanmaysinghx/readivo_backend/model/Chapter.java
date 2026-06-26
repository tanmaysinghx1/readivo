package com.tanmaysinghx.readivo_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chapters")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Chapter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "chapter_paragraphs", joinColumns = @JoinColumn(name = "chapter_id"))
    @Column(name = "paragraph_text", columnDefinition = "TEXT")
    @OrderColumn(name = "paragraph_order")
    private List<String> paragraphs = new ArrayList<>();
}
