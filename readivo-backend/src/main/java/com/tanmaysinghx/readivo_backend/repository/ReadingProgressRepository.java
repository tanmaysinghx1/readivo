package com.tanmaysinghx.readivo_backend.repository;

import com.tanmaysinghx.readivo_backend.model.ReadingProgress;
import com.tanmaysinghx.readivo_backend.model.ReadingProgressId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReadingProgressRepository extends JpaRepository<ReadingProgress, ReadingProgressId> {
    List<ReadingProgress> findByIdUserId(Long userId);
    
    // Custom query to find progress for a specific user and book ID
    default Optional<ReadingProgress> findByUserIdAndBookId(Long userId, String bookId) {
        return findById(new ReadingProgressId(userId, bookId));
    }
}
