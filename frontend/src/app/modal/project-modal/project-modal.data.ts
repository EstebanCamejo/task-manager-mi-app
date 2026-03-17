import type { ProjectStatus } from '../../services/projects.service';

export interface ProjectModalData {
  mode: 'create' | 'edit';
  initial?: {
    name: string;
    description?: string;
    status?: ProjectStatus;
  };
}

export interface ProjectModalResult {
  name: string;
  description: string;
  status?: ProjectStatus;
}
