import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotesComponent } from './notes.component';
import { BookService } from '../../core/services/book.service';
import { ToastService } from '../../core/services/toast.service';

describe('NotesComponent', () => {
  let component: NotesComponent;
  let fixture: ComponentFixture<NotesComponent>;
  let bookService: BookService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotesComponent],
      providers: [
        BookService,
        ToastService,
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotesComponent);
    component = fixture.componentInstance;
    bookService = TestBed.inject(BookService);
    fixture.detectChanges();
  });

  it('should create the notes component', () => {
    expect(component).toBeTruthy();
  });

  it('should aggregate highlights across all books', () => {
    // Default books in BookService have at least one mock highlight for Meditations (id '1')
    const highlights = component['allHighlights']();
    expect(highlights.length).toBeGreaterThan(0);
    expect(highlights[0].bookTitle).toBe('Meditations');
  });

  it('should filter highlights based on search query', () => {
    // The default highlight in BookService is 'tranquility' for Meditations
    component['searchQuery'].set('tranquility');
    fixture.detectChanges();

    const filtered = component['filteredHighlights']();
    expect(filtered.length).toBe(1);
    expect(filtered[0].highlight.text).toContain('tranquility');

    // Set search query that won't match anything
    component['searchQuery'].set('nonexistent_word_for_testing');
    fixture.detectChanges();

    const filteredEmpty = component['filteredHighlights']();
    expect(filteredEmpty.length).toBe(0);
  });
});
