package com.tanmaysinghx.readivo_backend.dto;

import com.tanmaysinghx.readivo_backend.model.Chapter;
import com.tanmaysinghx.readivo_backend.model.Highlight;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookResponse {
    private String id;
    private String title;
    private String author;
    private String category;
    private String description;
    private Double rating;
    private String readTime;
    private String coverGradient;
    private String coverTextColor;
    private String fileUrl;
    private List<Chapter> chapters;

    // User-specific states
    private Integer progress;
    private Boolean inShelf;
    private List<Highlight> highlights;
}
