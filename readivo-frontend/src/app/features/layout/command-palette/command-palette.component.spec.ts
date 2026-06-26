import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CommandPaletteComponent } from './command-palette.component';
import { BookService } from '../../../core/services/book.service';
import { ToastService } from '../../../core/services/toast.service';

describe('CommandPaletteComponent', () => {
  let component: CommandPaletteComponent;
  let fixture: ComponentFixture<CommandPaletteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandPaletteComponent],
      providers: [
        BookService,
        ToastService,
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the command palette component', () => {
    expect(component).toBeTruthy();
  });

  it('should be closed by default', () => {
    expect(component.isOpen()).toBeFalsy();
  });

  it('should toggle open/closed state on Ctrl+K keyboard shortcut', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true
    });
    window.dispatchEvent(event);
    fixture.detectChanges();
    expect(component.isOpen()).toBeTruthy();

    window.dispatchEvent(event);
    fixture.detectChanges();
    expect(component.isOpen()).toBeFalsy();
  });

  it('should filter commands based on search text', () => {
    component.isOpen.set(true);
    component['searchQuery'].set('Theme');
    fixture.detectChanges();

    const list = component['flatFilteredList']();
    // Should contain "Light Mode", "Sepia Mode", "Dark Mode" theme actions
    expect(list.length).toBeGreaterThan(0);
    const hasDarkThemeAction = list.some(item => item.label.includes('Dark Theme'));
    expect(hasDarkThemeAction).toBeTruthy();
  });
});
