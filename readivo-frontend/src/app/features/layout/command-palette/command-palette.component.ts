import { Component, signal, computed, inject, HostListener, model, effect, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookService, Book } from '../../../core/services/book.service';
import { ToastService } from '../../../core/services/toast.service';

interface CommandAction {
  id: string;
  label: string;
  category: 'Navigation' | 'Theme' | 'Actions';
  iconSvgPath: string;
  execute: () => void;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.css'
})
export class CommandPaletteComponent {
  // Two-way signal binding for opening/closing the modal dialog
  public readonly isOpen = model<boolean>(false);

  protected readonly searchQuery = signal<string>('');
  protected readonly selectedIndex = signal<number>(0);

  @ViewChild('searchInput') private searchInputEl?: ElementRef<HTMLInputElement>;

  private readonly bookService = inject(BookService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  // List of static navigation and theme toggling actions
  private readonly staticActions: CommandAction[] = [
    {
      id: 'nav_library',
      label: 'Go to My Library',
      category: 'Navigation',
      iconSvgPath: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
      execute: () => this.navigateAndClose(['/library'])
    },
    {
      id: 'nav_notes',
      label: 'Go to Highlights & Notes',
      category: 'Navigation',
      iconSvgPath: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125',
      execute: () => this.navigateAndClose(['/notes'])
    },
    {
      id: 'nav_browse',
      label: 'Browse Catalog / Discover',
      category: 'Navigation',
      iconSvgPath: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z',
      execute: () => this.navigateAndClose(['/browse'])
    },
    {
      id: 'nav_admin',
      label: 'Go to Admin Book Manager',
      category: 'Navigation',
      iconSvgPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      execute: () => this.navigateAndClose(['/admin'])
    },
    {
      id: 'theme_light',
      label: 'Switch to Light Theme',
      category: 'Theme',
      iconSvgPath: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.773l-1.591 1.591M5.25 12H3m4.243-4.243L5.9 6.16M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z',
      execute: () => this.triggerGlobalTheme('light')
    },
    {
      id: 'theme_sepia',
      label: 'Switch to Sepia Theme',
      category: 'Theme',
      iconSvgPath: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
      execute: () => this.triggerGlobalTheme('sepia')
    },
    {
      id: 'theme_dark',
      label: 'Switch to Dark Theme',
      category: 'Theme',
      iconSvgPath: 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z',
      execute: () => this.triggerGlobalTheme('dark')
    }
  ];

  constructor() {
    // Focus search input when the modal is opened
    effect(() => {
      if (this.isOpen()) {
        this.searchQuery.set('');
        this.selectedIndex.set(0);
        setTimeout(() => {
          this.searchInputEl?.nativeElement.focus();
        }, 80);
      }
    });
  }

  // Listen to global keybind triggers
  @HostListener('window:keydown', ['$event'])
  protected handleGlobalShortcut(event: KeyboardEvent): void {
    // Ctrl+K or Cmd+K toggles the palette
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.isOpen.set(!this.isOpen());
    }

    // Handlers when palette is open
    if (this.isOpen()) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        const total = this.flatFilteredList().length;
        if (total > 0) {
          this.selectedIndex.set((this.selectedIndex() + 1) % total);
        }
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const total = this.flatFilteredList().length;
        if (total > 0) {
          this.selectedIndex.set((this.selectedIndex() - 1 + total) % total);
        }
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const list = this.flatFilteredList();
        const selected = list[this.selectedIndex()];
        if (selected) {
          selected.execute();
        }
      }
    }
  }

  // Combine matching books and matching actions into a single indexable list
  protected readonly flatFilteredList = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const result: { id: string; label: string; subtext?: string; category: string; iconSvgPath: string; execute: () => void }[] = [];

    // 1. Filter books in shelf
    const matchingBooks = this.bookService.books()
      .filter(b => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query));
    
    matchingBooks.forEach(b => {
      result.push({
        id: 'book_' + b.id,
        label: b.title,
        subtext: `Book by ${b.author} • ${b.category}`,
        category: 'Books',
        iconSvgPath: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
        execute: () => {
          this.close();
          this.router.navigate(['/reader', b.id]).catch(err => console.error(err));
        }
      });
    });

    // 2. Filter actions
    const matchingActions = this.staticActions
      .filter(a => a.label.toLowerCase().includes(query) || a.category.toLowerCase().includes(query));

    matchingActions.forEach(a => {
      result.push({
        id: a.id,
        label: a.label,
        category: a.category,
        iconSvgPath: a.iconSvgPath,
        execute: a.execute
      });
    });

    return result;
  });

  protected close(): void {
    this.isOpen.set(false);
  }

  private navigateAndClose(commands: any[]): void {
    this.close();
    this.router.navigate(commands).catch(err => console.error(err));
  }

  private triggerGlobalTheme(theme: 'light' | 'sepia' | 'dark'): void {
    if (typeof document !== 'undefined') {
      const body = document.body;
      body.classList.remove('theme-light', 'theme-sepia', 'theme-dark');
      body.classList.add(`theme-${theme}`);
      
      try {
        localStorage.setItem('readivo_global_theme', theme);
      } catch (e) {}
      
      this.toastService.info(`Global theme switched to ${theme}`);
      this.close();
    }
  }
}
