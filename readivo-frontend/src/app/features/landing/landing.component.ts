import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookService } from '../../core/services/book.service';

interface Feature {
  title: string;
  description: string;
  iconSvgPath: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  private readonly bookService = inject(BookService);
  protected readonly books = this.bookService.books;

  // Zen Reader Interactive Demo State
  protected readonly readerTheme = signal<'light' | 'sepia' | 'dark'>('sepia');
  protected readonly readerFontSize = signal<number>(115); // Percentage
  protected readonly zenModeActive = signal<boolean>(false);
  protected readonly activeHighlights = signal<Set<string>>(new Set(['h1'])); // Initial pre-highlighted phrase
  protected readonly selectedHighlightText = signal<string | null>(
    '“No man is hurt but by himself.” This core Stoic concept reminds us that our internal judgment is the source of all our distress, not the external events themselves.'
  );

  // Authentication Modal State
  protected readonly isAuthModalOpen = signal<boolean>(false);
  protected readonly authModalMode = signal<'login' | 'register'>('login');
  protected readonly mockEmail = signal<string>('');
  protected readonly mockPassword = signal<string>('');
  protected readonly mockName = signal<string>('');
  protected readonly authErrorMessage = signal<string | null>(null);

  // Reader Demo Sample Text
  protected readonly demoParagraphs = [
    {
      id: 'p1',
      text: 'Remember this: that very little is needed to make a happy life. It is all within yourself, in your way of thinking. Therefore, if you are able, remove all anxiety and let your mind rest in tranquility. For the mind can shape its own sanctuary.'
    },
    {
      id: 'p2',
      text: 'Look inward. Within is the fountain of good, and it will ever bubble up, if thou wilt ever dig. '
    },
    {
      id: 'p3',
      text: 'We are habitually hurt not by the events themselves, but by our opinion and judgment of them. Remove the judgment, and the hurt vanishes. A man is only as unhappy as he has convinced himself he is.'
    }
  ];

  // Core Features
  protected readonly features = signal<Feature[]>([
    {
      title: 'Distraction-Free Zen Reader',
      description: 'Immerse yourself in clean, typography-focused reading layouts. Eliminate sidebars, headers, and distractions with a single click.',
      iconSvgPath: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25'
    },
    {
      title: 'Smart Highlights & Notes',
      description: 'Interact directly with the text. Select important phrases to highlight in custom colors and attach personal study notes instantly.',
      iconSvgPath: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125'
    },
    {
      title: 'Seamless Reading Sync',
      description: 'Your progress is automatically saved to the exact line. Switch between devices and resume your reading journey instantly.',
      iconSvgPath: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99'
    },
    {
      title: 'Customizable Themes',
      description: 'Tailor the reader to your environment. Choose between a crisp light mode, a warm sepia tone for long sessions, or a deep dark mode.',
      iconSvgPath: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z'
    }
  ]);

  // Theme changing
  protected setReaderTheme(theme: 'light' | 'sepia' | 'dark'): void {
    this.readerTheme.set(theme);
  }

  // Font size adjustment
  protected adjustFontSize(amount: number): void {
    const nextSize = this.readerFontSize() + amount;
    if (nextSize >= 85 && nextSize <= 160) {
      this.readerFontSize.set(nextSize);
    }
  }

  // Toggle zen mode
  protected toggleZenMode(): void {
    this.zenModeActive.set(!this.zenModeActive());
  }

  // Highlight action in demo
  protected toggleHighlight(id: string, text: string): void {
    const current = new Set(this.activeHighlights());
    if (current.has(id)) {
      current.delete(id);
      this.selectedHighlightText.set(null);
    } else {
      current.add(id);
      this.activeHighlights.set(current);
      
      // Provide custom note explanation for demo
      if (id === 'h1') {
        this.selectedHighlightText.set('“No man is hurt but by himself.” This core Stoic concept reminds us that internal judgment is the source of all distress.');
      } else if (id === 'h2') {
        this.selectedHighlightText.set('“Look inward.” This describes the power of self-reflection and the belief that wisdom is an active, internal search.');
      } else if (id === 'h3') {
        this.selectedHighlightText.set('“Remove the judgment, and the hurt vanishes.” By separating objective events from our emotional reactions, we achieve tranquility.');
      } else {
        this.selectedHighlightText.set('You highlighted this text! In the full version of Readivo, you can save custom notes and sync them to your cloud account.');
      }
    }
  }

  // Auth Modals
  protected openAuthModal(mode: 'login' | 'register'): void {
    this.authModalMode.set(mode);
    this.authErrorMessage.set(null);
    this.isAuthModalOpen.set(true);
  }

  protected closeAuthModal(): void {
    this.isAuthModalOpen.set(false);
    this.mockEmail.set('');
    this.mockPassword.set('');
    this.mockName.set('');
    this.authErrorMessage.set(null);
  }

  // Handle Mock Login/Signup Submission
  protected handleAuthSubmit(event: Event): void {
    event.preventDefault();
    this.authErrorMessage.set(null);

    if (this.authModalMode() === 'register' && !this.mockName().trim()) {
      this.authErrorMessage.set('Please enter your name.');
      return;
    }
    if (!this.mockEmail().trim() || !this.mockPassword().trim()) {
      this.authErrorMessage.set('Please fill out all fields.');
      return;
    }

    // Simulate successful login / sign up
    alert(`Success! You have simulated a ${this.authModalMode()} for: ${this.mockEmail()}. In the next phase, this will connect to our Spring Boot backend REST API.`);
    this.closeAuthModal();
  }
}
