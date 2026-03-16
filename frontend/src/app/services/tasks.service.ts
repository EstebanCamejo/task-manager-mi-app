import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

const API = 'http://localhost:3000';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  projectId: string;
  creatorId: string;
  assigneeName: string;
}

export type TaskWithCreator = Task & { creatorName: string };
export type TaskWithCreatorAndRole = TaskWithCreator & { creatorRole?: string };

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  private headers(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  /** Todas las tareas visibles para el usuario (admin: todas, user: las que creó) */
  getTasksForUser(): Observable<TaskWithCreatorAndRole[]> {
    return this.http.get<TaskWithCreatorAndRole[]>(`${API}/tasks`, {
      headers: this.headers(),
    });
  }

  getTasks(projectId: string): Observable<TaskWithCreator[]> {
    return this.http.get<TaskWithCreator[]>(
      `${API}/projects/${projectId}/tasks`,
      { headers: this.headers() },
    );
  }

  getTask(taskId: string): Observable<TaskWithCreator> {
    return this.http.get<TaskWithCreator>(`${API}/tasks/${taskId}`, {
      headers: this.headers(),
    });
  }

  createTask(
    projectId: string,
    title: string,
    description: string,
  ): Observable<Task> {
    return this.http.post<Task>(
      `${API}/projects/${projectId}/tasks`,
      { title, description },
      { headers: this.headers() },
    );
  }

  updateTask(
    taskId: string,
    data: { title: string; description: string; status?: TaskStatus },
  ): Observable<Task> {
    return this.http.patch<Task>(`${API}/tasks/${taskId}`, data, {
      headers: this.headers(),
    });
  }

  deleteTask(taskId: string): Observable<void> {
    return this.http.delete<void>(`${API}/tasks/${taskId}`, {
      headers: this.headers(),
    });
  }
}
