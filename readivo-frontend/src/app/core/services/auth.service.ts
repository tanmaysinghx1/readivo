import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface UserSession {
  token: string;
  id: number;
  username: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';
  private readonly TOKEN_KEY = 'readivo_auth_token';
  private readonly USER_KEY = 'readivo_auth_user';

  // Signals for application-wide authentication state
  public readonly currentUser = signal<UserSession | null>(null);
  public readonly isAuthenticated = signal<boolean>(false);

  constructor(private readonly http: HttpClient) {
    this.loadSession();
  }

  // Load session from localStorage on app startup
  private loadSession(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const userStr = localStorage.getItem(this.USER_KEY);

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          this.currentUser.set({
            token,
            id: user.id,
            username: user.username,
            email: user.email
          });
          this.isAuthenticated.set(true);
        } catch (e) {
          console.error('Failed to parse stored user session', e);
          this.clearSession();
        }
      }
    }
  }

  // Login a user
  public login(usernameOrEmail: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/login`, {
      username: usernameOrEmail,
      password
    }).pipe(
      tap(res => {
        if (res && res.token) {
          this.saveSession(res.token, {
            id: res.id,
            username: res.username,
            email: res.email
          });
        }
      })
    );
  }

  // Register a new user
  public register(username: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/register`, {
      username,
      email,
      password
    });
  }

  // Sign out
  public logout(): void {
    this.clearSession();
  }

  // Save session info to localStorage and update signals
  private saveSession(token: string, user: { id: number; username: string; email: string }): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    this.currentUser.set({ token, ...user });
    this.isAuthenticated.set(true);
  }

  // Clear session info from localStorage and reset signals
  private clearSession(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  // Get current auth token for interceptors
  public getToken(): string | null {
    return this.currentUser()?.token || null;
  }
}
