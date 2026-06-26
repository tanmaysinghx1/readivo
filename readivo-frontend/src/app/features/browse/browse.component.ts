import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookService, Book } from '../../core/services/book.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-browse',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './browse.component.html',
  styleUrl: './browse.component.css'
})
export class BrowseComponent {
  protected readonly bookService = inject(BookService);
  protected readonly toastService = inject(ToastService);

  // Search and filter signals
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedCategory = signal<string>('all');

  // Compute unique categories from all books currently not in the user's shelf
  protected readonly categories = computed(() => {
    const allUnshelved = this.bookService.books().filter(b => !b.inShelf);
    const cats = allUnshelved.map(b => b.category);
    return Array.from(new Set(cats));
  });

  // Filter books that are NOT on the user's active reading shelf
  protected readonly availableBooks = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();

    return this.bookService.books().filter(b => {
      // 1. Only show books NOT in the shelf
      if (b.inShelf) return false;

      // 2. Category Filter
      if (cat !== 'all' && b.category !== cat) return false;

      // 3. Search Query Filter (Title or Author)
      if (query) {
        return b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query);
      }

      return true;
    });
  });

  // Action to add a book to the user's active shelf
  protected addToLibrary(id: string, title: string): void {
    this.bookService.addToShelf(id);
    this.toastService.success(`Added "${title}" to your library`);
  }
}
