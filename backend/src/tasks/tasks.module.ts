import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ExternalModule } from '../external/external.module';
import { UsersModule } from '../users/users.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [AuthModule, ExternalModule, UsersModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
