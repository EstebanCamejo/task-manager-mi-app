import { Injectable } from '@nestjs/common';

const RANDOM_USER_API = 'https://randomuser.me/api/';

@Injectable()
export class ExternalService {
  async getRandomAssigneeName(): Promise<string> {
    try {
      const res = await fetch(RANDOM_USER_API);
      const data = (await res.json()) as {
        results?: Array<{ name?: { first?: string; last?: string } }>;
      };
      const first = data.results?.[0];
      if (!first?.name) {
        return 'Sin asignar';
      }
      const { first: firstName = '', last: lastName = '' } = first.name;
      return `${firstName} ${lastName}`.trim() || 'Sin asignar';
    } catch {
      return 'Sin asignar';
    }
  }
}
