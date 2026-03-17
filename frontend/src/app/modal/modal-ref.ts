import { OverlayRef } from '@angular/cdk/overlay';
import { Subject } from 'rxjs';

export class ModalRef<T = unknown> {
  private afterClosedSubject = new Subject<T | null>();
  afterClosed = this.afterClosedSubject.asObservable();

  constructor(private overlayRef: OverlayRef) {}

  close(result?: T | null): void {
    this.overlayRef.detach();
    this.overlayRef.dispose();
    this.afterClosedSubject.next((result ?? null) as T | null);
    this.afterClosedSubject.complete();
  }
}
