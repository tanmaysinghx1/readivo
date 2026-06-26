import { Component, signal, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookService, Book, Highlight } from '../../core/services/book.service';
import { ToastService } from '../../core/services/toast.service';

interface ParagraphSegment {
  text: string;
  isHighlighted: boolean;
  color?: 'yellow' | 'teal' | 'rose';
  id?: string;
  note?: string;
}

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './reader.component.html',
  styleUrl: './reader.component.css'
})
export class ReaderComponent implements OnInit, OnDestroy {
  // State signals
  protected readonly book = signal<Book | null>(null);
  protected readonly theme = signal<'light' | 'sepia' | 'dark'>('sepia');
  protected readonly fontSize = signal<number>(115); // Percentage
  protected readonly activePanel = signal<'chapters' | 'highlights' | null>(null);
  protected readonly isHeaderVisible = signal<boolean>(true);

  // Selection & floating menu signals
  protected readonly selectedText = signal<string>('');
  protected readonly showSelectionMenu = signal<boolean>(false);
  protected readonly menuX = signal<number>(0);
  protected readonly menuY = signal<number>(0);
  protected readonly activeHighlightColor = signal<'yellow' | 'teal' | 'rose'>('yellow');
  protected readonly newNoteText = signal<string>('');
  protected readonly isNoteInputOpen = signal<boolean>(false);
  protected readonly activeNoteDisplay = signal<{ text: string; note: string } | null>(null);

  private headerTimeout: any = null;
  private isScrolling = false;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookService = inject(BookService);
  private readonly toastService = inject(ToastService);

  ngOnInit(): void {
    const bookId = this.route.snapshot.paramMap.get('id');
    if (!bookId) {
      this.router.navigate(['/library']).catch(err => console.error(err));
      return;
    }

    const foundBook = this.bookService.getBookById(bookId);
    if (!foundBook) {
      this.router.navigate(['/library']).catch(err => console.error(err));
      return;
    }

    this.book.set(foundBook);
    
    // Auto-hide header after 3 seconds on load
    this.resetHeaderTimeout();

    // Check for deep-link scrolling to a specific highlight text
    const highlightText = this.route.snapshot.queryParamMap.get('highlightText');
    if (highlightText) {
      setTimeout(() => {
        this.scrollToHighlightText(highlightText);
      }, 500);
    }
  }

  ngOnDestroy(): void {
    if (this.headerTimeout) {
      clearTimeout(this.headerTimeout);
    }
  }

