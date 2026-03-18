import { Component, inject } from '@angular/core';
import { ModalRef } from '../modal-ref';
import { MODAL_DATA } from '../modal-tokens';
import type { ConfirmModalData } from './confirm-modal.data';

export type { ConfirmModalData };

const defaultConfirmData: ConfirmModalData = {
  title: 'Confirmar',
  message: '¿Continuar?',
};

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    <div class="modal-box" (click)="$event.stopPropagation()">
      <h2 class="modal-title">{{ data.title }}</h2>
      <p class="modal-message">{{ data.message }}</p>
      <div class="modal-actions">
        @if (!data.hideCancel) {
          <button type="button" class="btn-cancel" (click)="cancel()">
            {{ data.cancelText ?? 'Cancelar' }}
          </button>
        }
        <button
          type="button"
          [class]="data.danger ? 'btn-confirm btn-danger' : 'btn-confirm'"
          (click)="confirm()"
        >
          {{ data.confirmText ?? 'Aceptar' }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-box {
        background: var(--modal-bg, #fff);
        padding: 1.5rem;
        border-radius: 8px;
        min-width: 320px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }
      .modal-title {
        margin: 0 0 0.75rem;
        font-size: 1.25rem;
      }
      .modal-message {
        margin: 0 0 1.25rem;
        color: #555;
      }
      .modal-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }
      .btn-cancel {
        padding: 0.5rem 1rem;
        border: 1px solid #ccc;
        border-radius: 6px;
        background: #fff;
        cursor: pointer;
      }
      .btn-confirm {
        padding: 0.5rem 1rem;
        border-radius: 6px;
        border: none;
        background: #0066cc;
        color: #fff;
        cursor: pointer;
      }
      .btn-danger {
        background: #dc2626;
      }
    `,
  ],
})
export class ConfirmModalComponent {
  modalRef = inject(ModalRef);
  data: ConfirmModalData = (inject(MODAL_DATA, { optional: true }) as ConfirmModalData | null) ?? defaultConfirmData;

  cancel(): void {
    this.modalRef.close(false);
  }

  confirm(): void {
    this.modalRef.close(true);
  }
}
