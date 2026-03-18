import { Injectable } from '@nestjs/common';

const RANDOM_USER_API = 'https://randomuser.me/api/';

@Injectable()
export class ExternalService {
  async getRandomUserProfile(): Promise<{ name: string; email: string }> {
    const fallback = {
      name: 'Usuario Rápido',
      email: `quick_${Date.now()}@example.com`,
    };
    try {
      const res = await fetch(RANDOM_USER_API);
      const data = (await res.json()) as {
        results?: Array<{ name?: { first?: string; last?: string }; email?: string }>;
      };
      const first = data.results?.[0];
      const firstName = first?.name?.first ?? '';
      const lastName = first?.name?.last ?? '';
      const name = `${firstName} ${lastName}`.trim() || fallback.name;
      const email = (first?.email ?? '').trim() || fallback.email;
      return { name, email };
    } catch {
      return fallback;
    }
  }

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
