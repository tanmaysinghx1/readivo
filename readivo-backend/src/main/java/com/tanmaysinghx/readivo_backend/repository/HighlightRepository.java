package com.tanmaysinghx.readivo_backend.repository;

import com.tanmaysinghx.readivo_backend.model.Highlight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HighlightRepository extends JpaRepository<Highlight, String> {
    List<Highlight> findByUserIdAndBookId(Long userId, String bookId);
    List<Highlight> findByUserId(Long userId);
}
