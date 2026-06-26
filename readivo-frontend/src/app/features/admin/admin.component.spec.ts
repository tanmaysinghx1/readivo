import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminComponent } from './admin.component';
import { BookService } from '../../core/services/book.service';
import { ToastService } from '../../core/services/toast.service';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let bookService: BookService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        BookService,
        ToastService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    bookService = TestBed.inject(BookService);
    fixture.detectChanges();
  });

  it('should create the admin component', () => {
    expect(component).toBeTruthy();
  });

  it('should parse metadata correctly from a structured filename', () => {
    component['parseFileName']('Seneca - On the Shortness of Life.epub');
    fixture.detectChanges();

    expect(component['authorInput']()).toBe('Seneca');
    expect(component['titleInput']()).toBe('On the Shortness of Life');
    expect(component['descriptionInput']()).toContain('On the Shortness of Life');
  });

  it('should add a book to the catalog when publishBook is called', () => {
    const initialCount = bookService.books().length;
    
    component['titleInput'].set('Admin Test Book');
    component['authorInput'].set('Test Writer');
    component['categoryInput'].set('Poetry');
    fixture.detectChanges();

    component['publishBook']();
    fixture.detectChanges();

    expect(bookService.books().length).toBe(initialCount + 1);
    const addedBook = bookService.books().find(b => b.title === 'Admin Test Book');
    expect(addedBook).toBeTruthy();
    expect(addedBook?.author).toBe('Test Writer');
    expect(addedBook?.inShelf).toBeFalsy(); // Starts in catalog
  });
});
