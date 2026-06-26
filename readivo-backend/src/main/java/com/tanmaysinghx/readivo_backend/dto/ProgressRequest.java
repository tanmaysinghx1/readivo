package com.tanmaysinghx.readivo_backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProgressRequest {
    @NotNull
    @Min(0)
    @Max(100)
    private Integer progress;

    @NotNull
    private Boolean inShelf;
}
