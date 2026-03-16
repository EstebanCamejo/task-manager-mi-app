import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectsService, Project, ProjectStatus } from '../../services/projects.service';
import { TasksService, TaskWithCreatorAndRole, TaskStatus } from '../../services/tasks.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  projects: Project[] = [];
  tasks: TaskWithCreatorAndRole[] = [];
  form: FormGroup;
  createTaskForm: FormGroup;
  editTaskForm: FormGroup;
  loading = true;
  tasksLoading = true;
  error = '';
  showCreateForm = false;
  showCreateTaskForm = false;
  filterByCreator = '';
  filterByRole = '';
  filterByProject = '';
  editingTaskId: string | null = null;

  constructor(
    private projectsService: ProjectsService,
    private tasksService: TasksService,
    private auth: AuthService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.nonNullable.group({
      name: ['', Validators.required],
      description: [''],
    });
    this.createTaskForm = this.fb.nonNullable.group({
      projectId: ['', Validators.required],
      title: ['', Validators.required],
      description: [''],
    });
    this.editTaskForm = this.fb.nonNullable.group({
      title: ['', Validators.required],
      description: [''],
      status: ['todo' as TaskStatus],
    });
  }

  ngOnInit(): void {
    this.projectsService.getProjects().subscribe({
      next: (list) => {
        this.projects = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Error al cargar proyectos';
      },
    });
    this.tasksService.getTasksForUser().subscribe({
      next: (list) => {
        this.tasks = list;
        this.tasksLoading = false;
      },
      error: () => {
        this.tasksLoading = false;
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.error = '';
    const { name, description } = this.form.getRawValue();
    this.projectsService.createProject(name, description ?? '').subscribe({
      next: (project) => {
        this.projects = [...this.projects, project];
        this.form.reset({ name: '', description: '' });
        this.showCreateForm = false;
      },
      error: (err) => {
        this.error =
          err?.error?.message ??
          'No tenés permiso para crear un proyecto o hubo un error.';
      },
    });
  }

  get userName(): string {
    return this.auth.getCurrentUserName();
  }

  projectStatusLabel(status?: ProjectStatus): string {
    const labels: Record<ProjectStatus, string> = {
      pendiente: 'Pendiente',
      en_proceso: 'En proceso',
      finalizado: 'Finalizado',
    };
    return labels[status ?? 'pendiente'] ?? status ?? 'Pendiente';
  }

  get filteredTasks(): TaskWithCreatorAndRole[] {
    return this.tasks.filter((t) => {
      if (this.filterByProject && t.projectId !== this.filterByProject) return false;
      if (this.filterByCreator && (t.creatorName || '') !== this.filterByCreator) return false;
      if (this.filterByRole && (t.creatorRole || 'user') !== this.filterByRole) return false;
      return true;
    });
  }

  getProjectName(projectId: string): string {
    const p = this.projects.find((proj) => proj.id === projectId);
    return p?.name ?? projectId;
  }

  get uniqueCreatorNames(): string[] {
    const set = new Set(this.tasks.map((t) => t.creatorName || 'Desconocido').filter(Boolean));
    return Array.from(set).sort();
  }

  taskStatusLabel(status: TaskStatus): string {
    const labels: Record<TaskStatus, string> = {
      todo: 'Por hacer',
      in_progress: 'En progreso',
      done: 'Hecho',
    };
    return labels[status] ?? status;
  }

  get isAdmin(): boolean {
    return this.auth.getCurrentUser()?.role === 'admin';
  }

  get currentUserId(): string | undefined {
    return this.auth.getCurrentUser()?.sub;
  }

  canDeleteTask(task: TaskWithCreatorAndRole): boolean {
    return this.isAdmin || task.creatorId === this.currentUserId;
  }

  /** Cualquier usuario puede editar cualquier tarea (título, descripción, estado). */
  canModifyTask(_task: TaskWithCreatorAndRole): boolean {
    return true;
  }

  creatorColorIndex(creatorName: string): number {
    let hash = 0;
    const name = creatorName || '';
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 6;
  }

  onDelete(p: Project): void {
    if (!confirm('¿Eliminar el proyecto "' + p.name + '"?')) return;
    this.error = '';
    this.projectsService.deleteProject(p.id).subscribe({
      next: () => {
        this.projects = this.projects.filter((proj) => proj.id !== p.id);
      },
      error: () => {
        this.error = 'No tenés permiso para eliminar este proyecto.';
      },
    });
  }

  onDeleteTask(task: TaskWithCreatorAndRole): void {
    if (!confirm('¿Eliminar esta tarea?')) return;
    this.error = '';
    this.tasksService.deleteTask(task.id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter((t) => t.id !== task.id);
      },
      error: () => {
        this.error = 'No tenés permiso para eliminar esta tarea. Solo podés eliminar tareas creadas por vos.';
      },
    });
  }

  toggleCreateTaskForm(): void {
    this.showCreateTaskForm = !this.showCreateTaskForm;
    this.error = '';
    if (this.showCreateTaskForm && this.projects.length > 0) {
      this.createTaskForm.patchValue({
        projectId: this.projects[0].id,
        title: '',
        description: '',
      });
    }
  }

  onCreateTask(): void {
    if (this.createTaskForm.invalid) return;
    this.error = '';
    const { projectId, title, description } = this.createTaskForm.getRawValue();
    this.tasksService.createTask(projectId, title, description ?? '').subscribe({
      next: () => {
        this.createTaskForm.patchValue({
          projectId: this.projects[0]?.id ?? '',
          title: '',
          description: '',
        });
        this.showCreateTaskForm = false;
        this.loadTasks();
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Error al crear la tarea.';
      },
    });
  }

  loadTasks(): void {
    this.tasksService.getTasksForUser().subscribe({
      next: (list) => (this.tasks = list),
      error: () => {},
    });
  }

  startEditTask(task: TaskWithCreatorAndRole): void {
    this.editingTaskId = task.id;
    this.error = '';
    this.editTaskForm.patchValue({
      title: task.title,
      description: task.description ?? '',
      status: task.status,
    });
  }

  cancelEditTask(): void {
    this.editingTaskId = null;
  }

  onSaveEditTask(): void {
    if (!this.editingTaskId || this.editTaskForm.invalid) return;
    this.error = '';
    const { title, description, status } = this.editTaskForm.getRawValue();
    this.tasksService
      .updateTask(this.editingTaskId, { title, description: description ?? '', status })
      .subscribe({
        next: () => {
          this.loadTasks();
          this.editingTaskId = null;
        },
        error: () => {
          this.error = 'No tenés permiso para editar esta tarea. Solo podés editar tareas creadas por vos.';
        },
      });
  }
}
