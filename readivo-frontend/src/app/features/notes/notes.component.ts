import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookService, Book, Highlight } from '../../core/services/book.service';
import { ToastService } from '../../core/services/toast.service';

interface HighlightItem {
  bookId: string;
  bookTitle: string;
  highlight: Highlight;
}

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.css'
})
export class NotesComponent {
  protected readonly bookService = inject(BookService);
  protected readonly toastService = inject(ToastService);

  // Filter signals
  protected readonly searchQuery = signal<string>('');
  protected readonly selectedColor = signal<'all' | 'yellow' | 'teal' | 'rose'>('all');
  protected readonly selectedBookId = signal<string>('all');

  // Inline editing signals
  protected readonly editingHighlightId = signal<string | null>(null);
  protected readonly editingNoteText = signal<string>('');

  // Shortcut getter for book list
  protected readonly booksList = computed(() => this.bookService.books());

  // Aggregate all highlights across all books, sorted by newest first
  protected readonly allHighlights = computed(() => {
    const list: HighlightItem[] = [];
    this.bookService.books().forEach(book => {
      book.highlights.forEach(h => {
        list.push({
          bookId: book.id,
          bookTitle: book.title,
          highlight: h
        });
      });
    });
    return list.sort((a, b) => b.highlight.createdAt - a.highlight.createdAt);
  });

  // Filter highlights dynamically based on color, book, and text searches
  protected readonly filteredHighlights = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const color = this.selectedColor();
    const bookId = this.selectedBookId();

    return this.allHighlights().filter(item => {
      // 1. Book Filter
      if (bookId !== 'all' && item.bookId !== bookId) return false;

      // 2. Color Filter
      if (color !== 'all' && item.highlight.color !== color) return false;

      // 3. Search Query Filter (matches against highlighted text or note text)
      if (query) {
        const textMatch = item.highlight.text.toLowerCase().includes(query);
        const noteMatch = item.highlight.note?.toLowerCase().includes(query) || false;
        return textMatch || noteMatch;
      }

      return true;
    });
  });

  // Begin inline note editing
  protected startEditing(highlightId: string, currentNote: string): void {
    this.editingHighlightId.set(highlightId);
    this.editingNoteText.set(currentNote || '');
  }

  // Cancel inline note editing
  protected cancelEditing(): void {
    this.editingHighlightId.set(null);
    this.editingNoteText.set('');
  }

  // Save the edited note
  protected saveNote(bookId: string, highlightId: string): void {
    this.bookService.updateHighlightNote(bookId, highlightId, this.editingNoteText());
    this.editingHighlightId.set(null);
    this.editingNoteText.set('');
    this.toastService.success('Study note updated');
  }

  // Delete a highlight/note entirely
  protected deleteHighlight(bookId: string, highlightId: string): void {
    this.bookService.deleteHighlight(bookId, highlightId);
    this.toastService.success('Highlight removed');
  }

  // Export the currently filtered notes as a Markdown document
  protected exportToMarkdown(): void {
    const highlightsToExport = this.filteredHighlights();
    if (highlightsToExport.length === 0) {
      this.toastService.warning('No highlights to export');
      return;
    }

    let markdown = `# Readivo Study Notes & Highlights\n\n`;
    markdown += `Generated on ${new Date().toLocaleDateString()} • Total Highlights: ${highlightsToExport.length}\n\n`;
    markdown += `*Saved and managed inside Readivo, your distraction-free reading portal.*\n\n`;
    markdown += `---\n\n`;

    let lastBookId = '';
    highlightsToExport.forEach(item => {
      // Add section headers when transitioning to a different book
      if (item.bookId !== lastBookId) {
        markdown += `## 📚 ${item.bookTitle}\n\n`;
        lastBookId = item.bookId;
      }

      const colorTag = item.highlight.color.toUpperCase();
      const dateStr = new Date(item.highlight.createdAt).toLocaleDateString();

      // Format highlight as blockquote with metadata
      markdown += `> **[${colorTag}]** ${item.highlight.text}\n\n`;
      
      if (item.highlight.note) {
        markdown += `**Study Note:**\n${item.highlight.note}\n\n`;
      }
      
      markdown += `*Added on ${dateStr}*\n\n`;
      markdown += `---\n\n`;
    });

    try {
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileDate = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `readivo_study_notes_${fileDate}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      this.toastService.success('Notes exported as Markdown');
    } catch (e) {
      console.error('Failed to export notes', e);
      this.toastService.error('Export failed');
    }
  }
}
