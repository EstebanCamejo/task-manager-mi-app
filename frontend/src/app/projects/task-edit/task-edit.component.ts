import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TasksService, TaskWithCreator, TaskStatus } from '../../services/tasks.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-task-edit',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './task-edit.component.html',
  styleUrl: './task-edit.component.scss',
})
export class TaskEditComponent implements OnInit {
  task: TaskWithCreator | null = null;
  form: FormGroup;
  loading = true;
  error = '';
  statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'Por hacer' },
    { value: 'in_progress', label: 'En progreso' },
    { value: 'done', label: 'Hecho' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tasksService: TasksService,
    private auth: AuthService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.nonNullable.group({
      title: ['', Validators.required],
      description: [''],
      status: ['todo' as TaskStatus],
    });
  }

  get projectId(): string | null {
    return this.route.snapshot.paramMap.get('projectId');
  }

  get taskId(): string | null {
    return this.route.snapshot.paramMap.get('taskId');
  }

  get userName(): string {
    return this.auth.getCurrentUserName();
  }

  ngOnInit(): void {
    const tid = this.taskId;
    if (!tid) {
      this.loading = false;
      return;
    }
    this.tasksService.getTask(tid).subscribe({
      next: (t) => {
        this.task = t;
        this.form.patchValue({
          title: t.title,
          description: t.description ?? '',
          status: t.status,
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo cargar la tarea';
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }

  onSave(): void {
    if (this.form.invalid || !this.taskId || !this.projectId) return;
    this.error = '';
    const { title, description, status } = this.form.getRawValue();
    this.tasksService
      .updateTask(this.taskId, { title, description: description ?? '', status })
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/dashboard');
        },
        error: (err) => {
          this.error =
            err?.error?.message ?? 'No tenés permiso para editar esta tarea';
        },
      });
  }
}
