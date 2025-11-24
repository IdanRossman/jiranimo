import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { IssueRequiringAttention } from '../../models/jira.models';
import { environment } from '../../../environments/environment';
import { gsap } from 'gsap';

@Component({
  selector: 'app-issues-sidebar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './issues-sidebar.component.html',
  styleUrl: './issues-sidebar.component.css'
})
export class IssuesSidebarComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() issuesRequiringAttention: IssueRequiringAttention[] = [];
  @Output() collapsedChange = new EventEmitter<boolean>();

  @ViewChild('sidebar') sidebarElement!: ElementRef;
  @ViewChild('sidebarContent') sidebarContentElement!: ElementRef;
  @ViewChild('sidebarHeader') sidebarHeaderElement!: ElementRef;
  @ViewChild('issuesList') issuesListElement!: ElementRef;
  @ViewChild('collapsedStrip') collapsedStripElement!: ElementRef;
  @ViewChild('toggleBtn') toggleBtnElement!: ElementRef;

  isCollapsed = true;
  shouldPulse = false;
  private isAnimating = false;
  private hasInitialized = false;

  ngOnChanges(changes: SimpleChanges) {
    // When issues first load, auto-expand if there are issues
    if (changes['issuesRequiringAttention'] && this.hasInitialized) {
      const currentIssues = changes['issuesRequiringAttention'].currentValue;
      const previousIssues = changes['issuesRequiringAttention'].previousValue;
      
      // Auto-expand when issues first arrive
      if ((!previousIssues || previousIssues.length === 0) && 
          currentIssues && 
          currentIssues.length > 0 && 
          this.isCollapsed) {
        setTimeout(() => {
          this.expand();
        }, 150);
      }
    }
  }

  ngAfterViewInit() {
    // Initialize in collapsed state - set initial positions without animation
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
    gsap.set([this.sidebarHeaderElement.nativeElement, this.issuesListElement.nativeElement], {
      x: -30,
      opacity: 0
    });
    
    this.hasInitialized = true;
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
        this.shouldPulse = true;
        this.collapsedChange.emit(false);
        // Reset pulse after animation completes (4 iterations of 0.8s)
        setTimeout(() => {
          this.shouldPulse = false;
        }, 3200);
      },
      onComplete: () => {
        this.isAnimating = false;
      }
    });

    // Reset header and list position explicitly
    gsap.set([this.sidebarHeaderElement.nativeElement, this.issuesListElement.nativeElement], {
      x: -30,
      opacity: 0
    });

    timeline
      // Fade out collapsed strip
      .to(this.collapsedStripElement.nativeElement, {
        opacity: 0,
        x: -20,
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
      // Animate in header and list
      .to(this.sidebarHeaderElement.nativeElement, {
        x: 0,
        opacity: 1,
        duration: 0.4,
        ease: 'power3.out'
      }, 0.35)
      .to(this.issuesListElement.nativeElement, {
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
      .to([this.sidebarHeaderElement.nativeElement, this.issuesListElement.nativeElement], {
        x: -30,
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

  getAttentionCount(): number {
    return this.issuesRequiringAttention.reduce((total, issue) =>
      total + issue.issues.length, 0
    );
  }

  openIssue(issueKey: string, event: Event) {
    event.stopPropagation();
    const jiraUrl = `${environment.jiraBaseUrl}/browse/${issueKey}`;
    window.open(jiraUrl, '_blank');
  }

  ngOnDestroy() {
    // Clean up any ongoing animations
    gsap.killTweensOf([
      this.sidebarElement?.nativeElement,
      this.sidebarContentElement?.nativeElement,
      this.sidebarHeaderElement?.nativeElement,
      this.issuesListElement?.nativeElement,
      this.collapsedStripElement?.nativeElement
    ]);
  }
}
