export class UpdateProjectDto {
  name?: string;
  description?: string;
  status?: 'pendiente' | 'en_proceso' | 'finalizado';
}
