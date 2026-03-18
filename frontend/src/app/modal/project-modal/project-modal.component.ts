import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalRef } from '../modal-ref';
import { MODAL_DATA } from '../modal-tokens';
import type { ProjectModalData, ProjectModalResult } from './project-modal.data';

@Component({
  selector: 'app-project-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="modal-box" (click)="$event.stopPropagation()">
      <h2 class="modal-title">
        {{ data.mode === 'create' ? 'Nuevo proyecto' : 'Editar proyecto' }}
      </h2>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="field">
          <label for="project-name">Nombre</label>
          <input id="project-name" type="text" formControlName="name" />
        </div>

        <div class="field">
          <label for="project-description">Descripción</label>
          <input id="project-description" type="text" formControlName="description" />
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
        background: var(--color-surface);
        padding: 1.25rem;
        border-radius: 10px;
        min-width: 360px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }
      .modal-title {
        margin: 0 0 1rem;
        font-size: 1.25rem;
        color: var(--color-text);
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-bottom: 0.75rem;
      }
      label {
        color: var(--color-text);
        font-weight: 600;
      }
      input {
        padding: 0.5rem 0.6rem;
        border: 1px solid var(--color-border);
        border-radius: 8px;
        background: var(--color-surface);
        color: var(--color-text);
      }
      input:focus {
        outline: 2px solid rgba(37, 99, 235, 0.35);
        outline-offset: 2px;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.6rem;
        margin-top: 1rem;
      }
      .btn-cancel {
        padding: 0.5rem 0.9rem;
        border: 1px solid var(--color-border);
        border-radius: 8px;
        background: var(--color-surface);
        color: var(--color-text);
        cursor: pointer;
      }
      .btn-confirm {
        padding: 0.5rem 0.9rem;
        border: none;
        border-radius: 8px;
        background: var(--color-primary);
        color: #fff;
        cursor: pointer;
      }
    `,
  ],
})
export class ProjectModalComponent {
  private modalRef = inject(ModalRef);
  data: ProjectModalData = inject(MODAL_DATA, { optional: true }) as ProjectModalData;

  private fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({
    name: [this.data?.initial?.name ?? '', Validators.required],
    description: [this.data?.initial?.description ?? ''],
  });

  cancel(): void {
    this.modalRef.close(null);
  }

  submit(): void {
    if (this.form.invalid) return;
    const { name, description } = this.form.getRawValue();
    const result: ProjectModalResult = {
      name,
      description: description ?? '',
    };
    this.modalRef.close(result);
  }
}

