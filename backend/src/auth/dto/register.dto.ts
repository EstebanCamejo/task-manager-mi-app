import { Role } from '../../users/role.enum.js';

export class RegisterDto {
  name: string;
  email: string;
  password: string;
  role?: Role;
}
