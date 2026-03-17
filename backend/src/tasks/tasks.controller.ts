import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { TasksService } from './tasks.service';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.tasksService.findAllForUser(userId, role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOneWithCreator(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.tasksService.update(id, userId, role, {
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
    });
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.tasksService.updateStatus(id, dto.status, userId, role);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    this.tasksService.remove(id, userId, role);
  }
}
