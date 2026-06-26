import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService, Book } from '../../core/services/book.service';
import { ToastService } from '../../core/services/toast.service';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  protected readonly bookService = inject(BookService);
  protected readonly toastService = inject(ToastService);

  // Form input signals
  protected readonly titleInput = signal<string>('');
  protected readonly authorInput = signal<string>('');
  protected readonly categoryInput = signal<string>('Philosophy');
  protected readonly descriptionInput = signal<string>('');
  protected readonly readTimeInput = signal<string>('2h 45m');
  protected readonly ratingInput = signal<number>(4.8);

  // Cover Gradient Presets (removes hardcoded UI values)
  protected readonly gradientPresets = [
    { name: 'Amber Sunset', gradient: 'from-amber-700 via-amber-800 to-stone-900', text: 'text-amber-100' },
    { name: 'Midnight Gatsby', gradient: 'from-indigo-900 via-slate-900 to-stone-950', text: 'text-indigo-200' },
    { name: 'Cosmic Violet', gradient: 'from-purple-900 via-violet-950 to-slate-950', text: 'text-purple-200' },
    { name: 'Crimson Rose', gradient: 'from-rose-900 via-red-950 to-neutral-950', text: 'text-rose-200' },
    { name: 'Emerald Forest', gradient: 'from-teal-800 via-emerald-950 to-stone-900', text: 'text-teal-100' },
    { name: 'War Obsidian', gradient: 'from-red-800 via-amber-950 to-stone-950', text: 'text-amber-200' },
    { name: 'Charcoal Sleek', gradient: 'from-slate-800 via-slate-900 to-neutral-950', text: 'text-stone-200' },
    { name: 'Obsidian Dark', gradient: 'from-stone-850 via-stone-950 to-neutral-950', text: 'text-stone-300' }
  ];
  protected readonly selectedGradient = signal<number>(0);

  // Drag and drop / Upload signals
  protected readonly isDragging = signal<boolean>(false);
  protected readonly isUploading = signal<boolean>(false);
  protected readonly uploadProgress = signal<number>(0);
  protected readonly uploadedFilename = signal<string>( '');
  protected readonly uploadedFileUrl = signal<string>('');
  protected readonly parsedChapters = signal<any[]>([]);

  // Handle drag hover state
  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  // Handle drag exit
  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  // Handle file drops
  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.epub') || file.name.endsWith('.pdf') || file.name.endsWith('.txt')) {
        this.performRealUpload(file);
      } else {
        this.toastService.error('Invalid format. Please drop an EPUB, PDF, or TXT file.');
      }
    }
  }

  // Handle file selection from standard input trigger
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.performRealUpload(input.files[0]);
    }
  }

  // Perform real file upload to backend with progress reporting
  private performRealUpload(file: File): void {
    this.isUploading.set(true);
    this.uploadProgress.set(0);
    this.uploadedFilename.set('');
    this.uploadedFileUrl.set('');
    this.parsedChapters.set([]);

    this.bookService.uploadBookFile(file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            const percent = Math.round((100 * event.loaded) / event.total);
            this.uploadProgress.set(percent);
          }
        } else if (event.type === HttpEventType.Response) {
          this.isUploading.set(false);
          this.toastService.success('File uploaded and parsed successfully');
          
          const response = event.body;
          this.uploadedFilename.set(file.name);
          this.uploadedFileUrl.set(response.fileUrl);
          this.parsedChapters.set(response.chapters);
          
          // Auto-fill metadata form from backend parsing results
          this.titleInput.set(response.title || '');
          this.authorInput.set(response.author || 'Unknown Author');
          this.readTimeInput.set(response.readTime || '2h 15m');
          this.descriptionInput.set(`An immersive digital edition of ${response.title || file.name}, uploaded to the Readivo catalog.`);
        }
      },
      error: (err) => {
        this.isUploading.set(false);
        this.uploadProgress.set(0);
        console.error('Upload failed', err);
        const errMsg = err.error?.message || err.error || err.message || 'Unknown error';
        this.toastService.error(`Upload failed: ${errMsg}`);
      }
    });
  }

  // Add the newly constructed book to the system catalog
  protected publishBook(): void {
    if (!this.titleInput() || !this.authorInput()) {
      this.toastService.warning('Title and Author are required fields');
      return;
    }

    const customId = 'custom_' + Math.random().toString(36).substring(2, 11);
    
    // Use parsed chapters if available, otherwise fall back to mock introductory content
    let chapters = this.parsedChapters();
    if (!chapters || chapters.length === 0) {
      chapters = [
        {
          title: 'Chapter I: Introduction',
          paragraphs: [
            `This is a digital rendering of the newly uploaded masterpiece "${this.titleInput()}" by ${this.authorInput()}.`,
            `Welcome to your distraction-free reading canvas. All of Readivo's tools—such as text highlighting, personal notes attachment, theme adjustments, and scroll progress synchronization—are fully enabled for this book.`,
            `Begin reading to discover or review this classic work.`
          ]
        }
      ];
    }

    const activeGradient = this.gradientPresets[this.selectedGradient()];

    this.bookService.addCustomBook({
      id: customId,
      title: this.titleInput(),
      author: this.authorInput(),
      category: this.categoryInput(),
      description: this.descriptionInput(),
      rating: this.ratingInput(),
      readTime: this.readTimeInput() || '2h 15m',
      coverGradient: activeGradient.gradient,
      coverTextColor: activeGradient.text,
      fileUrl: this.uploadedFileUrl() || undefined,
      chapters
    }, () => {
      this.toastService.success(`Published "${this.titleInput()}" to the Browse Catalog`);
      this.resetForm();
    });
  }

  // Clear form and file records
  protected resetForm(): void {
    this.titleInput.set('');
    this.authorInput.set('');
    this.categoryInput.set('Philosophy');
    this.descriptionInput.set('');
    this.readTimeInput.set('2h 45m');
    this.ratingInput.set(4.8);
    this.selectedGradient.set(0);
    this.uploadedFilename.set('');
    this.uploadedFileUrl.set('');
    this.parsedChapters.set([]);
  }
}
