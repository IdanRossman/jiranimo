import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  imports: [CommonModule],
  templateUrl: './auth-callback.component.html',
  styleUrl: './auth-callback.component.css'
})
export class AuthCallbackComponent implements OnInit {
  loading = true;
  error: string | null = null;
  errorTitle = 'Authentication Failed';
  isSessionExpired = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('=== AUTH CALLBACK COMPONENT INITIALIZED ===');

    // Get the session ID from the URL query params
    this.route.queryParams.subscribe(params => {
      console.log('All URL params:', params);
      console.log('Full URL:', window.location.href);

      const error = params['error'];
      const errorDescription = params['error_description'];

      if (error) {
        console.error('OAuth error received:', error);
        this.handleAuthError(error, errorDescription);
        return;
      }

      // Try multiple parameter names for session ID
      const sessionId = params['session_id'] || params['sessionId'] || params['token'];
      console.log('Extracted session ID:', sessionId ? 'Found' : 'NOT FOUND');
      console.log('Session ID value:', sessionId);

      if (!sessionId) {
        this.error = 'No session ID received from authentication. Please try logging in again.';
        this.errorTitle = 'Authentication Failed';
        this.loading = false;
        console.error('Available params:', Object.keys(params));
        console.error('Full params object:', params);
        return;
      }

      console.log('Storing session ID and fetching user info...');
      // Store session and fetch user info
      this.authService.handleCallback(sessionId);

      // Small delay to allow user info fetch to start
      setTimeout(() => {
        console.log('Redirecting to dashboard...');
        this.router.navigate(['/dashboard']);
      }, 500);
    });
  }

  private handleAuthError(error: string, description?: string): void {
    this.loading = false;
    
    // Check for session expiry or common errors
    if (error === 'session_expired' || error === 'token_expired' || description?.includes('expired')) {
      this.isSessionExpired = true;
      this.errorTitle = 'Session Expired';
      this.error = 'Your authentication session has expired. Please log in again.';
    } else if (error === 'access_denied') {
      this.errorTitle = 'Access Denied';
      this.error = 'You denied access to the application. Please try again if this was a mistake.';
    } else if (error === 'invalid_grant') {
      this.errorTitle = 'Invalid Grant';
      this.error = 'The authorization grant is invalid or expired. Please try logging in again.';
      this.isSessionExpired = true;
    } else {
      this.errorTitle = 'Authentication Failed';
      this.error = description || `Authentication failed: ${error}`;
    }
  }

  retryLogin(): void {
    console.log('Retrying login...');
    this.authService.login();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
