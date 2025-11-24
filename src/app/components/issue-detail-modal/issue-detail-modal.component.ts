import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { JiraIssue } from '../../models/jira.models';
import { GlassButtonComponent } from '../glass-button/glass-button.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-issue-detail-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, GlassButtonComponent],
  templateUrl: './issue-detail-modal.component.html',
  styleUrl: './issue-detail-modal.component.css'
})
export class IssueDetailModalComponent implements OnChanges {
  @Input() issue: JiraIssue | null = null;
  @Input() showModal = false;
  @Input() cardPosition: { top: number; left: number; width: number; height: number } | null = null;
  @Output() close = new EventEmitter<void>();

  modalAnimationState: 'opening' | 'open' | 'closing' | 'closed' = 'closed';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['showModal'] && this.showModal && this.issue) {
      this.openModal();
    } else if (changes['showModal'] && !this.showModal) {
      this.closeModal();
    }
  }

  private openModal() {
    this.modalAnimationState = 'opening';
    
    // Transition to open state after animation completes
    setTimeout(() => {
      this.modalAnimationState = 'open';
    }, 500); // Match the animation duration (0.5s)
  }

  closeModal() {
    this.modalAnimationState = 'closing';

    setTimeout(() => {
      this.modalAnimationState = 'closed';
      this.close.emit();
    }, 400); // Wait for closing animation
  }

  getJiraUrl(issue: JiraIssue): string {
    return `${environment.jiraBaseUrl}/browse/${issue.key}`;
  }

  openInJira(issue: JiraIssue) {
    const url = this.getJiraUrl(issue);
    window.open(url, '_blank');
  }

  getDescriptionText(description: any): string {
    if (!description) return '';
    
    if (typeof description === 'string') return description;
    
    // Handle Atlassian Document Format (ADF)
    if (description.content && Array.isArray(description.content)) {
      return this.extractTextFromADF(description.content);
    }
    
    return '';
  }

  private extractTextFromADF(content: any[]): string {
    let text = '';
    
    for (const node of content) {
      if (node.type === 'paragraph' && node.content) {
        for (const textNode of node.content) {
          if (textNode.text) {
            text += textNode.text + ' ';
          }
        }
        text += '\n';
      } else if (node.type === 'text' && node.text) {
        text += node.text + ' ';
      }
    }
    
    return text.trim();
  }

  getStatusColor(categoryKey: string): string {
    const colorMap: { [key: string]: string } = {
      'new': '#6b7280',
      'indeterminate': '#3b82f6',
      'done': '#10b981'
    };
    return colorMap[categoryKey] || '#6b7280';
  }

  getPriorityColor(priority: string): string {
    const colorMap: { [key: string]: string } = {
      'Highest': '#dc2626',
      'High': '#f59e0b',
      'Medium': '#3b82f6',
      'Low': '#10b981',
      'Lowest': '#6b7280'
    };
    return colorMap[priority] || '#6b7280';
  }
}
