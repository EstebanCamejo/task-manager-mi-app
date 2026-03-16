import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { TaskStatus } from './task-status.enum.js';
import { ExternalService } from '../external/external.service.js';
import { UsersService } from '../users/users.service.js';

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
export type TaskWithCreatorAndRole = Task & { creatorName: string; creatorRole: string };

@Injectable()
export class TasksService {
  private tasks: Task[] = [];

  constructor(
    private readonly externalService: ExternalService,
    private readonly usersService: UsersService,
  ) {}

  async create(
    projectId: string,
    creatorId: string,
    data: { title: string; description?: string },
  ): Promise<Task> {
    const assigneeName = await this.externalService.getRandomAssigneeName();
    const task: Task = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description ?? '',
      status: TaskStatus.Todo,
      projectId,
      creatorId,
      assigneeName,
    };
    this.tasks.push(task);
    return task;
  }

  private getCreatorName(creatorId: string): string {
    const user = this.usersService.findById(creatorId);
    return user?.name ?? 'Desconocido';
  }

  private getCreatorRole(creatorId: string): string {
    const user = this.usersService.findById(creatorId);
    return user?.role ?? 'user';
  }

  /** Todas las tareas que el usuario puede ver: admin y user ven todas */
  findAllForUser(_userId: string, _role: string): TaskWithCreatorAndRole[] {
    return this.tasks.map((t) => ({
      ...t,
      creatorName: this.getCreatorName(t.creatorId),
      creatorRole: this.getCreatorRole(t.creatorId),
    }));
  }

  findAllByProject(projectId: string): TaskWithCreator[] {
    return this.tasks
      .filter((t) => t.projectId === projectId)
      .map((t) => ({ ...t, creatorName: this.getCreatorName(t.creatorId) }));
  }

  findOne(id: string): Task {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  findOneWithCreator(id: string): TaskWithCreator {
    const task = this.findOne(id);
    return { ...task, creatorName: this.getCreatorName(task.creatorId) };
  }

  update(
    id: string,
    _userId: string,
    _role: string,
    data: { title?: string; description?: string; status?: TaskStatus },
  ): Task {
    const task = this.findOne(id);
    if (data.title !== undefined) task.title = data.title;
    if (data.description !== undefined) task.description = data.description;
    if (data.status !== undefined) task.status = data.status;
    return task;
  }

  updateStatus(id: string, status: TaskStatus, _userId: string, _role: string): Task {
    const task = this.findOne(id);
    task.status = status;
    return task;
  }

  remove(id: string, userId: string, role: string): void {
    const task = this.findOne(id);
    this.assertCanDelete(task, userId, role);
    this.tasks = this.tasks.filter((t) => t.id !== id);
  }

  removeByProjectId(projectId: string): void {
    this.tasks = this.tasks.filter((t) => t.projectId !== projectId);
  }

  private assertCanDelete(task: Task, userId: string, role: string): void {
    if (role === 'admin') return;
    if (task.creatorId === userId) return;
    throw new ForbiddenException('You can only delete your own tasks');
  }
}
