import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectStatus as PrismaProjectStatus } from '@prisma/client';

export type ProjectStatus = 'pendiente' | 'en_proceso' | 'finalizado';

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  status: ProjectStatus;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    ownerId: string,
    role: string,
    data: { name: string; description?: string },
  ): Promise<Project> {
    if (role !== 'admin') {
      throw new ForbiddenException(
        'Solo los administradores pueden crear proyectos.',
      );
    }
    const project = await this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description ?? '',
        ownerId,
        status: PrismaProjectStatus.pendiente,
      },
    });
    return this.toProject(project);
  }

  async findAll(): Promise<Project[]> {
    const list = await this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return list.map((p) => this.toProject(p));
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return this.toProject(project);
  }

  async update(
    id: string,
    userId: string,
    role: string,
    data: { name?: string; description?: string; status?: ProjectStatus },
  ): Promise<Project> {
    const project = await this.findOne(id);
    this.assertCanModify(project, userId, role);
    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status as PrismaProjectStatus }),
      },
    });
    return this.toProject(updated);
  }

  async remove(id: string, userId: string, role: string): Promise<void> {
    const project = await this.findOne(id);
    this.assertCanModify(project, userId, role);
    await this.prisma.project.delete({
      where: { id },
    });
  }

  private toProject(row: { id: string; name: string; description: string; ownerId: string; status: string }): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      ownerId: row.ownerId,
      status: row.status as ProjectStatus,
    };
  }

  private assertCanModify(project: Project, userId: string, role: string): void {
    if (role === 'admin') return;
    if (project.ownerId === userId) return;
    throw new ForbiddenException(
      'Solo el dueño del proyecto o un admin puede modificarlo o eliminarlo',
    );
  }
}
