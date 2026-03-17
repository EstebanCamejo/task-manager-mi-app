import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalRef } from '../modal-ref';
import { MODAL_DATA } from '../modal-tokens';
import type { TaskModalData, TaskModalResult } from './task-modal.data';
import type { TaskPriority, TaskStatus } from '../../services/tasks.service';

const defaultStatus: TaskStatus = 'todo';
const defaultPriority: TaskPriority = 'normal';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="modal-box" (click)="$event.stopPropagation()">
      <h2 class="modal-title">
        {{ data.mode === 'create' ? 'Nueva tarea' : 'Editar tarea' }}
      </h2>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="grid">
          <div class="field">
            <label for="task-project">Proyecto</label>
            <select id="task-project" formControlName="projectId">
              @for (p of data.projects; track p.id) {
                <option [value]="p.id">{{ p.name }}</option>
              }
            </select>
          </div>

          <div class="field">
            <label for="task-status">Estado</label>
            <select id="task-status" formControlName="status">
              <option value="todo">Por hacer</option>
              <option value="in_progress">En progreso</option>
              <option value="done">Hecho</option>
            </select>
          </div>

          <div class="field">
            <label for="task-priority">Prioridad</label>
            <select id="task-priority" formControlName="priority">
              <option value="urgente">Urgente</option>
              <option value="prioritario">Prioritario</option>
              <option value="normal">Normal</option>
            </select>
          </div>

          <div class="field full">
            <label for="task-title">Título</label>
            <input id="task-title" type="text" formControlName="title" />
          </div>

          <div class="field full">
            <label for="task-description">Descripción</label>
            <textarea id="task-description" rows="3" formControlName="description"></textarea>
          </div>
        </div>

        <div class="actions">
          <button type="button" class="btn-cancel" (click)="cancel()">Cancelar</button>
          <button type="submit" class="btn-confirm" [disabled]="form.invalid">
            {{ data.mode === 'create' ? 'Crear' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .modal-box {
        background: var(--modal-bg, #fff);
        padding: 1.25rem;
        border-radius: 10px;
        min-width: 420px;
        max-width: 520px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }
      .modal-title {
        margin: 0 0 1rem;
        font-size: 1.25rem;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .full {
        grid-column: 1 / -1;
      }
      input,
      textarea,
      select {
        padding: 0.5rem 0.6rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.6rem;
        margin-top: 1rem;
      }
      .btn-cancel {
        padding: 0.5rem 0.9rem;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background: #fff;
        cursor: pointer;
      }
      .btn-confirm {
        padding: 0.5rem 0.9rem;
        border: none;
        border-radius: 8px;
        background: #0066cc;
        color: #fff;
        cursor: pointer;
      }
      @media (max-width: 520px) {
        .modal-box {
          min-width: auto;
          width: calc(100vw - 2rem);
        }
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class TaskModalComponent {
  private modalRef = inject(ModalRef);
  data: TaskModalData = inject(MODAL_DATA, { optional: true }) as TaskModalData;

  private fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    projectId: [
      this.data?.initial?.projectId ?? this.data?.projects?.[0]?.id ?? '',
      Validators.required,
    ],
    title: [this.data?.initial?.title ?? '', Validators.required],
    description: [this.data?.initial?.description ?? ''],
    status: [this.data?.initial?.status ?? defaultStatus],
    priority: [this.data?.initial?.priority ?? defaultPriority],
  });

  cancel(): void {
    this.modalRef.close(null);
  }

  submit(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const result: TaskModalResult = {
      projectId: raw.projectId,
      title: raw.title,
      description: raw.description ?? '',
      status: raw.status,
      priority: raw.priority,
    };
    this.modalRef.close(result);
  }
}

