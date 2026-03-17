import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { CleanupFn } from '@atlaskit/pragmatic-drag-and-drop/types';
import type { TaskStatus } from '../services/tasks.service';

type ColumnDropData = {
  kind: 'task-column';
  status: TaskStatus;
};

@Directive({
  selector: '[appTaskColumnDnd]',
  standalone: true,
})
export class TaskColumnDndDirective implements OnInit, OnDestroy {
  @Input({ required: true }) status!: TaskStatus;

  private cleanup: CleanupFn | null = null;

  constructor(private host: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    const element = this.host.nativeElement;
    this.cleanup = dropTargetForElements({
      element,
      getData: (): ColumnDropData => ({ kind: 'task-column', status: this.status }),
      canDrop: ({ source }) => {
        const data = source.data as Record<string, unknown> | undefined;
        return data?.['kind'] === 'task';
      },
      getDropEffect: () => 'move',
      onDragEnter: () => element.classList.add('is-over'),
      onDragLeave: () => element.classList.remove('is-over'),
      onDrop: () => element.classList.remove('is-over'),
    });
  }

  ngOnDestroy(): void {
    this.cleanup?.();
    this.cleanup = null;
  }
}

