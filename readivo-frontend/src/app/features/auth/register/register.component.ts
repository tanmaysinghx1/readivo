import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  protected readonly name = signal<string>('');
  protected readonly email = signal<string>('');
  protected readonly password = signal<any>('');
  protected readonly confirmPassword = signal<string>('');
  protected readonly agreeTerms = signal<boolean>(false);
  protected readonly showPassword = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isLoading = signal<boolean>(false);

  protected readonly passwordVal = signal<string>('');

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly toastService: ToastService
  ) {}

  protected togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.errorMessage.set(null);

    const nameVal = this.name().trim();
    const emailVal = this.email().trim();
    
    let passVal = '';
    const rawPass = this.password();
    if (typeof rawPass === 'function') {
      passVal = (rawPass as any)().trim();
    } else if (typeof rawPass === 'string') {
      passVal = rawPass.trim();
    } else {
      passVal = this.passwordVal().trim();
    }

    const confirmVal = this.confirmPassword().trim();

    if (!nameVal || !emailVal || !passVal || !confirmVal) {
      this.errorMessage.set('Please fill out all fields.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailVal)) {
      this.errorMessage.set('Please enter a valid email address.');
      return;
    }

    if (passVal.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    if (passVal !== confirmVal) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    if (!this.agreeTerms()) {
      this.errorMessage.set('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    this.isLoading.set(true);

    this.authService.register(nameVal, emailVal, passVal).subscribe({
      next: () => {
        this.authService.login(nameVal, passVal).subscribe({
          next: (loginRes: any) => {
            this.isLoading.set(false);
            this.toastService.success(`Account created! Welcome, ${loginRes.username}!`);
            this.router.navigate(['/library']).catch((err) => {
              console.error('Navigation failed', err);
            });
          },
          error: () => {
            this.isLoading.set(false);
            this.toastService.success('Registration successful! Please sign in.');
            this.router.navigate(['/login']).catch((err) => {
              console.error('Navigation failed', err);
            });
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Registration error', err);
        const errorMsg = err.error?.message || 'Registration failed. Please try again.';
        this.errorMessage.set(errorMsg);
        this.toastService.error(errorMsg);
      }
    });
  }
}
