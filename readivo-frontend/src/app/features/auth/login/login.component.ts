import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  protected readonly email = signal<string>('');
  protected readonly password = signal<string>('');
  protected readonly showPassword = signal<boolean>(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly isLoading = signal<boolean>(false);

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

    const emailVal = this.email().trim();
    const passwordVal = this.password().trim();

    if (!emailVal || !passwordVal) {
      this.errorMessage.set('Please fill out all fields.');
      return;
    }

    // Basic email or username check (allow username or email logging in)
    if (emailVal.length < 3) {
      this.errorMessage.set('Username or email must be at least 3 characters.');
      return;
    }

    if (passwordVal.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    this.isLoading.set(true);

    this.authService.login(emailVal, passwordVal).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toastService.success(`Welcome back, ${res.username || 'reader'}!`);
        this.router.navigate(['/library']).catch((err) => {
          console.error('Navigation failed', err);
          this.errorMessage.set('Navigation failed. Please try again.');
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Login error', err);
        const errorMsg = err.error?.message || 'Invalid username or password. Please try again.';
        this.errorMessage.set(errorMsg);
        this.toastService.error(errorMsg);
      }
    });
  }
}
