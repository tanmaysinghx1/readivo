package com.tanmaysinghx.readivo_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "reading_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReadingProgress {
    @EmbeddedId
    private ReadingProgressId id;

    @Column(nullable = false)
    private Integer progress; // Percentage (0 - 100)

    @Column(name = "in_shelf", nullable = false)
    private Boolean inShelf = true;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