  // Handle Page Scrolling to Calculate Reading Progress percentage
  @HostListener('window:scroll', [])
  protected onWindowScroll(): void {
    const bookVal = this.book();
    if (!bookVal) return;

    this.isScrolling = true;
    
    // Temporarily show header when scrolling starts
    this.isHeaderVisible.set(true);
    this.resetHeaderTimeout();

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollHeight - clientHeight > 0) {
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      // Prevent frequent writes; only update if progress changes by an integer percent
      if (Math.round(progress) !== bookVal.progress) {
        this.bookService.updateProgress(bookVal.id, progress);
        // Refresh local book state
        this.refreshBookState();
      }
    }
  }

  // Show header on mouse movement at the top of screen
  @HostListener('window:mousemove', ['$event'])
  protected onMouseMove(event: MouseEvent): void {
    if (event.clientY < 80) {
      this.isHeaderVisible.set(true);
      this.resetHeaderTimeout();
    }
  }

  private resetHeaderTimeout(): void {
    if (this.headerTimeout) {
      clearTimeout(this.headerTimeout);
    }
    this.headerTimeout = setTimeout(() => {
      // Only hide if the panels are closed and the user isn't selecting text
      if (!this.activePanel() && !this.showSelectionMenu()) {
        this.isHeaderVisible.set(false);
      }
    }, 3000);
  }

  private refreshBookState(): void {
    const currentBook = this.book();
    if (currentBook) {
      const refreshed = this.bookService.getBookById(currentBook.id);
      if (refreshed) {
        this.book.set(refreshed);
      }
    }
  }

  // Set reader font size
  protected adjustFontSize(amount: number): void {
    const nextSize = this.fontSize() + amount;
    if (nextSize >= 85 && nextSize <= 160) {
      this.fontSize.set(nextSize);
    }
  }

  // Handle Text Selection using DOM Selection APIs
  protected handleTextSelection(event: MouseEvent): void {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      // If we clicked on an existing highlight, show its note
      const target = event.target as HTMLElement;
      if (target && target.classList.contains('highlight-segment')) {
        const note = target.getAttribute('data-note');
        const text = target.innerText;
        if (note) {
          this.activeNoteDisplay.set({ text, note });
          return;
        }
      }
      
      // Otherwise, close menus
      this.closeSelectionMenu();
      this.activeNoteDisplay.set(null);
      return;
    }

    const selectedStr = selection.toString().trim();
    if (selectedStr.length < 2) {
      this.closeSelectionMenu();
      return;
    }

    // Capture selection coordinates to position the floating menu
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Calculate coordinates relative to viewport
      const x = rect.left + rect.width / 2 - 100; // Center the menu
      const y = rect.top + window.scrollY - 55;   // Float above text selection

      this.menuX.set(Math.max(10, x));
      this.menuY.set(y);
      this.selectedText.set(selectedStr);
      this.showSelectionMenu.set(true);
      this.isHeaderVisible.set(true); // Keep header visible while selecting
    } catch (e) {
      console.error('Failed to get selection range', e);
    }
  }

  protected closeSelectionMenu(): void {
    this.showSelectionMenu.set(false);
    this.selectedText.set('');
    this.newNoteText.set('');
    this.isNoteInputOpen.set(false);
    
    // Clear selection from screen
    try {
      window.getSelection()?.removeAllRanges();
    } catch (e) {}
  }

  // Create a new highlight from the active selection
  protected createHighlight(color: 'yellow' | 'teal' | 'rose'): void {
    const currentBook = this.book();
    if (!currentBook || !this.selectedText()) return;

    this.bookService.addHighlight(
      currentBook.id,
      this.selectedText(),
      color,
      this.newNoteText()
    );

    this.refreshBookState();
    const hasNote = this.newNoteText().trim().length > 0;
    this.toastService.success(hasNote ? 'Highlight & note saved' : 'Text highlighted');
    this.closeSelectionMenu();
  }

  // Delete a highlight
  protected removeHighlight(highlightId: string): void {
    const currentBook = this.book();
    if (!currentBook) return;

    this.bookService.deleteHighlight(currentBook.id, highlightId);
    this.refreshBookState();
    this.toastService.success('Highlight deleted');

    // If deleting the active note, close the display bubble
    if (this.activeNoteDisplay() && this.book()?.highlights.every(h => h.id !== highlightId)) {
      this.activeNoteDisplay.set(null);
    }
  }

  // Toggle sliding side drawers
  protected togglePanel(panel: 'chapters' | 'highlights'): void {
    if (this.activePanel() === panel) {
      this.activePanel.set(null);
    } else {
      this.activePanel.set(panel);
      this.isHeaderVisible.set(true);
    }
  }

  // Helper to segment a paragraph text dynamically by applying highlights
  protected getParagraphSegments(text: string): ParagraphSegment[] {
    const currentBook = this.book();
    if (!currentBook || currentBook.highlights.length === 0) {
      return [{ text, isHighlighted: false }];
    }

    // Find all highlights that exist within this paragraph text
    const matches = currentBook.highlights
      .map(h => ({
        highlight: h,
        index: text.indexOf(h.text)
      }))
      .filter(m => m.index !== -1)
      // Sort matches by their index position in the paragraph
      .sort((a, b) => a.index - b.index);

    if (matches.length === 0) {
      return [{ text, isHighlighted: false }];
    }

    const segments: ParagraphSegment[] = [];
    let currentIndex = 0;

    for (const match of matches) {
      // Add unhighlighted segment before the match
      if (match.index > currentIndex) {
        segments.push({
          text: text.substring(currentIndex, match.index),
          isHighlighted: false
        });
      }

      // Add highlighted segment
      segments.push({
        text: match.highlight.text,
        isHighlighted: true,
        color: match.highlight.color,
        id: match.highlight.id,
        note: match.highlight.note
      });

      currentIndex = match.index + match.highlight.text.length;
    }

    // Add remaining text after all highlights are processed
    if (currentIndex < text.length) {
      segments.push({
        text: text.substring(currentIndex),
        isHighlighted: false
      });
    }

    return segments;
  }

  // Smoothly scroll to a specific paragraph index
  protected scrollToParagraph(index: number): void {
    const el = document.getElementById(`p_${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // If highlights panel is open, close it to focus
      this.activePanel.set(null);
    }
  }

  // Find a paragraph index containing specific text (for scrolling to highlights)
  protected scrollToHighlightText(text: string): void {
    const bookVal = this.book();
    if (!bookVal) return;

    // Find which paragraph contains this text
    for (let c = 0; c < bookVal.chapters.length; c++) {
      const paragraphs = bookVal.chapters[c].paragraphs;
      for (let p = 0; p < paragraphs.length; p++) {
        if (paragraphs[p].includes(text)) {
          this.scrollToParagraph(p);
          return;
        }
      }
    }
  }
}
