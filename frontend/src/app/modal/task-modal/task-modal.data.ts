import type { Project } from '../../services/projects.service';
import type { TaskPriority, TaskStatus } from '../../services/tasks.service';

export interface TaskModalData {
  mode: 'create' | 'edit';
  projects: Project[];
  initial?: {
    id?: string;
    projectId: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
  };
}

export interface TaskModalResult {
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
}

