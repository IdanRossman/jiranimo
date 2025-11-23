export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress: string;
  avatarUrl: string; // Backend sends single URL, not object
  active: boolean;
  timeZone?: string;
}

export interface JiraStatus {
  id: string;
  name: string; // 'To Do', 'In Progress', 'Done', etc.
  category: string; // 'To Do', 'In Progress', 'Done'
  categoryKey: string; // 'new', 'indeterminate', 'done'
  colorName: string; // 'blue-gray', 'yellow', 'green'
}

export interface JiraPriority {
  id: string;
  name: string; // 'Highest', 'High', 'Medium', 'Low', 'Lowest'
  iconUrl?: string;
}

export interface JiraIssueType {
  id: string;
  name: string; // 'Task', 'Bug', 'Story', 'Epic', 'Sub-task'
  subtask: boolean;
  iconUrl?: string;
}

export interface JiraProject {
  id: string;
  key: string; // e.g., 'PROJ'
  name: string;
  avatarUrl?: string; // Backend sends single URL, not object
}

export interface JiraSprint {
  id: number;
  name: string;
  state: 'active' | 'closed' | 'future';
  startDate?: string;
  endDate?: string;
  completeDate?: string;
}

export interface JiraSubtask {
  id: string;
  key: string;
  summary: string;
  status: JiraStatus;
  type: JiraIssueType; // Backend uses 'type' not 'issuetype'
}

export interface JiraParent {
  id: string;
  key: string;
  summary: string;
}

export interface JiraEpic {
  id: string;
  key: string;
  name: string;
  summary: string;
  color?: string; // Epic color in Jira
  status?: JiraStatus;
  done: number; // Number of done issues
  total: number; // Total issues in epic
}

export interface JiraTimeTracking {
  originalEstimate?: string;
  remainingEstimate?: string;
  timeSpent?: string;
  originalEstimateSeconds?: number;
  remainingEstimateSeconds?: number;
  timeSpentSeconds?: number;
}

export interface JiraComment {
  id: string;
  author: JiraUser;
  body: string;
  created: string;
  updated: string;
}

// Atlassian Document Format for description
export interface JiraDescriptionContent {
  type: string;
  content?: any[];
  text?: string;
}

export interface JiraDescription {
  type: string;
  version: number;
  content: JiraDescriptionContent[];
}

// Backend sends flat structure, not nested in fields
export interface JiraIssue {
  id: string;
  key: string; // e.g., 'PROJ-123'
  summary: string;
  description: JiraDescription | null; // Atlassian Document Format - always present but can be null
  project: JiraProject;
  type: JiraIssueType; // Backend uses 'type' not 'issuetype'
  status: JiraStatus;
  assignee: JiraUser | null;
  reporter: JiraUser;
  priority: JiraPriority | null; // Can be null
  parent: JiraParent | null; // Can be null but always present in response
  epic: JiraEpic | null; // Can be null but always present in response
  labels: string[];
  components: Array<{ id: string; name: string }>;
  fixVersions: Array<{ id: string; name: string }>;
  created: string;
  updated: string;
  dueDate: string | null;
  self: string; // API URL
  customFields: { [key: string]: any }; // Custom fields from Jira - always present
  sprint?: JiraSprint; // Optional - may not always be present
  subtasks?: JiraSubtask[]; // Optional - may not always be present
  timetracking?: JiraTimeTracking; // Optional - may not always be present
  storyPoints?: number; // Optional - may not always be present
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface IssueRequiringAttention {
  issueKey: string;
  issueSummary: string;
  isValid: boolean;
  issues: ValidationIssue[];
}

export interface JiraSearchResponse {
  issues: JiraIssue[];
  issuesRequiringAttention?: IssueRequiringAttention[]; // Optional validation issues from backend
  isLast: boolean; // Backend uses this for pagination
  nextPageToken?: string; // Optional pagination token
}

// Utility type for grouped issues
export interface GroupedIssues {
  [key: string]: JiraIssue[];
}

// Nested grouping for epic -> issue type
export interface NestedGroupedIssues {
  [epicName: string]: {
    [issueType: string]: JiraIssue[];
  };
}

// Statistics/summary data
export interface IssueSummary {
  total: number;
  byStatus: { [status: string]: number };
  byPriority: { [priority: string]: number };
  byProject: { [project: string]: number };
}
