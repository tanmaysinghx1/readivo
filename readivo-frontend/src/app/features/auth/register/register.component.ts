import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  protected readonly password = signal<string>('');
  protected readonly confirmPassword = signal<string>('');
  protected readonly agreeTerms = signal<boolean>(false);
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

    const nameVal = this.name().trim();
    const emailVal = this.email().trim();
    const passwordVal = this.password().trim();
    const confirmVal = this.confirmPassword().trim();

    if (!nameVal || !emailVal || !passwordVal || !confirmVal) {
      this.errorMessage.set('Please fill out all fields.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailVal)) {
      this.errorMessage.set('Please enter a valid email address.');
      return;
    }

    if (passwordVal.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    if (passwordVal !== confirmVal) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    if (!this.agreeTerms()) {
      this.errorMessage.set('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    this.isLoading.set(true);

    // Simulate backend registration delay
    setTimeout(() => {
      this.isLoading.set(false);
      this.router.navigate(['/library']).catch((err) => {
        console.error('Navigation failed', err);
        this.errorMessage.set('Navigation failed. Please try again.');
      });
    }, 1200);
  }
}
