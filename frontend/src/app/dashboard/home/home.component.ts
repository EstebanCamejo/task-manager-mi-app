import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectsService, Project, ProjectStatus } from '../../services/projects.service';
import { TasksService, TaskWithCreatorAndRole, TaskPriority, TaskStatus } from '../../services/tasks.service';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../modal/modal.service';
import { ConfirmModalComponent } from '../../modal/confirm-modal/confirm-modal.component';
import { ProjectModalComponent } from '../../modal/project-modal/project-modal.component';
import type { ProjectModalResult } from '../../modal/project-modal/project-modal.data';
import { TaskModalComponent } from '../../modal/task-modal/task-modal.component';
import type { TaskModalResult } from '../../modal/task-modal/task-modal.data';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { CleanupFn, DropTargetRecord } from '@atlaskit/pragmatic-drag-and-drop/types';
import { TaskCardDndDirective } from '../../dnd/task-card-dnd.directive';
import { TaskColumnDndDirective } from '../../dnd/task-column-dnd.directive';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-home',
  imports: [FormsModule, TaskCardDndDirective, TaskColumnDndDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  projects: Project[] = [];
  tasks: TaskWithCreatorAndRole[] = [];
  loading = true;
  tasksLoading = true;
  error = '';
  showProjects = false;
  filterByCreator = '';
  filterByRole = '';
  filterByProject = '';

  private modal = inject(ModalService);
  private theme = inject(ThemeService);
  private monitorCleanup: CleanupFn | null = null;

  constructor(
    private projectsService: ProjectsService,
    private tasksService: TasksService,
    private auth: AuthService,
  ) {
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

    this.monitorCleanup = monitorForElements({
      canMonitor: ({ source }) => (source.data as any)?.kind === 'task',
      onDrop: ({ source, location }) => {
        const sourceData = source.data as any;
        const taskId = sourceData?.taskId as string | undefined;
        const fromStatus = sourceData?.fromStatus as TaskStatus | undefined;
        const fromOrder = sourceData?.fromOrder as number | undefined;
        if (!taskId || !fromStatus) return;

        const dropTarget = location.current.dropTargets.find(
          (t: DropTargetRecord) => (t.data as any)?.kind === 'task-column',
        );
        const toStatus = (dropTarget?.data as any)?.status as TaskStatus | undefined;
        if (!toStatus) return;
        const columnElement = dropTarget?.element as HTMLElement | undefined;
        const toOrder = columnElement
          ? this.getDropIndexInColumn({ columnElement, clientY: location.current.input.clientY })
          : (fromOrder ?? 1);

        const task = this.tasks.find((t) => t.id === taskId);
        if (!task) return;
        if (!this.canModifyTask(task)) {
          this.modal.open(ConfirmModalComponent, {
            data: {
              title: 'Sin permiso',
              message: 'No tenés permiso para mover esta tarea.',
              confirmText: 'Entendido',
              hideCancel: true,
            },
          });
          return;
        }

        const prevStatus = task.status;
        const prevOrder = task.order ?? 0;
        task.status = toStatus;
        task.order = toOrder;

        this.tasksService.reorderTask(taskId, toStatus, toOrder).subscribe({
          next: () => {
            this.loadTasks();
          },
          error: () => {
            task.status = prevStatus;
            task.order = prevOrder;
            this.error = 'No se pudo mover la tarea. Intentá de nuevo.';
          },
        });
      },
    });
  }

  ngOnDestroy(): void {
    this.monitorCleanup?.();
    this.monitorCleanup = null;
  }

  logout(): void {
    this.auth.logout();
  }

  toggleProjects(): void {
    this.showProjects = !this.showProjects;
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  openCreateProject(): void {
    this.error = '';
    this.modal
      .open<ProjectModalResult, { mode: 'create' }>(ProjectModalComponent, {
        data: { mode: 'create' },
      })
      .afterClosed.subscribe((result) => {
        if (!result) return;
        this.projectsService.createProject(result.name, result.description).subscribe({
          next: (project) => {
            this.projects = [...this.projects, project];
          },
          error: (err) => {
            this.error =
              err?.error?.message ??
              'No tenés permiso para crear un proyecto o hubo un error.';
          },
        });
      });
  }

  openEditProject(project: Project): void {
    this.error = '';
    this.modal
      .open<ProjectModalResult, any>(ProjectModalComponent, {
        data: {
          mode: 'edit',
          initial: {
            name: project.name,
            description: project.description,
            status: project.status,
          },
        },
      })
      .afterClosed.subscribe((result) => {
        if (!result) return;
        this.projectsService
          .updateProject(project.id, result.name, result.description, project.status)
          .subscribe({
            next: (updated) => {
              this.projects = this.projects.map((p) => (p.id === project.id ? updated : p));
            },
            error: (err) => {
              this.error =
                err?.error?.message ??
                'No tenés permiso para editar este proyecto o hubo un error.';
            },
          });
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

  taskPriorityLabel(priority: TaskPriority): string {
    const labels: Record<TaskPriority, string> = {
      urgente: 'Urgente',
      prioritario: 'Prioritario',
      normal: 'Normal',
    };
    return labels[priority] ?? priority;
  }

  tasksByStatus(status: TaskStatus): TaskWithCreatorAndRole[] {
    return this.filteredTasks
      .filter((t) => t.status === status)
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  private getDropIndexInColumn(args: { columnElement: HTMLElement; clientY: number }): number {
    const cards = Array.from(args.columnElement.querySelectorAll('.card')) as HTMLElement[];
    if (cards.length === 0) return 1;
    const idx = cards.findIndex((el) => {
      const rect = el.getBoundingClientRect();
      return args.clientY < rect.top + rect.height / 2;
    });
    return idx === -1 ? cards.length + 1 : idx + 1;
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

  canModifyTask(task: TaskWithCreatorAndRole): boolean {
    return this.isAdmin || task.creatorId === this.currentUserId;
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
    this.modal
      .open(ConfirmModalComponent, {
        data: {
          title: 'Eliminar proyecto',
          message: `¿Eliminar el proyecto "${p.name}"?`,
          confirmText: 'Eliminar',
          cancelText: 'Cancelar',
          danger: true,
        },
      })
      .afterClosed.subscribe((confirmed) => {
        if (!confirmed) return;
        this.error = '';
        this.projectsService.deleteProject(p.id).subscribe({
          next: () => {
            this.projects = this.projects.filter((proj) => proj.id !== p.id);
          },
          error: () => {
            this.error = 'No tenés permiso para eliminar este proyecto.';
          },
        });
      });
  }

  onDeleteTask(task: TaskWithCreatorAndRole): void {
    this.modal
      .open(ConfirmModalComponent, {
        data: {
          title: 'Eliminar tarea',
          message: '¿Eliminar esta tarea?',
          confirmText: 'Eliminar',
          cancelText: 'Cancelar',
          danger: true,
        },
      })
      .afterClosed.subscribe((confirmed) => {
        if (!confirmed) return;
        this.error = '';
        this.tasksService.deleteTask(task.id).subscribe({
          next: () => {
            this.tasks = this.tasks.filter((t) => t.id !== task.id);
          },
          error: () => {
            this.error = 'No tenés permiso para eliminar esta tarea. Solo podés eliminar tareas creadas por vos.';
          },
        });
      });
  }

  openCreateTaskInStatus(status: TaskStatus): void {
    if (this.projects.length === 0) {
      this.error = 'No hay proyectos para asignar. Un administrador debe crear uno.';
      return;
    }
    this.error = '';
    this.modal
      .open<TaskModalResult, any>(TaskModalComponent, {
        data: {
          mode: 'create',
          projects: this.projects,
          initial: {
            projectId: this.filterByProject || this.projects[0]?.id || '',
            title: '',
            description: '',
            status,
            priority: 'normal',
          },
        },
      })
      .afterClosed.subscribe((result) => {
        if (!result) return;
        this.tasksService
          .createTask(result.projectId, result.title, result.description, result.status, result.priority)
          .subscribe({
            next: () => this.loadTasks(),
            error: (err) => {
              this.error = err?.error?.message ?? 'Error al crear la tarea.';
            },
          });
      });
  }

  loadTasks(): void {
    this.tasksService.getTasksForUser().subscribe({
      next: (list) => (this.tasks = list),
      error: () => {},
    });
  }

  startEditTask(task: TaskWithCreatorAndRole): void {
    if (this.projects.length === 0) return;
    if (!this.canModifyTask(task)) {
      this.error = 'No tenés permiso para editar esta tarea.';
      return;
    }
    this.error = '';
    this.modal
      .open<TaskModalResult, any>(TaskModalComponent, {
        data: {
          mode: 'edit',
          projects: this.projects,
          initial: {
            id: task.id,
            projectId: task.projectId,
            title: task.title,
            description: task.description ?? '',
            status: task.status,
            priority: task.priority,
          },
        },
      })
      .afterClosed.subscribe((result) => {
        if (!result) return;
        this.tasksService
          .updateTask(task.id, {
            title: result.title,
            description: result.description,
            status: result.status,
            priority: result.priority,
          })
          .subscribe({
            next: () => this.loadTasks(),
            error: (err) => {
              this.error =
                err?.error?.message ??
                'No se pudo editar la tarea. Intentá de nuevo.';
            },
          });
      });
  }
}
