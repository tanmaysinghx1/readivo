import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

  constructor(private readonly router: Router) {}

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

    // Basic email pattern validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailVal)) {
      this.errorMessage.set('Please enter a valid email address.');
      return;
    }

    if (passwordVal.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    this.isLoading.set(true);

    // Simulate backend JWT authentication delay
    setTimeout(() => {
      this.isLoading.set(false);
      // In a real application, we would store the JWT token and update the auth state
      this.router.navigate(['/library']).catch((err) => {
        console.error('Navigation failed', err);
        this.errorMessage.set('Navigation failed. Please try again.');
      });
    }, 1200);
  }
}
