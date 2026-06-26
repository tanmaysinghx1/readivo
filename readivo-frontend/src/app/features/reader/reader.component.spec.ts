import { TestBed } from '@angular/core/testing';
import { ReaderComponent } from './reader.component';
import { ActivatedRoute, provideRouter } from '@angular/router';

describe('ReaderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReaderComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => '1' // Mock book ID '1' (Meditations)
              }
            }
          }
        }
      ]
    }).compileComponents();
  });

  it('should create the reader component', () => {
    const fixture = TestBed.createComponent(ReaderComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
