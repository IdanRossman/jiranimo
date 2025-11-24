import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { GlassButtonComponent } from '../../../../components/glass-button/glass-button.component';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-hero-content',
  imports: [CommonModule, GlassButtonComponent],
  templateUrl: './hero-content.component.html',
  styleUrl: './hero-content.component.css'
})
export class HeroContentComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('heroTitle', { static: false }) heroTitle!: ElementRef;

  isAuthenticated = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // Subscribe to auth state changes
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });
  }
  // Features to rotate through
  features = [
    {
      title: 'Unified Backlog Hub',
      description: 'Centralize and manage all your project backlogs in one powerful dashboard'
    },
    {
      title: 'Smart Sprint Planning',
      description: 'Plan and organize sprints with intelligent workload distribution and insights'
    },
    {
      title: 'Subtask Management',
      description: 'Break down complex tasks into manageable subtasks with seamless tracking'
    },
    {
      title: 'Team Collaboration',
      description: 'Collaborate effectively with real-time updates and team visibility'
    },
    {
      title: 'Advanced Analytics',
      description: 'Gain actionable insights with comprehensive reporting and metrics'
    }
  ];

  currentFeatureIndex = 0;
  currentFeature = this.features[0].title;
  currentFeatureDescription = this.features[0].description;
  
  private intervalId: any;

  ngOnInit() {
    // Rotate features every 4 seconds
    this.intervalId = setInterval(() => {
      this.rotateFeature();
    }, 4000);
  }

  ngAfterViewInit() {
    // Split text animation for title
    this.splitTextAnimation();

    // Animate feature showcase entrance
    gsap.from('.feature-showcase', {
      x: -50,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.6,
      onComplete: () => {
        // Initialize feature text and description animations
        this.splitFeatureText();
        this.splitDescriptionText();
      }
    });

    gsap.from('.cta-buttons', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.8
    });
  }

  splitTextAnimation() {
    const titleElement = this.heroTitle.nativeElement;
    const text = titleElement.textContent || '';
    titleElement.innerHTML = '';

    // Split text into characters
    const chars = text.split('');
    const charElements: HTMLElement[] = [];

    chars.forEach((char: string) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.className = 'char';
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      
      // Preserve spaces
      if (char === ' ') {
        span.style.width = '0.3em';
      }
      
      titleElement.appendChild(span);
      charElements.push(span);
    });

    // Animate characters in sequence
    gsap.to(charElements, {
      opacity: 1,
      y: 0,
      duration: 0.05,
      stagger: 0.03,
      ease: 'power2.out',
      onStart: () => {
        charElements.forEach(char => {
          char.style.transform = 'translateY(20px)';
        });
      }
    });
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  rotateFeature() {
    // Animate out
    const timeline = gsap.timeline();

    // Split and animate out current feature text
    const featureTextEl = document.querySelector('.feature-text') as HTMLElement;
    const featureTextContent = document.querySelector('.feature-text-content') as HTMLElement;

    if (featureTextContent) {
      const chars = featureTextContent.querySelectorAll('.char');
      if (chars.length > 0) {
        timeline.to(chars, {
          opacity: 0,
          y: -15,
          duration: 0.05,
          stagger: 0.015,
          ease: 'power2.in'
        });
      } else {
        timeline.to('.feature-text-content', {
          y: -20,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in'
        });
      }
    }
    
    // Animate out description words
    const descriptionEl = document.querySelector('.feature-description') as HTMLElement;
    if (descriptionEl) {
      const descWords = descriptionEl.querySelectorAll('.desc-word');
      if (descWords.length > 0) {
        timeline.to(descWords, {
          opacity: 0,
          y: -10,
          duration: 0.15,
          stagger: 0.02,
          ease: 'power2.in'
        }, '-=0.1');
      } else {
        timeline.to('.feature-description', {
          y: -20,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in'
        }, '-=0.1');
      }
    }

    // Update content
    timeline.call(() => {
      this.currentFeatureIndex = (this.currentFeatureIndex + 1) % this.features.length;
      this.currentFeature = this.features[this.currentFeatureIndex].title;
      this.currentFeatureDescription = this.features[this.currentFeatureIndex].description;

      // Split feature text and description into words after update
      setTimeout(() => {
        this.splitFeatureText();
        this.splitDescriptionText();
      }, 50);
    });
  }

  splitFeatureText() {
    const featureTextEl = document.querySelector('.feature-text-content') as HTMLElement;
    if (!featureTextEl || !this.currentFeature) return;

    const text = this.currentFeature;
    featureTextEl.innerHTML = '';

    // Ensure parent is visible
    featureTextEl.style.opacity = '1';

    // Split text into characters
    const chars = text.split('');
    const charElements: HTMLElement[] = [];

    chars.forEach((char: string) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.className = 'char';
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = 'translateY(20px)';

      // Preserve spaces
      if (char === ' ') {
        span.style.width = '0.3em';
      }

      featureTextEl.appendChild(span);
      charElements.push(span);
    });

    // Animate characters in with stagger
    gsap.to(charElements, {
      opacity: 1,
      y: 0,
      duration: 0.05,
      stagger: 0.025,
      ease: 'power2.out'
    });
  }

  splitDescriptionText() {
    const descriptionEl = document.querySelector('.feature-description') as HTMLElement;
    if (!descriptionEl || !this.currentFeatureDescription) return;

    const text = this.currentFeatureDescription;
    descriptionEl.innerHTML = '';

    // Ensure parent is visible
    descriptionEl.style.opacity = '1';

    // Split text into words
    const words = text.split(' ');
    const wordElements: HTMLElement[] = [];

    words.forEach((word: string, index: number) => {
      const span = document.createElement('span');
      span.textContent = word;
      span.className = 'desc-word';
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = 'translateY(10px)';

      descriptionEl.appendChild(span);
      wordElements.push(span);

      // Add space after each word except the last
      if (index < words.length - 1) {
        descriptionEl.appendChild(document.createTextNode(' '));
      }
    });

    // Animate words in with stagger
    gsap.to(wordElements, {
      opacity: 1,
      y: 0,
      duration: 0.3,
      stagger: 0.04,
      ease: 'power2.out',
      delay: 0.2
    });
  }

  goToDashboard() {
    // Check if user is authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    } else {
      // Initiate OAuth login
      this.authService.login();
    }
  }

  learnMore() {
    // TODO: Navigate to learn more page or show modal
  }
}
