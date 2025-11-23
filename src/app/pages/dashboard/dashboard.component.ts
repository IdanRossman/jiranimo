import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { JiraService } from '../../services/jira.service';
import { JiraIssue, JiraUser, GroupedIssues, NestedGroupedIssues, IssueSummary, IssueRequiringAttention } from '../../models/jira.models';
import { GlassButtonComponent } from '../../components/glass-button/glass-button.component';
import { IssuesSidebarComponent } from '../../components/issues-sidebar/issues-sidebar.component';
import { AiChatSidebarComponent } from '../../components/ai-chat-sidebar/ai-chat-sidebar.component';
import { IssueCardComponent } from '../../components/issue-card/issue-card.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { environment } from '../../../environments/environment';

interface KanbanColumn {
  id: string;
  title: string;
  statusNames: string[];
  issues: JiraIssue[];
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, GlassButtonComponent, IssuesSidebarComponent, AiChatSidebarComponent, IssueCardComponent, NgxChartsModule, DragDropModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  currentUser: JiraUser | null = null;
  allIssues: JiraIssue[] = [];
  issuesRequiringAttention: IssueRequiringAttention[] = [];
  issuesByStatus: GroupedIssues = {};
  nestedIssues: NestedGroupedIssues = {}; // For epic -> type grouping
  summary: IssueSummary | null = null;
  loading = true;

  // View options
  groupBy: 'status' | 'project' | 'priority' | 'epic' = 'epic';
  chartsCollapsed = false;
  sidebarCollapsed = true;
  aiChatSidebarCollapsed = true;
  dashboardLoaded = false;

  // Issue detail modal
  selectedIssue: JiraIssue | null = null;
  showDetailModal = false;
  modalAnimationState: 'opening' | 'open' | 'closing' | 'closed' = 'closed';
  cardPosition: { top: number; left: number; width: number; height: number } | null = null;

  // Kanban board
  kanbanColumns: KanbanColumn[] = [
    { id: 'todo', title: 'TO DO', statusNames: ['To Do', 'Open', 'Backlog'], issues: [] },
    { id: 'in-progress', title: 'IN PROGRESS', statusNames: ['In Progress', 'In Development'], issues: [] },
    { id: 'in-review', title: 'IN REVIEW', statusNames: ['In Review', 'Code Review', 'Testing'], issues: [] },
    { id: 'done', title: 'DONE', statusNames: ['Done', 'Resolved', 'Closed'], issues: [] }
  ];
  projects: { key: string; name: string; color: string; visible: boolean }[] = [];
  showProjectFilter = false;
  searchQuery = '';
  filteredIssues: JiraIssue[] = [];
  selectedPriority = '';
  selectedType = '';
  availablePriorities: string[] = [];
  availableTypes: string[] = [];

  // Chart data
  epicChartData: any[] = [];
  priorityChartData: any[] = [];

