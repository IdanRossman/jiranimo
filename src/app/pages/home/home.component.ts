import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { CommonModule } from '@angular/common';
import { HeroContentComponent } from './components/hero-content/hero-content.component';
import { GlobeComponent } from './components/globe/globe.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, HeroContentComponent, GlobeComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, AfterViewInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Users can visit homepage regardless of authentication status
  }

  ngAfterViewInit() {
    // Animate hero sections on load
    gsap.from('.hero-right', {
      x: 50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      delay: 0.3
    });
  }
}
