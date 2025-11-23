import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { gsap } from 'gsap';
import { ThemeService } from '../../services/theme.service';
import { AuthService, AuthUser } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements AfterViewInit {
  @ViewChild('logo') logoElement!: ElementRef;
  @ViewChild('logoImg') logoImgElement!: ElementRef;
  @ViewChild('logoText') logoTextElement!: ElementRef;
  @ViewChild('menuWrapper') menuWrapperElement!: ElementRef;
  @ViewChild('navbar') navbarElement!: ElementRef;

  isCollapsed = true;
  isDarkMode = false;
  isAuthenticated = false;
  currentUser: AuthUser | null = null;
  private collapseTimer: any;
  private readonly COLLAPSE_DELAY = 2000; // 2 seconds
  private isAnimating = false;

  constructor(
    private themeService: ThemeService,
    private authService: AuthService
  ) {
    // Subscribe to theme changes
    this.themeService.isDarkMode.subscribe(isDark => {
      this.isDarkMode = isDark;
    });

    // Subscribe to auth state changes
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });

    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngAfterViewInit() {
    // Initialize in collapsed state
    if (this.logoElement && this.menuWrapperElement) {
      gsap.set(this.logoElement.nativeElement, {
        opacity: 0,
        width: 0,
        overflow: 'hidden'
      });
      gsap.set(this.menuWrapperElement.nativeElement, {
        opacity: 0,
        width: 0,
        overflow: 'hidden'
      });
      // Set initial logo image state
      gsap.set(this.logoImgElement.nativeElement, {
        scale: 0.8,
        opacity: 0,
        rotation: -180
      });
      // Set initial logo text state
      gsap.set(this.logoTextElement.nativeElement, {
        opacity: 0,
        x: -20
      });
    }
  }

  onMouseEnter() {
    // Clear any pending collapse timer
    if (this.collapseTimer) {
      clearTimeout(this.collapseTimer);
      this.collapseTimer = null;
    }

    if (!this.isCollapsed || this.isAnimating) return;

    this.isAnimating = true;
    this.isCollapsed = false;

    // Expand animations with GSAP - staggered for smooth reveal
    const timeline = gsap.timeline({
      onComplete: () => {
        this.isAnimating = false;
      }
    });

    timeline
      // First expand the width without showing content
      .to(this.logoElement.nativeElement, {
        width: 'auto',
        duration: 0.4,
        ease: 'power3.out'
      }, 0)
      // Then fade in the content after width is mostly expanded
      .to(this.logoElement.nativeElement, {
        opacity: 1,
        duration: 0.25,
        ease: 'power2.out'
      }, 0.15)
      // Logo image scales up and rotates in with bounce effect
      .to(this.logoImgElement.nativeElement, {
        scale: 1,
        opacity: 1,
        rotation: 0,
        duration: 0.6,
        ease: 'back.out(1.7)'
      }, 0.2)
      // Logo text slides in after logo finishes
      .to(this.logoTextElement.nativeElement, {
        opacity: 1,
        x: 0,
        duration: 0.4,
        ease: 'power3.out'
      }, 0.7)
      // Menu expands slightly after logo
      .to(this.menuWrapperElement.nativeElement, {
        width: 'auto',
        duration: 0.45,
        ease: 'power3.out'
      }, 0.1)
      // Menu content fades in
      .to(this.menuWrapperElement.nativeElement, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out'
      }, 0.25);
  }

  onMouseLeave() {
    // Start collapse timer
    this.collapseTimer = setTimeout(() => {
      this.collapse();
    }, this.COLLAPSE_DELAY);
  }

  private collapse() {
    if (this.isCollapsed || this.isAnimating) return;

    this.isAnimating = true;

    // Collapse animations with GSAP - fade out before collapsing width
    const timeline = gsap.timeline({
      onComplete: () => {
        this.isCollapsed = true;
        this.isAnimating = false;
        this.collapseTimer = null;
      }
    });

    timeline
      // Fade out menu content first
      .to(this.menuWrapperElement.nativeElement, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in'
      }, 0)
      // Then collapse menu width
      .to(this.menuWrapperElement.nativeElement, {
        width: 0,
        duration: 0.35,
        ease: 'power3.in'
      }, 0.1)
      // Logo text slides out first
      .to(this.logoTextElement.nativeElement, {
        opacity: 0,
        x: -20,
        duration: 0.25,
        ease: 'power2.in'
      }, 0)
      // Scale down, rotate out and fade out logo image
      .to(this.logoImgElement.nativeElement, {
        scale: 0.8,
        opacity: 0,
        rotation: -180,
        duration: 0.35,
        ease: 'back.in(1.5)'
      }, 0.1)
      // Fade out logo container
      .to(this.logoElement.nativeElement, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in'
      }, 0.15)
      // Collapse logo width
      .to(this.logoElement.nativeElement, {
        width: 0,
        duration: 0.3,
        ease: 'power3.in'
      }, 0.25);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    // Clean up timer on component destroy
    if (this.collapseTimer) {
      clearTimeout(this.collapseTimer);
    }
  }
}
