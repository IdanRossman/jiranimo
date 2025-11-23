import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  JiraIssue,
  JiraSearchResponse,
  GroupedIssues,
  NestedGroupedIssues,
  IssueSummary,
  JiraUser
} from '../models/jira.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JiraService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all issues assigned to the current user (excluding done items)
   */
  getMyIssues(): Observable<JiraSearchResponse> {
    console.log('🔍 Fetching issues from API:', `${this.API_URL}/issues/assigned-to-me`);

    return this.http.get<any>(`${this.API_URL}/issues/assigned-to-me`).pipe(
      map(response => this.transformApiResponse(response)),
      tap(response => {
        console.log('📦 Transformed Response:', response);
        console.log('📊 Response Type:', typeof response);
        console.log('🔑 Response Keys:', Object.keys(response));
        if (response.issues) {
          console.log('✅ Issues array length:', response.issues.length);
          console.log('📝 First issue sample:', response.issues[0]);
        }
        if (response.issuesRequiringAttention) {
          console.log('⚠️ Issues requiring attention:', response.issuesRequiringAttention.length);
        }
      })
    );
  }

  /**
   * Transform flat API response to nested model structure
   */
  private transformApiResponse(apiResponse: any): JiraSearchResponse {
    return {
      issues: (apiResponse.issues || []).map((issue: any) => this.transformIssue(issue)),
      issuesRequiringAttention: apiResponse.issuesRequiringAttention || [],
      isLast: apiResponse.isLast ?? true,
      nextPageToken: apiResponse.nextPageToken
    };
  }

  /**
   * Transform flat issue to nested structure
   */
  private transformIssue(apiIssue: any): JiraIssue {
    return {
      id: apiIssue.id,
      key: apiIssue.key,
      summary: apiIssue.summary,
      description: apiIssue.description,
      project: {
        id: apiIssue.id, // Project ID not in flat response, use issue ID as fallback
        key: this.extractProjectKey(apiIssue.key), // Extract from issue key (e.g., DP-6 -> DP)
        name: apiIssue.projectName,
        avatarUrl: undefined
      },
      type: {
        id: apiIssue.id, // Type ID not in flat response
        name: apiIssue.typeName,
        subtask: apiIssue.typeName?.toLowerCase().includes('subtask') || false,
        iconUrl: undefined
      },
      status: {
        id: apiIssue.id, // Status ID not in flat response
        name: apiIssue.statusName,
        category: this.getStatusCategory(apiIssue.statusName),
        categoryKey: this.getStatusCategoryKey(apiIssue.statusName),
        colorName: this.getStatusColor(apiIssue.statusName)
      },
      assignee: apiIssue.assigneeName ? {
        accountId: apiIssue.id, // Not in flat response
        displayName: apiIssue.assigneeName,
        emailAddress: '',
        avatarUrl: apiIssue.assigneeAvatar || '',
        active: true
      } : null,
      reporter: {
        accountId: apiIssue.id,
        displayName: apiIssue.reporterName,
        emailAddress: '',
        avatarUrl: apiIssue.reporterAvatar || '',
        active: true
      },
      priority: apiIssue.priorityName ? {
        id: apiIssue.id,
        name: apiIssue.priorityName,
        iconUrl: undefined
      } : null,
      parent: apiIssue.parentKey ? {
        id: apiIssue.id,
        key: apiIssue.parentKey,
        summary: apiIssue.parentName || ''
      } : null,
      epic: apiIssue.parentKey ? {
        id: apiIssue.id,
        key: apiIssue.parentKey,
        name: apiIssue.parentName || '',
        summary: apiIssue.parentName || '',
        done: 0,
        total: 0
      } : null,
      labels: apiIssue.labels || [],
      components: [],
      fixVersions: [],
      created: apiIssue.createdDate,
      updated: apiIssue.modifiedDate,
      dueDate: null,
      self: '',
      customFields: apiIssue.customFields || {}
    };
  }

  /**
   * Extract project key from issue key (e.g., DP-6 -> DP)
   */
  private extractProjectKey(issueKey: string): string {
    return issueKey.split('-')[0];
  }

  /**
   * Map status name to category
   */
  private getStatusCategory(statusName: string): string {
    const lower = statusName?.toLowerCase() || '';
    if (lower.includes('done') || lower.includes('closed') || lower.includes('resolved')) {
      return 'Done';
    }
    if (lower.includes('progress') || lower.includes('development') || lower.includes('review')) {
      return 'In Progress';
    }
    return 'To Do';
  }

  /**
   * Map status name to category key
   */
  private getStatusCategoryKey(statusName: string): string {
    const lower = statusName?.toLowerCase() || '';
    if (lower.includes('done') || lower.includes('closed') || lower.includes('resolved')) {
      return 'done';
    }
    if (lower.includes('progress') || lower.includes('development') || lower.includes('review')) {
      return 'indeterminate';
    }
    return 'new';
  }

  /**
   * Map status name to color
   */
  private getStatusColor(statusName: string): string {
    const lower = statusName?.toLowerCase() || '';
    if (lower.includes('done') || lower.includes('closed') || lower.includes('resolved')) {
      return 'green';
    }
    if (lower.includes('progress') || lower.includes('development') || lower.includes('review')) {
      return 'yellow';
    }
    return 'blue-gray';
  }

  /**
   * Get current user info
   */
  getCurrentUser(): Observable<JiraUser> {
    console.log('🔍 Fetching current user from API:', `${this.API_URL}/user/me`);

    return this.http.get<JiraUser>(`${this.API_URL}/user/me`).pipe(
      tap(user => {
        console.log('👤 Current User Response:', user);
        console.log('🔑 User Keys:', Object.keys(user));
      })
    );
  }

  /**
   * Get issues grouped by status
   */
  getIssuesGroupedByStatus(): Observable<GroupedIssues> {
    return this.getMyIssues().pipe(
      map(response => this.groupIssuesByStatus(response.issues))
    );
  }

  /**
   * Get issues grouped by project
   */
  getIssuesGroupedByProject(): Observable<GroupedIssues> {
    return this.getMyIssues().pipe(
      map(response => this.groupIssuesByProject(response.issues))
    );
  }

  /**
   * Get issues grouped by priority
   */
  getIssuesGroupedByPriority(): Observable<GroupedIssues> {
    return this.getMyIssues().pipe(
      map(response => this.groupIssuesByPriority(response.issues))
    );
  }

  /**
   * Get issues grouped by epic
   */
  getIssuesGroupedByEpic(): Observable<GroupedIssues> {
    return this.getMyIssues().pipe(
      map(response => this.groupIssuesByEpic(response.issues))
    );
  }

  /**
   * Get issues grouped by epic, then by issue type (nested)
   */
  getIssuesGroupedByEpicAndType(): Observable<NestedGroupedIssues> {
    return this.getMyIssues().pipe(
      map(response => this.groupIssuesByEpicAndType(response.issues))
    );
  }

  /**
   * Get issues for active sprint
   */
  getActiveSprintIssues(): Observable<JiraIssue[]> {
    return this.getMyIssues().pipe(
      map(response => response.issues.filter(issue =>
        issue.sprint?.state === 'active'
      ))
    );
  }

  /**
   * Get summary statistics
   */
  getIssueSummary(): Observable<IssueSummary> {
    return this.getMyIssues().pipe(
      map(response => {
        const issues = response.issues;
        const summary: IssueSummary = {
          total: issues.length,
          byStatus: {},
          byPriority: {},
          byProject: {}
        };

        issues.forEach(issue => {
          // Count by status
          const status = issue.status?.name || 'No Status';
          summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;

          // Count by priority (can be null)
          const priority = issue.priority?.name || 'No Priority';
          summary.byPriority[priority] = (summary.byPriority[priority] || 0) + 1;

          // Count by project
          const project = issue.project?.name || 'No Project';
          summary.byProject[project] = (summary.byProject[project] || 0) + 1;
        });

        return summary;
      })
    );
  }

  /**
   * Search issues by text
   */
  searchIssues(searchTerm: string): Observable<JiraIssue[]> {
    return this.getMyIssues().pipe(
      map(response => {
        const term = searchTerm.toLowerCase();
        return response.issues.filter(issue =>
          issue.key.toLowerCase().includes(term) ||
          issue.summary.toLowerCase().includes(term) ||
          // Description is now Atlassian Document Format, need to extract text
          this.extractDescriptionText(issue.description).toLowerCase().includes(term) ||
          issue.labels.some(label => label.toLowerCase().includes(term))
        );
      })
    );
  }

  /**
   * Helper to extract plain text from Atlassian Document Format
   */
  private extractDescriptionText(description: any): string {
    if (!description || !description.content) return '';
    let text = '';
    const extractText = (content: any[]): void => {
      content.forEach((item: any) => {
        if (item.text) {
          text += item.text + ' ';
        }
        if (item.content) {
          extractText(item.content);
        }
      });
    };
    extractText(description.content);
    return text.trim();
  }

  /**
   * Filter issues by status
   */
  filterByStatus(statusName: string): Observable<JiraIssue[]> {
    return this.getMyIssues().pipe(
      map(response => response.issues.filter(issue =>
        issue.status.name === statusName
      ))
    );
  }

  /**
   * Filter issues by priority
   */
  filterByPriority(priorityName: string): Observable<JiraIssue[]> {
    return this.getMyIssues().pipe(
      map(response => response.issues.filter(issue =>
        issue.priority?.name === priorityName
      ))
    );
  }

  /**
   * Filter issues by project
   */
  filterByProject(projectKey: string): Observable<JiraIssue[]> {
    return this.getMyIssues().pipe(
      map(response => response.issues.filter(issue =>
        issue.project.key === projectKey
      ))
    );
  }

  // Helper methods for grouping

  private groupIssuesByStatus(issues: JiraIssue[]): GroupedIssues {
    return issues.reduce((groups: GroupedIssues, issue) => {
      const status = issue.status.name;
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(issue);
      return groups;
    }, {});
  }

  private groupIssuesByProject(issues: JiraIssue[]): GroupedIssues {
    return issues.reduce((groups: GroupedIssues, issue) => {
      const project = issue.project.name;
      if (!groups[project]) {
        groups[project] = [];
      }
      groups[project].push(issue);
      return groups;
    }, {});
  }

  private groupIssuesByPriority(issues: JiraIssue[]): GroupedIssues {
    return issues.reduce((groups: GroupedIssues, issue) => {
      const priority = issue.priority?.name || 'No Priority';
      if (!groups[priority]) {
        groups[priority] = [];
      }
      groups[priority].push(issue);
      return groups;
    }, {});
  }

  private groupIssuesByEpic(issues: JiraIssue[]): GroupedIssues {
    return issues.reduce((groups: GroupedIssues, issue) => {
      // Handle null epic explicitly
      const epicName = issue.epic?.name ?? 'No Epic';
      if (!groups[epicName]) {
        groups[epicName] = [];
      }
      groups[epicName].push(issue);
      return groups;
    }, {});
  }

  private groupIssuesByEpicAndType(issues: JiraIssue[]): NestedGroupedIssues {
    const nested: NestedGroupedIssues = {};

    issues.forEach(issue => {
      // Handle null epic and type explicitly
      const epicName = issue.epic?.name ?? 'No Epic';
      const issueType = issue.type?.name ?? 'Unknown';

      // Initialize epic group if it doesn't exist
      if (!nested[epicName]) {
        nested[epicName] = {};
      }

      // Initialize issue type array if it doesn't exist
      if (!nested[epicName][issueType]) {
        nested[epicName][issueType] = [];
      }

      // Add issue to the nested group
      nested[epicName][issueType].push(issue);
    });

    return nested;
  }
}
