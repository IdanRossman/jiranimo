import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SearchInputComponent } from '../search-input/search-input.component';
import { FilterMultiselectComponent, FilterOption } from '../filter-multiselect/filter-multiselect.component';

export interface Project {
  key: string;
  name: string;
  color: string;
  visible: boolean;
}

@Component({
  selector: 'app-issue-filter-bar',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    SearchInputComponent,
    FilterMultiselectComponent
  ],
  templateUrl: './issue-filter-bar.component.html',
  styleUrl: './issue-filter-bar.component.css'
})
export class IssueFilterBarComponent {
  // Search
  @Input() searchQuery = '';
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() searchClear = new EventEmitter<void>();

  // Priority filter
  @Input() selectedPriority = '';
  @Input() availablePriorities: string[] = [];
  @Output() selectedPriorityChange = new EventEmitter<string>();

  // Type filter
  @Input() selectedType = '';
  @Input() selectedTypes: string[] = []; // For multiselect
  @Input() availableTypes: string[] = [];
  @Output() selectedTypeChange = new EventEmitter<string>();
  @Output() selectedTypesChange = new EventEmitter<string[]>();

  // Projects filter
  @Input() projects: Project[] = [];
  @Input() selectedProjects: string[] = [];
  @Output() selectedProjectsChange = new EventEmitter<string[]>();

  // Labels filter
  @Input() availableLabels: string[] = [];
  @Input() selectedLabels: string[] = [];
  @Output() selectedLabelsChange = new EventEmitter<string[]>();

  // Refresh
  @Output() refresh = new EventEmitter<void>();

  get priorityOptions(): FilterOption[] {
    return this.availablePriorities.map(p => ({ label: p, value: p }));
  }

  get typeOptions(): FilterOption[] {
    return this.availableTypes.map(t => ({ label: t, value: t }));
  }

  get projectOptions(): FilterOption[] {
    return this.projects.map(p => ({ label: p.name, value: p.key }));
  }

  get labelOptions(): FilterOption[] {
    return this.availableLabels.map(label => ({
      label: label,
      value: label,
      suggested: label.toLowerCase().includes('active-sprint')
    }));
  }

  onSearchChange(value: string) {
    this.searchQuery = value;
    this.searchQueryChange.emit(value);
  }

  onSearchClear() {
    this.searchClear.emit();
  }

  onPriorityChange(value: string) {
    this.selectedPriority = value;
    this.selectedPriorityChange.emit(value);
  }

  onTypeChange(value: string) {
    this.selectedType = value;
    this.selectedTypeChange.emit(value);
  }

  onTypesChange(values: string[]) {
    this.selectedTypes = values;
    this.selectedTypesChange.emit(values);
  }

  onProjectsChange(values: string[]) {
    this.selectedProjects = values;
    this.selectedProjectsChange.emit(values);
  }

  onLabelsChange(values: string[]) {
    this.selectedLabels = values;
    this.selectedLabelsChange.emit(values);
  }

  onRefresh() {
    this.refresh.emit();
  }
}
