import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JiraIssue } from '../../models/jira.models';

@Component({
  selector: 'app-issue-card',
  imports: [CommonModule],
  templateUrl: './issue-card.component.html',
  styleUrl: './issue-card.component.css'
})
export class IssueCardComponent {
  @Input() issue!: JiraIssue;
  @Input() showEpic: boolean = false;
  @Output() issueClick = new EventEmitter<{ issue: JiraIssue, event: MouseEvent }>();

  onCardClick(event: MouseEvent) {
    this.issueClick.emit({ issue: this.issue, event });
  }

  getStatusColor(statusCategory: string): string {
    switch (statusCategory) {
      case 'new':
        return '#6b7280'; // gray
      case 'indeterminate':
        return '#f59e0b'; // yellow
      case 'done':
        return '#10b981'; // green
      default:
        return '#6b7280';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'highest':
        return '#dc2626';
      case 'high':
        return '#f59e0b';
      case 'medium':
        return '#3b82f6';
      case 'low':
        return '#10b981';
      case 'lowest':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  }
}
