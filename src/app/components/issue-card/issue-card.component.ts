import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { JiraIssue } from '../../models/jira.models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-issue-card',
  imports: [CommonModule, MatIconModule],
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

  getTypeIcon(typeName: string): string {
    const type = typeName.toLowerCase();
    if (type.includes('bug')) return 'bug_report';
    if (type.includes('story')) return 'book';
    if (type.includes('task')) return 'check_box';
    if (type.includes('epic')) return 'bolt';
    if (type.includes('sub-task') || type.includes('subtask')) return 'subdirectory_arrow_right';
    if (type.includes('improvement')) return 'trending_up';
    if (type.includes('feature')) return 'new_releases';
    return 'description'; // default icon
  }

  getProjectUrl(): string {
    return `${environment.jiraBaseUrl}/browse/${this.issue.project.key}`;
  }

  getEpicUrl(): string {
    return this.issue.epic ? `${environment.jiraBaseUrl}/browse/${this.issue.epic.key}` : '#';
  }

  getIssueUrl(): string {
    return `${environment.jiraBaseUrl}/browse/${this.issue.key}`;
  }

  onHierarchyClick(event: MouseEvent, type: 'project' | 'epic' | 'issue'): void {
    event.stopPropagation(); // Prevent card click event
  }
}
