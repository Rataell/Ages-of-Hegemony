import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaGameRepository } from './prisma-repository.js';

export function connectDatabase(connectionString: string) {
  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  return { repository: new PrismaGameRepository(client), close: () => client.$disconnect() };
}
