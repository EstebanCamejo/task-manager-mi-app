import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HomeComponent } from './dashboard/home/home.component';
import { DetailComponent as ProjectDetailComponent } from './projects/detail/detail.component';
import { ProjectTasksComponent } from './projects/project-tasks/project-tasks.component';
import { TaskEditComponent } from './projects/task-edit/task-edit.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: 'dashboard', component: HomeComponent, canActivate: [authGuard] },
  {
    path: 'dashboard/projects/:projectId/tasks/:taskId',
    component: TaskEditComponent,
    canActivate: [authGuard],
  },
  {
    path: 'dashboard/projects/:id/tasks',
    component: ProjectTasksComponent,
    canActivate: [authGuard],
  },
  { path: 'dashboard/projects/:id', component: ProjectDetailComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' },
];
