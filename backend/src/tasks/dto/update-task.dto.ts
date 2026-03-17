import { TaskStatus } from '../task-status.enum.js';

export class UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  /** 'urgente' | 'prioritario' | 'normal' */
  priority?: 'urgente' | 'prioritario' | 'normal';
}
