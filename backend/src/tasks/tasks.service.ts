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

  private async getCreatorName(creatorId: string): Promise<string> {
    const user = await this.usersService.findById(creatorId);
    return user?.name ?? 'Desconocido';
  }

  private async getCreatorRole(creatorId: string): Promise<string> {
    const user = await this.usersService.findById(creatorId);
    return user?.role ?? 'user';
  }

  /** Todas las tareas que el usuario puede ver: admin y user ven todas */
  async findAllForUser(_userId: string, _role: string): Promise<TaskWithCreatorAndRole[]> {
    return Promise.all(
      this.tasks.map(async (t) => ({
        ...t,
        creatorName: await this.getCreatorName(t.creatorId),
        creatorRole: await this.getCreatorRole(t.creatorId),
      })),
    );
  }

  async findAllByProject(projectId: string): Promise<TaskWithCreator[]> {
    const filtered = this.tasks.filter((t) => t.projectId === projectId);
    return Promise.all(
      filtered.map(async (t) => ({
        ...t,
        creatorName: await this.getCreatorName(t.creatorId),
      })),
    );
  }

  findOne(id: string): Task {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async findOneWithCreator(id: string): Promise<TaskWithCreator> {
    const task = this.findOne(id);
    const creatorName = await this.getCreatorName(task.creatorId);
    return { ...task, creatorName };
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
