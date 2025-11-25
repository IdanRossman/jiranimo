import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface FilterOption {
  label: string;
  value: string;
  suggested?: boolean;
}

@Component({
  selector: 'app-filter-multiselect',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './filter-multiselect.component.html',
  styleUrl: './filter-multiselect.component.css'
})
export class FilterMultiselectComponent {
  @Input() icon = 'filter_list';
  @Input() placeholder = 'All';
  @Input() options: FilterOption[] = [];
  @Input() selectedValue = '';
  @Input() selectedValues: string[] = []; // For multiselect mode
  @Input() multiselect = false;
  @Output() selectedValueChange = new EventEmitter<string>();
  @Output() selectedValuesChange = new EventEmitter<string[]>();

  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  toggleDropdown(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.isOpen = !this.isOpen;
  }

  selectOption(value: string, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.multiselect) {
      // Multiselect logic
      if (value === '') {
        // Clear all selections
        this.selectedValues = [];
      } else {
        const index = this.selectedValues.indexOf(value);
        if (index > -1) {
          // Remove if already selected
          this.selectedValues = this.selectedValues.filter(v => v !== value);
        } else {
          // Add to selections
          this.selectedValues = [...this.selectedValues, value];
        }
      }
      this.selectedValuesChange.emit(this.selectedValues);
    } else {
      // Single select logic
      this.selectedValue = value;
      this.selectedValueChange.emit(this.selectedValue);
      this.isOpen = false;
    }
  }

  isSelected(value: string): boolean {
    if (this.multiselect) {
      return value === '' ? this.selectedValues.length === 0 : this.selectedValues.includes(value);
    }
    return value === '' ? !this.selectedValue : this.selectedValue === value;
  }

  isSuggested(option: FilterOption): boolean {
    return option.suggested || false;
  }

  get displayValue(): string {
    if (this.multiselect) {
      if (this.selectedValues.length === 0) return this.placeholder;
      if (this.selectedValues.length === 1) {
        const option = this.options.find(o => o.value === this.selectedValues[0]);
        return option ? option.label : this.placeholder;
      }
      return `${this.selectedValues.length} selected`;
    } else {
      if (!this.selectedValue) return this.placeholder;
      const option = this.options.find(o => o.value === this.selectedValue);
      return option ? option.label : this.placeholder;
    }
  }
}
