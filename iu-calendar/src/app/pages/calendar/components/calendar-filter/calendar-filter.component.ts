import { Component, input, output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { EventType, EVENT_TYPE_INFO, EventTypeInfo } from '../../../../core/models/event.model';

@Component({
  selector: 'app-calendar-filter',
  standalone: true,
  imports: [MatCheckboxModule, FormsModule],
  template: `
    <div class="flex flex-wrap gap-3 mb-6">
      @for (eventType of eventTypes(); track eventType.type) {
        <label class="flex items-center gap-2 cursor-pointer">
          <mat-checkbox
            [checked]="isTypeSelected(eventType.type)"
            (change)="onTypeToggle(eventType.type)">
          </mat-checkbox>
          <span class="inline-block w-3 h-3 rounded-full"
                [style.background-color]="eventType.color">
          </span>
          <span>{{ eventType.label }}</span>
        </label>
      }
    </div>
  `
})
export class CalendarFilterComponent {
  // Inputs
  eventTypes = input.required<EventTypeInfo[]>();
  selectedTypes = input.required<EventType[]>();

  // Outputs
  typeToggle = output<EventType>();

  isTypeSelected(type: EventType): boolean {
    return this.selectedTypes().includes(type);
  }

  onTypeToggle(type: EventType) {
    this.typeToggle.emit(type);
  }
}
