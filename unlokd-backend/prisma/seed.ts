import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'omar.alcantara@example.com' },
    update: {},
    create: {
      email: 'omar.alcantara@example.com',
      username: 'omaralcantara',
      password_hash: passwordHash,
      display_name: 'Omar Alcantara',
      presence_status: 'En Linea',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jessica.estrella@example.com' },
    update: {},
    create: {
      email: 'jessica.estrella@example.com',
      username: 'jessicasterrella',
      password_hash: passwordHash,
      display_name: 'Jessica Estrella',
      presence_status: 'En Linea',
    },
  });

  await prisma.contact.upsert({
    where: {
      owner_user_id_contact_user_id: {
        owner_user_id: user1.id,
        contact_user_id: user2.id,
      },
    },
    update: {},
    create: {
      owner_user_id: user1.id,
      contact_user_id: user2.id,
      alias: 'Jessica',
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
