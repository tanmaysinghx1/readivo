import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookService } from '../../core/services/book.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './library.component.html',
  styleUrl: './library.component.css'
})
export class LibraryComponent {
  private readonly bookService = inject(BookService);
  private readonly authService = inject(AuthService);

  // Expose the books list from BookService
  protected readonly books = this.bookService.books;

  // Dynamically compute the logged-in user's name from AuthService session
  protected readonly userName = computed(() => this.authService.currentUser()?.username || 'Guest');

  // Dynamically determine the active book for the "Continue Reading" section:
  // 1. First, check for a book in the shelf that is actively in-progress (0 < progress < 100)
  // 2. Next, check for a book in the shelf that is not started (progress === 0)
  // 3. Fall back to any book in the shelf (even if 100% completed)
  // 4. Return null if the user's shelf is completely empty
  protected readonly activeBook = computed(() => {
    const shelfBooks = this.books().filter(b => b.inShelf);
    if (shelfBooks.length === 0) {
      return null;
    }

    const inProgress = shelfBooks.find(b => b.progress > 0 && b.progress < 100);
    if (inProgress) {
      return inProgress;
    }

    const notStarted = shelfBooks.find(b => b.progress === 0);
    if (notStarted) {
      return notStarted;
    }

    return shelfBooks[0];
  });
}
