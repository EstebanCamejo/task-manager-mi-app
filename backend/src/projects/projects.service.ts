import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

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
  private projects: Project[] = [];

  create(
    ownerId: string,
    role: string,
    data: { name: string; description?: string },
  ): Project {
    if (role !== 'admin') {
      throw new ForbiddenException(
        'Solo los administradores pueden crear proyectos.',
      );
    }
    const project: Project = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description ?? '',
      ownerId,
      status: 'pendiente',
    };
    this.projects.push(project);
    return project;
  }

  findAll(): Project[] {
    this.projects.forEach((p) => {
      if (!p.status) p.status = 'pendiente';
    });
    return this.projects;
  }

  findOne(id: string): Project {
    const project = this.projects.find((p) => p.id === id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (!project.status) project.status = 'pendiente';
    return project;
  }

  update(
    id: string,
    userId: string,
    role: string,
    data: { name?: string; description?: string; status?: ProjectStatus },
  ): Project {
    const project = this.findOne(id);
    this.assertCanModify(project, userId, role);
    if (data.name !== undefined) project.name = data.name;
    if (data.description !== undefined) project.description = data.description;
    if (data.status !== undefined) project.status = data.status;
    return project;
  }

  remove(id: string, userId: string, role: string): void {
    const project = this.findOne(id);
    this.assertCanModify(project, userId, role);
    this.projects = this.projects.filter((p) => p.id !== id);
  }

  private assertCanModify(project: Project, userId: string, role: string): void {
    if (role === 'admin') return;
    if (project.ownerId === userId) return;
    throw new ForbiddenException(
      'Solo el dueño del proyecto o un admin puede modificarlo o eliminarlo',
    );
  }
}
