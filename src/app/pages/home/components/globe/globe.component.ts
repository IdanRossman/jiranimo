import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { gsap } from 'gsap';

@Component({
  selector: 'app-globe',
  imports: [],
  templateUrl: './globe.component.html',
  styleUrl: './globe.component.css'
})
export class GlobeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private globe!: THREE.Mesh;
  private animationId!: number;
  private resizeObserver!: ResizeObserver;
  private isDarkTheme = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkTheme();
      this.setupThemeListener();
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initThreeJS();
      this.setupResizeObserver();
      this.animate();
    }
  }

  checkTheme() {
    this.isDarkTheme = document.documentElement.classList.contains('dark-theme');
  }

  setupThemeListener() {
    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const wasDark = this.isDarkTheme;
      this.checkTheme();
      if (wasDark !== this.isDarkTheme) {
        this.updateGlobeColor();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  updateGlobeColor() {
    if (this.globe) {
      const material = this.globe.material as THREE.MeshBasicMaterial;
      const newColor = this.isDarkTheme ? 0x64b5f6 : 0x667eea;
      
      gsap.to(material.color, {
        r: ((newColor >> 16) & 255) / 255,
        g: ((newColor >> 8) & 255) / 255,
        b: (newColor & 255) / 255,
        duration: 0.5
      });
    }
  }

  initThreeJS() {
    const canvas = this.canvasRef.nativeElement;

    // Create scene
    this.scene = new THREE.Scene();

    // Create camera - positioned at an angle to look down at the globe
    this.camera = new THREE.PerspectiveCamera(
      75,
      1, // aspect ratio 1:1 for square canvas
      0.1,
      1000
    );
    this.camera.position.y = 7; // Position camera above the globe
    this.camera.position.z = 8; // Slight forward angle
    this.camera.lookAt(0, 0, 0); // Look down at the center of the globe

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
    
    const width = 1200;
    const height = 1200;
    
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Create globe - larger size
    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      wireframe: true,
      color: this.isDarkTheme ? 0x64b5f6 : 0x667eea
    });

    this.globe = new THREE.Mesh(geometry, material);

    // No initial rotation needed - we're looking down at the top
    this.globe.rotation.x = 0;
    this.globe.rotation.z = 0;

    this.scene.add(this.globe);

    // GSAP rotation animation - spinning around Y axis (viewed from above)
    gsap.to(this.globe.rotation, {
      y: "+=6.28",
      repeat: -1,
      duration: 20,
      ease: "none"
    });
  }

  animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  }

  setupResizeObserver() {
    const canvas = this.canvasRef.nativeElement;
    this.resizeObserver = new ResizeObserver(() => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });

    this.resizeObserver.observe(canvas.parentElement!);
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    // Clean up Three.js resources
    this.globe.geometry.dispose();
    (this.globe.material as THREE.Material).dispose();
    this.renderer.dispose();
  }
}
