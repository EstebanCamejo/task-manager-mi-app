export class CreateTaskDto {
  title: string;
  description?: string;
  /** 'todo' | 'in_progress' | 'done' */
  status?: 'todo' | 'in_progress' | 'done';
  /** 'urgente' | 'prioritario' | 'normal' */
  priority?: 'urgente' | 'prioritario' | 'normal';
}
