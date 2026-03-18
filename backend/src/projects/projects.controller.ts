import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { ProjectsService } from './projects.service';
import { TasksService } from '../tasks/tasks.service.js';
import { CreateTaskDto } from '../tasks/dto/create-task.dto.js';
import { TaskStatus } from '../tasks/task-status.enum.js';

@Controller('projects')
@UseGuards(AuthGuard('jwt'))
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
  ) {}

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Post()
  create(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(userId, role, {
      name: dto.name,
      description: dto.description,
    });
  }

  @Get(':projectId/tasks')
  async getTasks(@Param('projectId') projectId: string) {
    await this.projectsService.findOne(projectId);
    return this.tasksService.findAllByProject(projectId);
  }

  @Post(':projectId/tasks')
  async createTask(
    @Param('projectId') projectId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: CreateTaskDto,
  ) {
    await this.projectsService.findOne(projectId);
    return this.tasksService.create(projectId, userId, role, {
      title: dto.title,
      description: dto.description,
      status: dto.status as TaskStatus | undefined,
      priority: dto.priority,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.projectsService.update(id, userId, role, {
      name: dto.name,
      description: dto.description,
      status: dto.status,
    });
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    await this.tasksService.removeByProjectId(id);
    await this.projectsService.remove(id, userId, role);
  }
}
