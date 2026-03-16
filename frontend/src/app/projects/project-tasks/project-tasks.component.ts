import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectsService, Project } from '../../services/projects.service';
import { TasksService, TaskWithCreator, TaskStatus } from '../../services/tasks.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-project-tasks',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './project-tasks.component.html',
  styleUrl: './project-tasks.component.scss',
})
export class ProjectTasksComponent implements OnInit {
  project: Project | null = null;
  tasks: TaskWithCreator[] = [];
  loading = true;
  tasksLoading = false;
  error = '';
  showCreateTaskForm = false;
  createForm: FormGroup;
  statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'Por hacer' },
    { value: 'in_progress', label: 'En progreso' },
    { value: 'done', label: 'Hecho' },
  ];

  constructor(
    private route: ActivatedRoute,
    private projectsService: ProjectsService,
    private tasksService: TasksService,
    private auth: AuthService,
    private fb: FormBuilder,
  ) {
    this.createForm = this.fb.nonNullable.group({
      title: ['', Validators.required],
      description: [''],
    });
  }

  get projectId(): string | null {
    return this.route.snapshot.paramMap.get('id');
  }

  get userName(): string {
    return this.auth.getCurrentUserName();
  }

  get isAdmin(): boolean {
    return this.auth.getCurrentUser()?.role === 'admin';
  }

  get currentUserId(): string | undefined {
    return this.auth.getCurrentUser()?.sub;
  }

  canDeleteTask(task: TaskWithCreator): boolean {
    return this.isAdmin || task.creatorId === this.currentUserId;
  }

  private loadInProgress = 0;

  ngOnInit(): void {
    this.route.paramMap.subscribe((paramMap) => {
      const id = paramMap.get('id');
      if (id) {
        this.loadData(id);
      } else {
        this.loading = false;
      }
    });
  }

  private loadData(id: string): void {
    this.loading = true;
    this.error = '';
    const loadId = ++this.loadInProgress;
    this.projectsService.getProject(id).subscribe({
      next: (p) => {
        if (loadId !== this.loadInProgress) return;
        this.project = p;
        this.loading = false;
        this.loadTasks(id, loadId);
      },
      error: () => {
        if (loadId !== this.loadInProgress) return;
        this.loading = false;
        this.error = 'Error al cargar el proyecto';
      },
    });
  }

  private loadTasks(projectId: string, loadId: number): void {
    this.tasksLoading = true;
    this.tasksService.getTasks(projectId).subscribe({
      next: (list) => {
        if (loadId !== this.loadInProgress) return;
        this.tasks = list;
        this.tasksLoading = false;
      },
      error: () => {
        if (loadId !== this.loadInProgress) return;
        this.tasksLoading = false;
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }

  onCreateTask(): void {
    const id = this.projectId;
    if (this.createForm.invalid || !id) return;
    this.error = '';
    const { title, description } = this.createForm.getRawValue();
    this.tasksService
      .createTask(id, title, description ?? '')
      .subscribe({
        next: () => {
          this.createForm.reset({ title: '', description: '' });
          this.showCreateTaskForm = false;
          if (id) this.loadTasks(id, ++this.loadInProgress);
        },
        error: (err) => {
          this.error = err?.error?.message ?? 'Error al crear la tarea';
        },
      });
  }

  onDelete(task: TaskWithCreator): void {
    if (!confirm('¿Eliminar esta tarea?')) return;
    this.error = '';
    this.tasksService.deleteTask(task.id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter((t) => t.id !== task.id);
      },
      error: (err) => {
        this.error =
          err?.error?.message ?? 'No tenés permiso para eliminar esta tarea';
      },
    });
  }

  statusLabel(status: TaskStatus): string {
    return this.statusOptions.find((o) => o.value === status)?.label ?? status;
  }

  /** Índice de color por creador (0-5) para distinguir visualmente tareas de distintos usuarios */
  creatorColorIndex(creatorName: string): number {
    let hash = 0;
    for (let i = 0; i < creatorName.length; i++) {
      hash = ((hash << 5) - hash) + creatorName.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 6;
  }
}
