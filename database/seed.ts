// Blok Framework - Database Seeder
// Seeds the database with demo users for development

import { PrismaClient, Role } from './generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 12);
  const userPassword = await bcrypt.hash('user123', 12);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create regular user
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      passwordHash: userPassword,
      name: 'Demo User',
      role: Role.USER,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Create welcome notifications for both users
  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        type: 'SYSTEM',
        title: 'Welcome to Blok Framework!',
        message: 'Your admin account has been created successfully. You have full access to all features.',
        priority: 'HIGH',
        isRead: false,
        createdAt: new Date(),
      },
      {
        userId: user.id,
        type: 'INFO',
        title: 'Welcome to Blok Framework!',
        message: 'Your user account has been created successfully. Explore the features and enjoy!',
        priority: 'MEDIUM',
        isRead: false,
        createdAt: new Date(),
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('👤 Demo Credentials:');
  console.log('   Admin: admin@example.com / admin123');
  console.log('   User:  user@example.com / user123');
  console.log('');
  console.log('🚀 You can now run: npm run dev');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
