import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ExternalService } from '../external/external.service.js';
import { TaskStatus as PrismaTaskStatus } from '@prisma/client';
import { TaskStatus } from './task-status.enum.js';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'urgente' | 'prioritario' | 'normal';
  projectId: string;
  creatorId: string;
  assigneeName: string;
}

export type TaskWithCreator = Task & { creatorName: string };
export type TaskWithCreatorAndRole = Task & {
  creatorName: string;
  creatorRole: string;
};

const statusToPrisma: Record<TaskStatus, PrismaTaskStatus> = {
  [TaskStatus.Todo]: PrismaTaskStatus.todo,
  [TaskStatus.InProgress]: PrismaTaskStatus.in_progress,
  [TaskStatus.Done]: PrismaTaskStatus.done,
};

const statusFromPrisma = (s: string): TaskStatus => s as TaskStatus;

const priorityFromPrisma = (
  p: unknown,
): 'urgente' | 'prioritario' | 'normal' => {
  if (p === 'urgente' || p === 'prioritario' || p === 'normal') return p;
  return 'normal';
};

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly externalService: ExternalService,
  ) {}

  async create(
    projectId: string,
    creatorId: string,
    data: {
      title: string;
      description?: string;
      status?: TaskStatus;
      priority?: 'urgente' | 'prioritario' | 'normal';
    },
  ): Promise<Task> {
    const assigneeName = await this.externalService.getRandomAssigneeName();
    const task = await this.prisma.task.create({
      // Prisma Client types pueden quedar desincronizados en el editor;
      // la columna existe en BD y Prisma schema.
      data: {
        title: data.title,
        description: data.description ?? '',
        projectId,
        creatorId,
        assigneeName: assigneeName || null,
        status: statusToPrisma[data.status ?? TaskStatus.Todo],
        priority: data.priority ?? 'normal',
      } as any,
    });
    return this.toTask(task);
  }

  /** Todas las tareas que el usuario puede ver: admin y user ven todas */
  async findAllForUser(_userId: string, _role: string): Promise<TaskWithCreatorAndRole[]> {
    const list = await this.prisma.task.findMany({
      include: {
        creator: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((t) => ({
      ...this.toTask(t),
      creatorName: t.creator?.name ?? 'Desconocido',
      creatorRole: t.creator?.role ?? 'user',
    }));
  }

  async findAllByProject(projectId: string): Promise<TaskWithCreator[]> {
    const list = await this.prisma.task.findMany({
      where: { projectId },
      include: {
        creator: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((t) => ({
      ...this.toTask(t),
      creatorName: t.creator?.name ?? 'Desconocido',
    }));
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return this.toTask(task);
  }

  async findOneWithCreator(id: string): Promise<TaskWithCreator> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { creator: { select: { name: true } } },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return {
      ...this.toTask(task),
      creatorName: task.creator?.name ?? 'Desconocido',
    };
  }

  async update(
    id: string,
    _userId: string,
    _role: string,
    data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: 'urgente' | 'prioritario' | 'normal';
    },
  ): Promise<Task> {
    await this.findOne(id);
    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: statusToPrisma[data.status] }),
        ...(data.priority !== undefined && { priority: data.priority }),
      } as any,
    });
    return this.toTask(updated);
  }

  async updateStatus(
    id: string,
    status: TaskStatus,
    _userId: string,
    _role: string,
  ): Promise<Task> {
    await this.findOne(id);
    const updated = await this.prisma.task.update({
      where: { id },
      data: { status: statusToPrisma[status] },
    });
    return this.toTask(updated);
  }

  async remove(id: string, userId: string, role: string): Promise<void> {
    const task = await this.findOne(id);
    this.assertCanDelete(task, userId, role);
    await this.prisma.task.delete({
      where: { id },
    });
  }

  async removeByProjectId(projectId: string): Promise<void> {
    await this.prisma.task.deleteMany({
      where: { projectId },
    });
  }

  private toTask(row: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority?: unknown;
    projectId: string;
    creatorId: string;
    assigneeName: string | null;
  }): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: statusFromPrisma(row.status),
      priority: priorityFromPrisma(row.priority),
      projectId: row.projectId,
      creatorId: row.creatorId,
      assigneeName: row.assigneeName ?? '',
    };
  }

  private assertCanDelete(task: Task, userId: string, role: string): void {
    if (role === 'admin') return;
    if (task.creatorId === userId) return;
    throw new ForbiddenException('Solo podés eliminar tareas creadas por vos.');
  }
}