  // Chart options
  colorScheme: any = {
    domain: ['#667eea', '#764ba2', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']
  };

  priorityColorScheme: any = {
    domain: ['#dc2626', '#f59e0b', '#3b82f6', '#10b981', '#6b7280']
  };

  constructor(private jiraService: JiraService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    console.log('📊 Dashboard: Loading data...');

    // Load current user
    this.jiraService.getCurrentUser().subscribe({
      next: (user) => {
        console.log('✅ Dashboard: Current user loaded', user);
        this.currentUser = user;
      },
      error: (err) => {
        console.error('❌ Dashboard: Error loading current user', err);
      }
    });

    // Load all issues
    this.jiraService.getMyIssues().subscribe({
      next: (response) => {
        console.log('✅ Dashboard: Response loaded', response);
        this.allIssues = response.issues;
        this.issuesRequiringAttention = response.issuesRequiringAttention || [];
        console.log('📈 Dashboard: Total issues count:', this.allIssues.length);
        console.log('⚠️ Dashboard: Issues requiring attention:', this.issuesRequiringAttention.length);
        if (this.allIssues.length > 0) {
          console.log('📝 Dashboard: First issue structure:', this.allIssues[0]);
        }
        this.loading = false;
        this.updateGrouping();
        this.updateChartData();
        this.initializeKanbanBoard();
        this.extractAvailableFilters();
        // Trigger fade-in animation after a brief delay
        setTimeout(() => {
          this.dashboardLoaded = true;
        }, 50);
      },
      error: (err) => {
        console.error('❌ Dashboard: Error loading issues', err);
        console.error('🔥 Dashboard: Error details:', err.error);
        this.loading = false;
      }
    });

    // Load summary stats
    this.jiraService.getIssueSummary().subscribe({
      next: (summary) => {
        console.log('✅ Dashboard: Summary loaded', summary);
        this.summary = summary;
      },
      error: (err) => {
        console.error('❌ Dashboard: Error loading summary', err);
      }
    });
  }

  updateGrouping() {
    switch (this.groupBy) {
      case 'status':
        this.jiraService.getIssuesGroupedByStatus().subscribe(grouped => {
          this.issuesByStatus = grouped;
          this.nestedIssues = {};
        });
        break;
      case 'project':
        this.jiraService.getIssuesGroupedByProject().subscribe(grouped => {
          this.issuesByStatus = grouped;
          this.nestedIssues = {};
        });
        break;
      case 'priority':
        this.jiraService.getIssuesGroupedByPriority().subscribe(grouped => {
          this.issuesByStatus = grouped;
          this.nestedIssues = {};
        });
        break;
      case 'epic':
        // Use nested grouping for epics
        this.jiraService.getIssuesGroupedByEpicAndType().subscribe(nested => {
          this.nestedIssues = nested;
          this.issuesByStatus = {};
        });
        break;
    }
  }

  changeGrouping(groupBy: 'status' | 'project' | 'priority' | 'epic') {
    this.groupBy = groupBy;
    this.updateGrouping();
  }

  toggleChartsCollapse() {
    this.chartsCollapsed = !this.chartsCollapsed;
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

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  openIssueDetail(issue: JiraIssue, event: MouseEvent) {
    const cardElement = (event.currentTarget as HTMLElement);
    const rect = cardElement.getBoundingClientRect();

    // Store card position for animation
    this.cardPosition = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };

    this.selectedIssue = issue;
    this.showDetailModal = true;
    this.modalAnimationState = 'opening';

    // Transition to open state after animation completes
    setTimeout(() => {
      this.modalAnimationState = 'open';
    }, 500); // Match the animation duration (0.5s)
  }

  closeIssueDetail() {
    this.modalAnimationState = 'closing';

    setTimeout(() => {
      this.showDetailModal = false;
      this.modalAnimationState = 'closed';
      this.cardPosition = null;
      setTimeout(() => {
        this.selectedIssue = null;
      }, 100);
    }, 400); // Wait for closing animation
  }

  getJiraUrl(issue: JiraIssue): string {
    // Use the configured Jira base URL from environment
    return `${environment.jiraBaseUrl}/browse/${issue.key}`;
  }

  openInJira(issue: JiraIssue) {
    const url = this.getJiraUrl(issue);
    window.open(url, '_blank');
  }

  getEpicTotalCount(epicName: string): number {
    if (!this.nestedIssues[epicName]) return 0;

    return Object.values(this.nestedIssues[epicName])
      .reduce((total, issues) => total + issues.length, 0);
  }

  updateChartData() {
    // Prepare epic chart data
    const epicCounts: { [key: string]: number } = {};
    this.allIssues.forEach(issue => {
      // Handle null epic explicitly
      const epicName = issue.epic?.name ?? 'No Epic';
      epicCounts[epicName] = (epicCounts[epicName] || 0) + 1;
    });

    this.epicChartData = Object.entries(epicCounts).map(([name, value]) => ({
      name,
      value
    }));
  }

  /**
   * Extract plain text from Atlassian Document Format
   */
  getDescriptionText(description: any): string {
    if (!description || !description.content) return 'No description';
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
    return text.trim() || 'No description';
  }

  onSidebarCollapsedChange(collapsed: boolean) {
    this.sidebarCollapsed = collapsed;
  }

  onAiChatSidebarCollapsedChange(collapsed: boolean) {
    this.aiChatSidebarCollapsed = collapsed;
  }

  // Kanban Board Methods
  initializeKanbanBoard() {
    // Reset columns
    this.kanbanColumns.forEach(col => col.issues = []);

    // Extract unique projects and assign colors
    const projectMap = new Map<string, { key: string; name: string; color: string }>();
    const colors = ['#667eea', '#764ba2', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6', '#06b6d4', '#84cc16'];
    
    this.allIssues.forEach(issue => {
      if (issue.project && !projectMap.has(issue.project.key)) {
        projectMap.set(issue.project.key, {
          key: issue.project.key,
          name: issue.project.name,
          color: colors[projectMap.size % colors.length]
        });
      }
    });

    this.projects = Array.from(projectMap.values()).map(p => ({ ...p, visible: true }));

    // Distribute issues to columns based on status
    this.allIssues.forEach(issue => {
      // Skip done issues
      if (issue.status.categoryKey === 'done') return;

      for (const column of this.kanbanColumns) {
        if (column.statusNames.some(status => 
          issue.status.name.toLowerCase().includes(status.toLowerCase())
        )) {
          column.issues.push(issue);
          return;
        }
      }
      
      // Default to TODO if no match
      this.kanbanColumns[0].issues.push(issue);
    });
  }

  onDrop(event: CdkDragDrop<JiraIssue[]>) {
    if (event.previousContainer === event.container) {
      // Reorder within same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Move between columns
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // TODO: Update issue status in Jira API
      const issue = event.container.data[event.currentIndex];
      console.log('🔄 Issue moved:', issue.key, 'to column:', event.container.id);
      // Future: Call Jira API to update status
    }
  }

  getProjectColor(issue: JiraIssue): string {
    const project = this.projects.find(p => p.key === issue.project.key);
    return project?.color || '#6b7280';
  }

  toggleProjectFilter() {
    this.showProjectFilter = !this.showProjectFilter;
  }

  toggleProjectVisibility(projectKey: string) {
    const project = this.projects.find(p => p.key === projectKey);
    if (project) {
      project.visible = !project.visible;
      this.filterKanbanByProjects();
    }
  }

  filterKanbanByProjects() {
    const visibleProjectKeys = this.projects.filter(p => p.visible).map(p => p.key);
    
    this.kanbanColumns.forEach(column => {
      column.issues = this.allIssues.filter(issue => {
        // Skip done issues
        if (issue.status.categoryKey === 'done') return false;
        
        // Filter by project visibility
        if (!visibleProjectKeys.includes(issue.project.key)) return false;

        // Check if issue belongs to this column
        return column.statusNames.some(status => 
          issue.status.name.toLowerCase().includes(status.toLowerCase())
        );
      });
    });
  }

  // Helper methods for Kanban view
  getVisibleProjectsCount(): number {
    return this.projects.filter(p => p.visible).length;
  }

  getProjectColorRgb(issue: JiraIssue): string {
    const hex = this.getProjectColor(issue);
    return this.hexToRgb(hex);
  }

  hexToRgb(hex: string): string {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.allIssues;

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(issue => 
        issue.key.toLowerCase().includes(query) ||
        issue.summary.toLowerCase().includes(query) ||
        issue.project.name.toLowerCase().includes(query) ||
        issue.type.name.toLowerCase().includes(query)
      );
    }

    // Apply priority filter
    if (this.selectedPriority) {
      filtered = filtered.filter(issue => 
        issue.priority?.name === this.selectedPriority
      );
    }

    // Apply type filter
    if (this.selectedType) {
      filtered = filtered.filter(issue => 
        issue.type.name === this.selectedType
      );
    }

    this.filteredIssues = filtered;
    
    if (this.searchQuery.trim() || this.selectedPriority || this.selectedType) {
      this.filterKanbanBySearch();
    } else {
      this.filterKanbanByProjects();
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.selectedPriority = '';
    this.selectedType = '';
    this.filteredIssues = [...this.allIssues];
    this.filterKanbanByProjects();
    this.extractAvailableFilters();
  }

  extractAvailableFilters() {
    // Get unique priorities from current filtered/visible issues
    const visibleIssues = this.filteredIssues.length > 0 ? this.filteredIssues : this.allIssues;
    
    const priorities = new Set<string>();
    const types = new Set<string>();
    
    visibleIssues.forEach(issue => {
      if (issue.priority?.name) {
        priorities.add(issue.priority.name);
      }
      if (issue.type?.name) {
        types.add(issue.type.name);
      }
    });
    
    this.availablePriorities = Array.from(priorities).sort();
    this.availableTypes = Array.from(types).sort();
  }

  filterKanbanBySearch() {
    const visibleProjectKeys = this.projects.filter(p => p.visible).map(p => p.key);
    
    this.kanbanColumns.forEach(column => {
      column.issues = this.filteredIssues.filter(issue => {
        // Skip done issues
        if (issue.status.categoryKey === 'done') return false;
        
        // Filter by project visibility
        if (!visibleProjectKeys.includes(issue.project.key)) return false;

        // Check if issue belongs to this column
        return column.statusNames.some(status => 
          issue.status.name.toLowerCase().includes(status.toLowerCase())
        );
      });
    });
  }
}
