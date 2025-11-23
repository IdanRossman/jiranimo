import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getAccessToken();

  console.log('=== HTTP INTERCEPTOR ===');
  console.log('Request URL:', req.url);
  console.log('Has token:', !!token);

  // Only add x-session-id header if we have a token
  // and the request is going to our API
  if (token && req.url.includes('localhost:3000')) {
    console.log('Adding x-session-id header');
    const clonedRequest = req.clone({
      setHeaders: {
        'x-session-id': token
      }
    });
    
    return next(clonedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle session expiry or unauthorized errors
        if (error.status === 401 || error.status === 403) {
          console.error('Session expired or unauthorized. Logging out...');
          authService.logout();
          router.navigate(['/'], { 
            queryParams: { 
              error: 'session_expired',
              message: 'Your session has expired. Please log in again.'
            } 
          });
        }
        return throwError(() => error);
      })
    );
  }

  console.log('No token or not API request, passing through');
  return next(req);
};
