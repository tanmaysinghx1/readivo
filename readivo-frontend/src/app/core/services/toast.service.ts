import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  // Read-only signal containing the list of active notifications
  public readonly toasts = signal<Toast[]>([]);

  // Generic method to display a toast notification
  public show(message: string, type: Toast['type'] = 'info'): void {
    const id = 'toast_' + Math.random().toString(36).substring(2, 11);
    const newToast: Toast = { id, message, type };
    
    this.toasts.set([...this.toasts(), newToast]);

    // Automatically trigger dismissal after 3.2 seconds
    setTimeout(() => {
      this.dismiss(id);
    }, 3200);
  }

  // Helper method for success notifications
  public success(message: string): void {
    this.show(message, 'success');
  }

  // Helper method for error notifications
  public error(message: string): void {
    this.show(message, 'error');
  }

  // Helper method for informational notifications
  public info(message: string): void {
    this.show(message, 'info');
  }

  // Helper method for warning notifications
  public warning(message: string): void {
    this.show(message, 'warning');
  }

  // Dismiss a specific toast notification by ID
  public dismiss(id: string): void {
    this.toasts.set(this.toasts().filter(t => t.id !== id));
  }
}
