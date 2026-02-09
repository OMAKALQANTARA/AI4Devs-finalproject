import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'juan.delgado@example.com' },
    update: {},
    create: {
      email: 'juan.delgado@example.com',
      username: 'juandelgado',
      password_hash: passwordHash,
      display_name: 'Juan Delgado',
      presence_status: 'online',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'maria.garcia@example.com' },
    update: {},
    create: {
      email: 'maria.garcia@example.com',
      username: 'mariagarcia',
      password_hash: passwordHash,
      display_name: 'María García',
      presence_status: 'online',
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
      alias: 'Maria',
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
