package com.tanmaysinghx.readivo_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class HighlightRequest {
    private String id; // Client-generated highlight ID (optional)

    @NotBlank
    private String text;

    @NotBlank
    private String color; // yellow, teal, rose

    private String note;
}
