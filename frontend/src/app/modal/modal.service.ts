import { Injectable, Injector, inject, Type } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ModalRef } from './modal-ref';
import { MODAL_DATA } from './modal-tokens';

export interface ModalOptions<T = unknown> {
  data?: T;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private overlay = inject(Overlay);
  private injector = inject(Injector);

  open<TResult = unknown, TData = unknown>(
    component: Type<unknown>,
    options?: ModalOptions<TData>,
  ): ModalRef<TResult> {
    const overlayRef = this.overlay.create({
      hasBackdrop: true,
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
    });

    const modalRef = new ModalRef<TResult>(overlayRef);
    const injector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: ModalRef, useValue: modalRef },
        ...(options?.data !== undefined ? [{ provide: MODAL_DATA, useValue: options.data }] : []),
      ],
    });

    const portal = new ComponentPortal(component as never, null, injector);
    overlayRef.attach(portal);

    overlayRef.backdropClick().subscribe(() => modalRef.close());

    return modalRef;
  }
}
