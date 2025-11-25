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
import { IssueFilterBarComponent } from '../../components/shared/issue-filter-bar/issue-filter-bar.component';
import { IssueDetailModalComponent } from '../../components/issue-detail-modal/issue-detail-modal.component';
import { LoadingSpinnerComponent } from '../../components/shared/loading-spinner/loading-spinner.component';
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
  imports: [CommonModule, FormsModule, IssuesSidebarComponent, AiChatSidebarComponent, IssueCardComponent, IssueFilterBarComponent, IssueDetailModalComponent, LoadingSpinnerComponent, NgxChartsModule, DragDropModule, MatIconModule],
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
  cardPosition: { top: number; left: number; width: number; height: number } | null = null;
  private closeTimeout: any = null;

  // Kanban board
  kanbanColumns: KanbanColumn[] = [
    { id: 'todo', title: 'TO DO', statusNames: ['To Do', 'Open', 'Backlog'], issues: [] },
    { id: 'in-progress', title: 'IN PROGRESS', statusNames: ['In Progress', 'In Development'], issues: [] },
    { id: 'in-review', title: 'IN REVIEW', statusNames: ['In Review', 'Code Review', 'Testing'], issues: [] },
    { id: 'done', title: 'DONE', statusNames: ['Done', 'Resolved', 'Closed'], issues: [] }
  ];
  projects: { key: string; name: string; color: string; visible: boolean }[] = [];
  selectedProjects: string[] = [];
  showProjectFilter = false;
  searchQuery = '';
  filteredIssues: JiraIssue[] = [];
  selectedPriority = '';
  selectedType = '';
  selectedTypes: string[] = [];
  availablePriorities: string[] = [];
  availableTypes: string[] = [];
  selectedLabels: string[] = [];
  availableLabels: string[] = [];

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

    // Load current user
    this.jiraService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (err) => {
        console.error('❌ Dashboard: Error loading current user', err);
      }
    });

    // Load all issues
    this.jiraService.getMyIssues().subscribe({
      next: (response) => {
        this.allIssues = response.issues;
        this.issuesRequiringAttention = response.issuesRequiringAttention || [];
        this.loading = false;
        this.updateGrouping();
        this.updateChartData();
        this.initializeKanbanBoard();
        this.extractAvailableFilters();
        this.calculateSummary(); // Calculate summary from loaded issues
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
  }

  updateGrouping() {
    // Use already loaded issues instead of fetching again
    if (this.allIssues.length === 0) return;

    switch (this.groupBy) {
      case 'status':
        this.issuesByStatus = this.groupIssuesByStatus(this.allIssues);
        this.nestedIssues = {};
        break;
      case 'project':
        this.issuesByStatus = this.groupIssuesByProject(this.allIssues);
        this.nestedIssues = {};
        break;
      case 'priority':
        this.issuesByStatus = this.groupIssuesByPriority(this.allIssues);
        this.nestedIssues = {};
        break;
      case 'epic':
        // Use nested grouping for epics
        this.nestedIssues = this.groupIssuesByEpicAndType(this.allIssues);
        this.issuesByStatus = {};
        break;
    }
  }

  // Local grouping methods (no HTTP calls)
  private groupIssuesByStatus(issues: JiraIssue[]): GroupedIssues {
    const grouped: GroupedIssues = {};
    issues.forEach(issue => {
      const status = issue.status.name;
      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(issue);
    });
    return grouped;
  }

  private groupIssuesByProject(issues: JiraIssue[]): GroupedIssues {
    const grouped: GroupedIssues = {};
    issues.forEach(issue => {
      const project = issue.project.name;
      if (!grouped[project]) grouped[project] = [];
      grouped[project].push(issue);
    });
    return grouped;
  }

  private groupIssuesByPriority(issues: JiraIssue[]): GroupedIssues {
    const grouped: GroupedIssues = {};
    issues.forEach(issue => {
      const priority = issue.priority?.name || 'No Priority';
      if (!grouped[priority]) grouped[priority] = [];
      grouped[priority].push(issue);
    });
    return grouped;
  }

  private groupIssuesByEpicAndType(issues: JiraIssue[]): NestedGroupedIssues {
    const nested: NestedGroupedIssues = {};
    issues.forEach(issue => {
      const epicName = issue.epic?.name ?? 'No Epic';
      const issueType = issue.type.name;

      if (!nested[epicName]) nested[epicName] = {};
      if (!nested[epicName][issueType]) nested[epicName][issueType] = [];
      nested[epicName][issueType].push(issue);
    });
    return nested;
  }

  private calculateSummary() {
    if (this.allIssues.length === 0) {
      this.summary = null;
      return;
    }

    this.summary = {
      total: this.allIssues.length,
      byStatus: {},
      byPriority: {},
      byProject: {}
    };

    this.allIssues.forEach(issue => {
      // Count by status
      const status = issue.status?.name || 'No Status';
      this.summary!.byStatus[status] = (this.summary!.byStatus[status] || 0) + 1;

      // Count by priority
      const priority = issue.priority?.name || 'No Priority';
      this.summary!.byPriority[priority] = (this.summary!.byPriority[priority] || 0) + 1;

      // Count by project
      const project = issue.project?.name || 'No Project';
      this.summary!.byProject[project] = (this.summary!.byProject[project] || 0) + 1;
    });
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

    // Clear any pending close timeout
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }

    // Store card position for animation
    this.cardPosition = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };

    this.selectedIssue = issue;
    this.showDetailModal = true;
  }

  closeIssueDetail() {
    this.showDetailModal = false;
    
    this.closeTimeout = setTimeout(() => {
      this.selectedIssue = null;
      this.cardPosition = null;
      this.closeTimeout = null;
    }, 400); // Wait for closing animation
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
    
    // Initialize selectedProjects with all projects
    this.selectedProjects = this.projects.map(p => p.key);

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
      const issue = event.previousContainer.data[event.previousIndex];
      const targetColumn = this.kanbanColumns.find(col => col.issues === event.container.data);
      
      if (!targetColumn) {
        console.error('❌ Could not find target column');
        return;
      }

      // Get the first status name from the target column (primary status)
      const newStatusName = targetColumn.statusNames[0];
      
      // Optimistically update UI
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update issue status in Jira
      this.jiraService.updateIssueStatus(issue.key, newStatusName).subscribe({
        next: () => {
          // Update the local issue object
          issue.status.name = newStatusName;
        },
        error: (err) => {
          console.error(`❌ Failed to update ${issue.key} status:`, err);
          // Revert the UI change on error
          transferArrayItem(
            event.container.data,
            event.previousContainer.data,
            event.currentIndex,
            event.previousIndex
          );
          alert(`Failed to update issue status: ${err.error?.message || err.message}`);
        }
      });
    }
  }

  getProjectColor(issue: JiraIssue): string {
    const project = this.projects.find(p => p.key === issue.project.key);
    return project?.color || '#6b7280';
  }

  toggleProjectFilter() {
    this.showProjectFilter = !this.showProjectFilter;
  }

  onProjectsChange(projectKeys: string[]) {
    this.selectedProjects = projectKeys;
    this.filterKanbanByProjects();
  }

  filterKanbanByProjects() {
    // If no projects selected, show all
    const visibleProjectKeys = this.selectedProjects.length > 0 
      ? this.selectedProjects 
      : this.projects.map(p => p.key);
    
    this.kanbanColumns.forEach(column => {
      column.issues = this.allIssues.filter(issue => {
        // Skip done issues
        if (issue.status.categoryKey === 'done') return false;
        
        // Filter by project selection
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

    // Apply multiselect type filter
    if (this.selectedTypes.length > 0) {
      filtered = filtered.filter(issue => 
        this.selectedTypes.includes(issue.type.name)
      );
    }

    // Apply labels filter
    if (this.selectedLabels.length > 0) {
      filtered = filtered.filter(issue => 
        issue.labels && issue.labels.some(label => this.selectedLabels.includes(label))
      );
    }

    this.filteredIssues = filtered;
    
    if (this.searchQuery.trim() || this.selectedPriority || this.selectedType || this.selectedTypes.length > 0 || this.selectedLabels.length > 0) {
      this.filterKanbanBySearch();
    } else {
      this.filterKanbanByProjects();
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.selectedPriority = '';
    this.selectedType = '';
    this.selectedTypes = [];
    this.filteredIssues = [...this.allIssues];
    this.filterKanbanByProjects();
    this.extractAvailableFilters();
  }

  extractAvailableFilters() {
    // Get unique priorities from current filtered/visible issues
    const visibleIssues = this.filteredIssues.length > 0 ? this.filteredIssues : this.allIssues;
    
    const priorities = new Set<string>();
    const types = new Set<string>();
    const labels = new Set<string>();
    
    visibleIssues.forEach(issue => {
      if (issue.priority?.name) {
        priorities.add(issue.priority.name);
      }
      if (issue.type?.name) {
        types.add(issue.type.name);
      }
      if (issue.labels && issue.labels.length > 0) {
        issue.labels.forEach(label => labels.add(label));
      }
    });
    
    this.availablePriorities = Array.from(priorities).sort();
    this.availableTypes = Array.from(types).sort();
    this.availableLabels = Array.from(labels).sort();
  }

  filterKanbanBySearch() {
    // If no projects selected, show all
    const visibleProjectKeys = this.selectedProjects.length > 0 
      ? this.selectedProjects 
      : this.projects.map(p => p.key);
    
    this.kanbanColumns.forEach(column => {
      column.issues = this.filteredIssues.filter(issue => {
        // Skip done issues
        if (issue.status.categoryKey === 'done') return false;
        
        // Filter by project selection
        if (!visibleProjectKeys.includes(issue.project.key)) return false;

        // Check if issue belongs to this column
        return column.statusNames.some(status => 
          issue.status.name.toLowerCase().includes(status.toLowerCase())
        );
      });
    });
  }

  refreshIssues() {
    this.loadData();
  }
}
