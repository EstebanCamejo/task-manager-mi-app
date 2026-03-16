import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

const API = 'http://localhost:3000';

export type ProjectStatus = 'pendiente' | 'en_proceso' | 'finalizado';

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  status?: ProjectStatus;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
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

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${API}/projects`, {
      headers: this.headers(),
    });
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${API}/projects/${id}`, {
      headers: this.headers(),
    });
  }

  createProject(name: string, description: string): Observable<Project> {
    return this.http.post<Project>(
      `${API}/projects`,
      { name, description },
      { headers: this.headers() },
    );
  }

  updateProject(
    id: string,
    name: string,
    description: string,
    status?: ProjectStatus,
  ): Observable<Project> {
    const body: { name: string; description: string; status?: ProjectStatus } = {
      name,
      description,
    };
    if (status !== undefined) body.status = status;
    return this.http.patch<Project>(`${API}/projects/${id}`, body, {
      headers: this.headers(),
    });
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/projects/${id}`, {
      headers: this.headers(),
    });
  }
}
