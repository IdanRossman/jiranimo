import { Component, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { gsap } from 'gsap';

@Component({
  selector: 'app-ai-chat-sidebar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './ai-chat-sidebar.component.html',
  styleUrl: './ai-chat-sidebar.component.css'
})
export class AiChatSidebarComponent implements AfterViewInit, OnDestroy {
  @Output() collapsedChange = new EventEmitter<boolean>();

  @ViewChild('sidebar') sidebarElement!: ElementRef;
  @ViewChild('sidebarContent') sidebarContentElement!: ElementRef;
  @ViewChild('sidebarHeader') sidebarHeaderElement!: ElementRef;
  @ViewChild('chatContent') chatContentElement!: ElementRef;
  @ViewChild('collapsedStrip') collapsedStripElement!: ElementRef;
  @ViewChild('toggleBtn') toggleBtnElement!: ElementRef;

  isCollapsed = true;
  private isAnimating = false;

  ngAfterViewInit() {
    // Initialize in collapsed state - set initial positions without animation
    if (this.sidebarElement && this.collapsedStripElement) {
      gsap.set(this.sidebarElement.nativeElement, {
        width: 50
      });
      gsap.set(this.collapsedStripElement.nativeElement, {
        opacity: 1,
        x: 0
      });
      gsap.set(this.sidebarContentElement.nativeElement, {
        opacity: 0
      });
      gsap.set([this.sidebarHeaderElement.nativeElement, this.chatContentElement.nativeElement], {
        x: 30,
        opacity: 0
      });
    }
  }

  toggleSidebar() {
    if (this.isAnimating) return;

    this.isAnimating = true;

    if (this.isCollapsed) {
      this.expand();
    } else {
      this.collapse();
    }
  }

  private expand() {
    const timeline = gsap.timeline({
      onStart: () => {
        this.isCollapsed = false;
        this.collapsedChange.emit(false);
      },
      onComplete: () => {
        this.isAnimating = false;
      }
    });

    // Reset header and content position explicitly
    gsap.set([this.sidebarHeaderElement.nativeElement, this.chatContentElement.nativeElement], {
      x: 30,
      opacity: 0
    });

    timeline
      // Fade out collapsed strip
      .to(this.collapsedStripElement.nativeElement, {
        opacity: 0,
        x: 20,
        duration: 0.2,
        ease: 'power2.in'
      }, 0)
      // Expand sidebar width
      .to(this.sidebarElement.nativeElement, {
        width: 380,
        duration: 0.5,
        ease: 'power3.out'
      }, 0.1)
      // Toggle button rotates
      .to(this.toggleBtnElement.nativeElement.querySelector('.toggle-icon'), {
        rotation: 180,
        duration: 0.4,
        ease: 'back.out(1.7)'
      }, 0.1)
      // Fade in content
      .to(this.sidebarContentElement.nativeElement, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out'
      }, 0.3)
      // Animate in header and content
      .to(this.sidebarHeaderElement.nativeElement, {
        x: 0,
        opacity: 1,
        duration: 0.4,
        ease: 'power3.out'
      }, 0.35)
      .to(this.chatContentElement.nativeElement, {
        x: 0,
        opacity: 1,
        duration: 0.4,
        ease: 'power3.out'
      }, 0.4);
  }

  private collapse() {
    const timeline = gsap.timeline({
      onComplete: () => {
        this.isCollapsed = true;
        this.collapsedChange.emit(true);
        this.isAnimating = false;
      }
    });

    timeline
      // Fade out content
      .to([this.sidebarHeaderElement.nativeElement, this.chatContentElement.nativeElement], {
        x: 30,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        stagger: 0.05
      }, 0)
      .to(this.sidebarContentElement.nativeElement, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in'
      }, 0.1)
      // Collapse sidebar width
      .to(this.sidebarElement.nativeElement, {
        width: 50,
        duration: 0.5,
        ease: 'power3.in'
      }, 0.2)
      // Toggle button rotates back
      .to(this.toggleBtnElement.nativeElement.querySelector('.toggle-icon'), {
        rotation: 0,
        duration: 0.4,
        ease: 'back.out(1.7)'
      }, 0.2)
      // Fade in collapsed strip
      .to(this.collapsedStripElement.nativeElement, {
        opacity: 1,
        x: 0,
        duration: 0.3,
        ease: 'power2.out'
      }, 0.5);
  }

  ngOnDestroy() {
    // Clean up any ongoing animations
    gsap.killTweensOf([
      this.sidebarElement?.nativeElement,
      this.sidebarContentElement?.nativeElement,
      this.sidebarHeaderElement?.nativeElement,
      this.chatContentElement?.nativeElement,
      this.collapsedStripElement?.nativeElement
    ]);
  }
}
