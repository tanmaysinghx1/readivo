import { Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

export interface Highlight {
  id: string;
  text: string;
  color: 'yellow' | 'teal' | 'rose';
  note?: string;
  createdAt: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string;
  rating: number;
  readTime: string;
  coverGradient: string;
  coverTextColor: string;
  
  // Immersive content for reading
  chapters: { title: string; paragraphs: string[] }[];
  
  // User specific progress & annotations
  progress: number; // Percentage (0 - 100)
  highlights: Highlight[];
  inShelf: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  // Signal containing the master list of books with progress & highlights synced from the backend
  public readonly books = signal<Book[]>([]);

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {
    // Automatically load books from backend when the user is authenticated.
    // If signed out, clear the books list.
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.loadFromBackend();
      } else {
        this.books.set([]);
      }
    });
  }

  // Load user catalog from Spring Boot REST API
  public loadFromBackend(): void {
    this.http.get<Book[]>('http://localhost:8080/api/books').subscribe({
      next: (data) => {
        this.books.set(data);
      },
      error: (err) => {
        console.error('Failed to fetch books from backend', err);
      }
    });
  }

  // Fetch a single book details by ID from the books signal
  public getBookById(id: string): Book | undefined {
    return this.books().find(b => b.id === id);
  }

  // Update a book's reading progress percentage
  public updateProgress(id: string, progressPercentage: number): void {
    const validatedProgress = Math.min(100, Math.max(0, Math.round(progressPercentage)));
    
    // Optimistic UI Update: update the local state immediately
    const currentBooks = this.books();
    const updatedBooks = currentBooks.map(b => {
      if (b.id === id) {
        return { ...b, progress: validatedProgress };
      }
      return b;
    });
    this.books.set(updatedBooks);

    const book = currentBooks.find(b => b.id === id);
    const inShelf = book ? book.inShelf : true;

    // Persist to backend database in the background
    this.http.post(`http://localhost:8080/api/books/${id}/progress`, {
      progress: validatedProgress,
      inShelf: inShelf
    }).subscribe({
      error: (err) => {
        console.error('Failed to update progress on backend, rolling back', err);
        this.loadFromBackend(); // Rollback to server state on failure
      }
    });
  }

  // Add a new highlight with optional note to a book
  public addHighlight(id: string, text: string, color: 'yellow' | 'teal' | 'rose', note?: string): Highlight {
    const tempId = 'h_' + Math.random().toString(36).substring(2, 11);
    const newHighlight: Highlight = {
      id: tempId,
      text,
      color,
      note: note?.trim() || undefined,
      createdAt: Date.now()
    };

    // Optimistic UI Update: append to highlights list immediately
    this.books.set(this.books().map(b => {
      if (b.id === id) {
        return {
          ...b,
          highlights: [...b.highlights, newHighlight]
        };
      }
      return b;
    }));

    // Persist to backend database
    this.http.post<Highlight>(`http://localhost:8080/api/books/${id}/highlights`, {
      id: tempId,
      text,
      color,
      note: note?.trim() || undefined
    }).subscribe({
      next: (savedHighlight) => {
        // Swap out the temporary client-side ID with the finalized database state
        this.books.set(this.books().map(b => {
          if (b.id === id) {
            return {
              ...b,
              highlights: b.highlights.map(h => h.id === tempId ? savedHighlight : h)
            };
          }
          return b;
        }));
      },
      error: (err) => {
        console.error('Failed to save highlight to backend, rolling back', err);
        this.loadFromBackend();
      }
    });

    return newHighlight;
  }

  // Delete an existing highlight by ID
  public deleteHighlight(id: string, highlightId: string): void {
    // Optimistic UI Update: remove immediately
    this.books.set(this.books().map(b => {
      if (b.id === id) {
        return {
          ...b,
          highlights: b.highlights.filter(h => h.id !== highlightId)
        };
      }
      return b;
    }));

    // Persist deletion to backend
    this.http.delete(`http://localhost:8080/api/books/${id}/highlights/${highlightId}`).subscribe({
      error: (err) => {
        console.error('Failed to delete highlight on backend, rolling back', err);
        this.loadFromBackend();
      }
    });
  }

  // Add a book to the user's reading shelf
  public addToShelf(id: string): void {
    // Optimistic UI Update
    const currentBooks = this.books();
    this.books.set(currentBooks.map(b => b.id === id ? { ...b, inShelf: true } : b));

    const book = currentBooks.find(b => b.id === id);
    const progress = book ? book.progress : 0;

    // Sync shelf membership
    this.http.post(`http://localhost:8080/api/books/${id}/progress`, {
      progress: progress,
      inShelf: true
    }).subscribe({
      error: (err) => {
        console.error('Failed to add to shelf on backend, rolling back', err);
        this.loadFromBackend();
      }
    });
  }

  // Remove a book from the user's reading shelf
  public removeFromShelf(id: string): void {
    // Optimistic UI Update
    const currentBooks = this.books();
    this.books.set(currentBooks.map(b => b.id === id ? { ...b, inShelf: false } : b));

    const book = currentBooks.find(b => b.id === id);
    const progress = book ? book.progress : 0;

    // Sync shelf membership
    this.http.post(`http://localhost:8080/api/books/${id}/progress`, {
      progress: progress,
      inShelf: false
    }).subscribe({
      error: (err) => {
        console.error('Failed to remove from shelf on backend, rolling back', err);
        this.loadFromBackend();
      }
    });
  }

  // Edit/update an existing highlight's study note text
  public updateHighlightNote(bookId: string, highlightId: string, note: string): void {
    // Optimistic UI Update
    this.books.set(this.books().map(b => {
      if (b.id === bookId) {
        const updatedHighlights = b.highlights.map(h => 
          h.id === highlightId ? { ...h, note: note.trim() || undefined } : h
        );
        return { ...b, highlights: updatedHighlights };
      }
      return b;
    }));

    // Sync to backend
    this.http.put(`http://localhost:8080/api/books/${bookId}/highlights/${highlightId}`, {
      note: note.trim()
    }).subscribe({
      error: (err) => {
        console.error('Failed to update highlight note on backend, rolling back', err);
        this.loadFromBackend();
      }
    });
  }

  // Add a newly created book to the system catalog (admin simulation)
  public addCustomBook(bookData: Omit<Book, 'progress' | 'highlights' | 'inShelf'>): void {
    this.http.post<any>('http://localhost:8080/api/books', bookData).subscribe({
      next: (createdBook) => {
        const newBook: Book = {
          ...createdBook,
          progress: 0,
          highlights: [],
          inShelf: false
        };
        this.books.set([...this.books(), newBook]);
      },
      error: (err) => {
        console.error('Failed to save custom book to backend', err);
      }
    });
  }
}
