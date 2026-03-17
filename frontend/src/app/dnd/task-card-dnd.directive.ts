import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { CleanupFn } from '@atlaskit/pragmatic-drag-and-drop/types';
import type { TaskStatus } from '../services/tasks.service';

type TaskDragData = {
  kind: 'task';
  taskId: string;
  fromStatus: TaskStatus;
};

@Directive({
  selector: '[appTaskCardDnd]',
  standalone: true,
})
export class TaskCardDndDirective implements OnInit, OnDestroy {
  @Input({ required: true }) taskId!: string;
  @Input({ required: true }) fromStatus!: TaskStatus;

  private cleanup: CleanupFn | null = null;

  constructor(private host: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    const element = this.host.nativeElement;
    this.cleanup = draggable({
      element,
      getInitialData: (): TaskDragData => ({
        kind: 'task',
        taskId: this.taskId,
        fromStatus: this.fromStatus,
      }),
      onDragStart: () => {
        element.classList.add('is-dragging');
      },
      onDrop: () => {
        element.classList.remove('is-dragging');
      },
    });
  }

  ngOnDestroy(): void {
    this.cleanup?.();
    this.cleanup = null;
  }
}

