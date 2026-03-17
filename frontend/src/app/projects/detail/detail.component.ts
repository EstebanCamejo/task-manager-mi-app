import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectsService, Project, ProjectStatus } from '../../services/projects.service';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../modal/modal.service';
import { ConfirmModalComponent } from '../../modal/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-detail',
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss',
})
export class DetailComponent implements OnInit {
  project: Project | null = null;
  loading = true;
  error = '';
  editingProject = false;
  editProjectForm: FormGroup;
  projectStatusOptions: { value: ProjectStatus; label: string }[] = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_proceso', label: 'En proceso' },
    { value: 'finalizado', label: 'Finalizado' },
  ];

  private modal = inject(ModalService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectsService: ProjectsService,
    private auth: AuthService,
    private fb: FormBuilder,
  ) {
    this.editProjectForm = this.fb.nonNullable.group({
      name: ['', Validators.required],
      description: [''],
    });
  }

  get projectId(): string | null {
    return this.route.snapshot.paramMap.get('id');
  }

  get userName(): string {
    return this.auth.getCurrentUserName();
  }

  ngOnInit(): void {
    const id = this.projectId;
    if (!id) {
      this.loading = false;
      return;
    }
    this.projectsService.getProject(id).subscribe({
      next: (p) => {
        this.project = p;
        this.selectedProjectStatus = p.status ?? 'pendiente';
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Error al cargar el proyecto';
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }

  startEditProject(): void {
    if (!this.project) return;
    this.editProjectForm.patchValue({
      name: this.project.name,
      description: this.project.description || '',
    });
    this.editingProject = true;
    this.error = '';
  }

  cancelEditProject(): void {
    this.editingProject = false;
  }

  onSaveProject(): void {
    if (this.editProjectForm.invalid || !this.projectId) return;
    this.error = '';
    const { name, description } = this.editProjectForm.getRawValue();
    this.projectsService
      .updateProject(this.projectId, name, description ?? '')
      .subscribe({
        next: (updated) => {
          this.project = updated;
          this.editingProject = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.error =
            err?.error?.message ??
            'No tenés permiso para editar este proyecto';
        },
      });
  }

  selectedProjectStatus: ProjectStatus = 'pendiente';

  onSaveProjectStatus(): void {
    if (!this.project) return;
    this.error = '';
    const projectId = this.project.id;
    this.projectsService
      .updateProject(
        projectId,
        this.project.name,
        this.project.description ?? '',
        this.selectedProjectStatus,
      )
      .subscribe({
        next: (updated) => {
          this.project = updated;
          this.router.navigateByUrl('/dashboard');
        },
        error: (err) => {
          this.error =
            err?.error?.message ??
            'No tenés permiso para cambiar el estado del proyecto';
        },
      });
  }

  onDeleteProject(): void {
    if (!this.project) return;
    this.modal
      .open(ConfirmModalComponent, {
        data: {
          title: 'Eliminar proyecto',
          message: `¿Eliminar el proyecto "${this.project.name}" y todas sus tareas?`,
          confirmText: 'Eliminar',
          cancelText: 'Cancelar',
          danger: true,
        },
      })
      .afterClosed.subscribe((confirmed) => {
        if (!confirmed) return;
        this.error = '';
        this.projectsService.deleteProject(this.project!.id).subscribe({
          next: () => this.router.navigate(['/dashboard']),
          error: (err) => {
            this.error =
              err?.error?.message ??
              'No tenés permiso para eliminar este proyecto';
          },
        });
      });
  }
}
