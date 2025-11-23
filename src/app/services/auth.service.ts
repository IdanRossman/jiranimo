import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface AuthUser {
  accountId: string;
  displayName: string;
  emailAddress: string;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000';
  private readonly TOKEN_KEY = 'jira_tokens';
  private readonly USER_KEY = 'jira_user';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.getStoredUser());

  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Check if user has a valid token stored
   */
  private hasValidToken(): boolean {
    const tokens = this.getStoredTokens();
    return tokens !== null && tokens.accessToken !== undefined;
  }

  /**
   * Get stored tokens from localStorage
   */
  private getStoredTokens(): AuthTokens | null {
    const tokensJson = localStorage.getItem(this.TOKEN_KEY);
    if (!tokensJson) return null;

    try {
      return JSON.parse(tokensJson);
    } catch {
      return null;
    }
  }

  /**
   * Get stored user from localStorage
   */
  private getStoredUser(): AuthUser | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  /**
   * Store tokens in localStorage
   */
  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
  }

  /**
   * Store user data in localStorage
   */
  private storeUser(user: AuthUser): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Get access token for API requests
   */
  getAccessToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.accessToken || null;
  }

  /**
   * Initiate OAuth login by redirecting to backend auth endpoint
   */
  login(): void {
    // Redirect to backend OAuth endpoint
    window.location.href = `${this.API_URL}/auth/jira`;
  }

  /**
   * Handle OAuth callback with session ID from URL
   */
  handleCallback(sessionId: string): void {
    console.log('=== AUTH SERVICE: handleCallback ===');
    console.log('Received session ID:', sessionId);

    // Store session ID as access token
    const tokens: AuthTokens = {
      accessToken: sessionId
    };
    this.storeTokens(tokens);
    console.log('Session ID stored in localStorage');

    this.isAuthenticatedSubject.next(true);
    console.log('Authentication state set to true');

    // Fetch user info after storing session
    console.log('Fetching user info from backend...');
    this.fetchUserInfo().subscribe({
      next: (user) => {
        console.log('User info fetched successfully:', user);
      },
      error: (err) => {
        console.error('Failed to fetch user info:', err);
        console.error('Error details:', err.error);
        console.error('Status code:', err.status);
        // If fetching user info fails, logout
        this.logout();
      }
    });
  }

  /**
   * Fetch current user info from Jira
   */
  private fetchUserInfo(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.API_URL}/jira/user/me`)
      .pipe(
        tap(user => this.storeUser(user)),
        catchError(this.handleError)
      );
  }

  /**
   * Refresh the current user info
   */
  refreshUserInfo(): Observable<AuthUser> {
    return this.fetchUserInfo();
  }

  /**
   * Logout user and clear stored data
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
