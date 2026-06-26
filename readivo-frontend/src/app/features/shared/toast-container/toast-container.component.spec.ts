import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from '../../../core/services/toast.service';

describe('ToastContainerComponent', () => {
  let component: ToastContainerComponent;
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
      providers: [ToastService]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should create the toast container component', () => {
    expect(component).toBeTruthy();
  });

  it('should display toasts when triggered from the ToastService', () => {
    toastService.success('Test Success Toast Message');
    fixture.detectChanges();
    
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Test Success Toast Message');
  });
});
