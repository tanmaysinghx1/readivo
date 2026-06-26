import { TestBed } from '@angular/core/testing';
import { LibraryComponent } from './library.component';
import { provideRouter } from '@angular/router';

describe('LibraryComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibraryComponent],
      providers: [
        provideRouter([])
      ]
    }).compileComponents();
  });

  it('should create the library component', () => {
    const fixture = TestBed.createComponent(LibraryComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
