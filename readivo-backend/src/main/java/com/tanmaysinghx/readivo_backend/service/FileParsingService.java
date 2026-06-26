package com.tanmaysinghx.readivo_backend.service;

import com.tanmaysinghx.readivo_backend.model.Chapter;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
public class FileParsingService {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParsedBookData {
        private String title;
        private String author;
        private String readTime;
        private List<Chapter> chapters;
    }

    private static final Pattern CHAPTER_PATTERN = Pattern.compile(
            "^(?:chapter|book|section|part|act|scene|volume|chapter\\s+\\d+|[ivxldcmy]+[.:\\-\\s]+).*$",
            Pattern.CASE_INSENSITIVE
    );

    /**
     * Parses a PDF or TXT file into chapters and paragraphs, and extracts metadata.
     */
    public ParsedBookData parseFile(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        String text = "";
        
        if (filename != null && filename.toLowerCase().endsWith(".pdf")) {
            text = extractTextFromPdf(file);
        } else {
            // Default to TXT parsing
            text = new String(file.getBytes(), StandardCharsets.UTF_8);
        }

        return parseTextToBookData(text, filename);
    }

    private String extractTextFromPdf(MultipartFile file) throws IOException {
        log.info("Extracting text from PDF: {}", file.getOriginalFilename());
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            // Sort by position to ensure logical reading order
            stripper.setSortByPosition(true);
            String text = stripper.getText(document);
            log.info("PDF text extraction completed. Character count: {}", text.length());
            return text;
        } catch (Exception e) {
            log.error("Error extracting text from PDF, falling back to basic string conversion", e);
            return new String(file.getBytes(), StandardCharsets.UTF_8);
        }
    }

    private ParsedBookData parseTextToBookData(String text, String filename) {
        ParsedBookData data = new ParsedBookData();
        
        // 1. Parse Title and Author from filename: "Author - Title.pdf"
        parseMetadataFromFilename(filename, data);

        // 2. Process paragraphs
        // Split by blank lines (one or more newlines with optional spaces in between)
        String[] rawParagraphs = text.split("\\r?\\n\\s*\\r?\\n");
        List<String> cleanedParagraphs = Arrays.stream(rawParagraphs)
                .map(p -> p.replaceAll("\\r?\\n", " ")) // Replace single newlines with spaces for smooth sentence flow
                .map(String::trim)
                .filter(p -> !p.isEmpty())
                .collect(Collectors.toList());

        log.info("Found {} paragraphs after cleaning.", cleanedParagraphs.size());

        List<Chapter> chapters = new ArrayList<>();
        Chapter currentChapter = null;
        int chapterCounter = 1;

        for (String paragraph : cleanedParagraphs) {
            // Check if this paragraph looks like a Chapter title
            boolean isChapterHeader = false;
            String trimmed = paragraph.trim();
            
            if (trimmed.length() < 100) {
                // If it's short, check if it matches our chapter pattern or is in all-caps and short
                if (CHAPTER_PATTERN.matcher(trimmed).matches() || (trimmed.equals(trimmed.toUpperCase()) && trimmed.length() < 60)) {
                    isChapterHeader = true;
                }
            }

            if (isChapterHeader) {
                // Save old chapter if it exists and has content
                if (currentChapter != null && !currentChapter.getParagraphs().isEmpty()) {
                    chapters.add(currentChapter);
                }
                
                currentChapter = new Chapter();
                currentChapter.setTitle(trimmed);
                currentChapter.setParagraphs(new ArrayList<>());
            } else {
                // Ensure we have a chapter to add paragraphs to
                if (currentChapter == null) {
                    currentChapter = new Chapter();
                    currentChapter.setTitle("Chapter I: Introduction");
                    currentChapter.setParagraphs(new ArrayList<>());
                }
                currentChapter.getParagraphs().add(paragraph);

                // Smart safeguard: if a chapter becomes too long (e.g., more than 15 paragraphs),
                // and no headers are being detected naturally, split it to maintain reader performance.
                if (currentChapter.getParagraphs().size() >= 15) {
                    chapters.add(currentChapter);
                    chapterCounter++;
                    currentChapter = new Chapter();
                    currentChapter.setTitle("Chapter " + getRomanNumeral(chapterCounter) + ": Continuation");
                    currentChapter.setParagraphs(new ArrayList<>());
                }
            }
        }

        // Add the last chapter
        if (currentChapter != null && !currentChapter.getParagraphs().isEmpty()) {
            chapters.add(currentChapter);
        }

        // Fallback: if absolutely no chapters were created, create one
        if (chapters.isEmpty()) {
            Chapter fallbackChapter = new Chapter();
            fallbackChapter.setTitle("Chapter I: Reader Canvas");
            fallbackChapter.setParagraphs(new ArrayList<>(cleanedParagraphs));
            chapters.add(fallbackChapter);
        }

        data.setChapters(chapters);
        
        // 3. Calculate dynamic reading time (average speed of 200 words/min)
        int wordCount = text.split("\\s+").length;
        int minutes = Math.max(1, wordCount / 200);
        String readTimeStr;
        if (minutes >= 60) {
            int hours = minutes / 60;
            int remainingMinutes = minutes % 60;
            readTimeStr = hours + "h " + (remainingMinutes > 0 ? remainingMinutes + "m" : "");
        } else {
            readTimeStr = minutes + "m";
        }
        data.setReadTime(readTimeStr.trim());
        
        log.info("Successfully structured text into {} chapters. Estimated read time: {}", chapters.size(), readTimeStr);
        return data;
    }

    private void parseMetadataFromFilename(String filename, ParsedBookData data) {
        if (filename == null || filename.isEmpty()) {
            data.setTitle("Untitled Book");
            data.setAuthor("Unknown Author");
            return;
        }

        // Strip extension
        String baseName = filename;
        if (filename.contains(".")) {
            baseName = filename.substring(0, filename.lastIndexOf("."));
        }

        if (baseName.contains("-")) {
            String[] parts = baseName.split("-", 2);
            data.setAuthor(parts[0].trim());
            data.setTitle(parts[1].trim());
        } else {
            data.setTitle(baseName.trim());
            data.setAuthor("Unknown Author");
        }
    }

    private String getRomanNumeral(int number) {
        if (number < 1 || number > 50) return String.valueOf(number); // Safe range limit
        String[] roman = {"", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
                "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX",
                "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI", "XXVII", "XXVIII", "XXIX", "XXX",
                "XXXI", "XXXII", "XXXIII", "XXXIV", "XXXV", "XXXVI", "XXXVII", "XXXVIII", "XXXIX", "XL",
                "XLI", "XLII", "XLIII", "XLIV", "XLV", "XLVI", "XLVII", "XLVIII", "XLIX", "L"};
        return roman[number];
    }
}
