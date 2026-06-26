import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BrowseComponent } from './browse.component';
import { BookService } from '../../core/services/book.service';
import { ToastService } from '../../core/services/toast.service';

describe('BrowseComponent', () => {
  let component: BrowseComponent;
  let fixture: ComponentFixture<BrowseComponent>;
  let bookService: BookService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowseComponent],
      providers: [
        BookService,
        ToastService,
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BrowseComponent);
    component = fixture.componentInstance;
    bookService = TestBed.inject(BookService);
    fixture.detectChanges();
  });

  it('should create the browse component', () => {
    expect(component).toBeTruthy();
  });

  it('should only show books that are not on the user shelf', () => {
    // Books 1, 2, and 6 default to inShelf = true; books 3, 4, 5 default to false
    const available = component['availableBooks']();
    expect(available.length).toBeGreaterThan(0);
    expect(available.every(b => !b.inShelf)).toBeTruthy();
  });

  it('should move a book to the shelf when addToLibrary is called', () => {
    const unshelvedBook = component['availableBooks']()[0];
    const initialLength = component['availableBooks']().length;
    
    component['addToLibrary'](unshelvedBook.id, unshelvedBook.title);
    fixture.detectChanges();

    // The book should now be flagged as inShelf and therefore filtered out of the browse view
    const newAvailable = component['availableBooks']();
    expect(newAvailable.length).toBe(initialLength - 1);
    expect(newAvailable.find(b => b.id === unshelvedBook.id)).toBeUndefined();
  });
});
