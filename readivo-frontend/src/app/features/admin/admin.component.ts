import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService, Book } from '../../core/services/book.service';
import { ToastService } from '../../core/services/toast.service';

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

  // Drag and drop / Upload simulation signals
  protected readonly isDragging = signal<boolean>(false);
  protected readonly isUploading = signal<boolean>(false);
  protected readonly uploadProgress = signal<number>(0);
  protected readonly uploadedFilename = signal<string>('');

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
        this.simulateUpload(file.name);
      } else {
        this.toastService.error('Invalid format. Please drop an EPUB, PDF, or TXT file.');
      }
    }
  }

  // Handle file selection from standard input trigger
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.simulateUpload(input.files[0].name);
    }
  }

  // Simulate progress bar increments and auto-populate metadata
  private simulateUpload(fileName: string): void {
    this.isUploading.set(true);
    this.uploadProgress.set(0);
    this.uploadedFilename.set('');

    const interval = setInterval(() => {
      const nextProgress = this.uploadProgress() + 15;
      if (nextProgress >= 100) {
        clearInterval(interval);
        this.uploadProgress.set(100);
        
        setTimeout(() => {
          this.isUploading.set(false);
          this.uploadedFilename.set(fileName);
          this.toastService.success('File uploaded successfully');
          this.parseFileName(fileName);
        }, 350);

      } else {
        this.uploadProgress.set(nextProgress);
      }
    }, 120);
  }

  // Parse filename structures like "Author - Title.epub" or "Title.pdf"
  private parseFileName(fileName: string): void {
    // Strip file extension
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    
    // Check if there is a hyphen separator
    if (baseName.includes('-')) {
      const parts = baseName.split('-');
      const author = parts[0].trim();
      const title = parts[1].trim();
      
      this.authorInput.set(author);
      this.titleInput.set(title);
    } else {
      this.titleInput.set(baseName);
      this.authorInput.set('Unknown Author');
    }

    this.descriptionInput.set(`An immersive digital edition of ${this.titleInput()}, uploaded to the Readivo catalog.`);
  }

  // Add the newly constructed book to the system catalog
  protected publishBook(): void {
    if (!this.titleInput() || !this.authorInput()) {
      this.toastService.warning('Title and Author are required fields');
      return;
    }

    const customId = 'custom_' + Math.random().toString(36).substring(2, 11);
    
    // Build a mock chapter content structure
    const chapters = [
      {
        title: 'Chapter I: Introduction',
        paragraphs: [
          `This is a digital rendering of the newly uploaded masterpiece "${this.titleInput()}" by ${this.authorInput()}.`,
          `Welcome to your distraction-free reading canvas. All of Readivo's tools—such as text highlighting, personal notes attachment, theme adjustments, and scroll progress synchronization—are fully enabled for this book.`,
          `Begin reading to discover or review this classic work.`
        ]
      }
    ];

    // Pick a random cover gradient for variety
    const gradients = [
      'from-slate-800 via-slate-900 to-neutral-950',
      'from-stone-850 via-stone-950 to-neutral-950',
      'from-zinc-900 via-neutral-900 to-stone-950'
    ];
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

    this.bookService.addCustomBook({
      id: customId,
      title: this.titleInput(),
      author: this.authorInput(),
      category: this.categoryInput(),
      description: this.descriptionInput(),
      rating: 4.7,
      readTime: this.readTimeInput() || '2h 15m',
      coverGradient: randomGradient,
      coverTextColor: 'text-stone-200',
      chapters
    });

    this.toastService.success(`Published "${this.titleInput()}" to the Browse Catalog`);
    this.resetForm();
  }

  // Clear form and file records
  protected resetForm(): void {
    this.titleInput.set('');
    this.authorInput.set('');
    this.categoryInput.set('Philosophy');
    this.descriptionInput.set('');
    this.readTimeInput.set('2h 45m');
    this.uploadedFilename.set('');
  }
}
