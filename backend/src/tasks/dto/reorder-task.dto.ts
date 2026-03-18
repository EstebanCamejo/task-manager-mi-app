import { TaskStatus } from '../task-status.enum.js';

export class ReorderTaskDto {
  status: TaskStatus;
  order: number;
}

