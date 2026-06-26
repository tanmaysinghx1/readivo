import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.css'
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);

  // Return border styles matching the toast context
  protected getToastBorderClass(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return 'border-emerald-500/20 shadow-emerald-950/10';
      case 'error':
        return 'border-rose-500/20 shadow-rose-950/10';
      case 'warning':
        return 'border-amber-500/20 shadow-amber-950/10';
      case 'info':
        return 'border-indigo-500/20 shadow-indigo-950/10';
      default:
        return 'border-stone-800 shadow-black/25';
    }
  }

  // Return SVG icon accent colors
  protected getToastIconColorClass(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return 'text-emerald-400';
      case 'error':
        return 'text-rose-400';
      case 'warning':
        return 'text-amber-400';
      case 'info':
        return 'text-indigo-400';
      default:
        return 'text-stone-400';
    }
  }

  // Track function for list efficiency
  protected trackByFn(index: number, item: Toast): string {
    return item.id;
  }
}
