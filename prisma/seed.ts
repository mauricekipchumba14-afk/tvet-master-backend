import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Creates one sample institution with a full academic tree, an admin,
// a trainer, and a student — enough to log in and see real data on
// first run, since /auth/register requires an institutionId that
// must already exist.
async function main() {
  const institution = await prisma.institution.create({
    data: { name: 'Rift Valley National Polytechnic', subdomain: 'rvnp', status: 'active' },
  });

  const department = await prisma.department.create({
    data: { institutionId: institution.id, name: 'Electrical & Electronic Engineering', code: 'EEE' },
  });

  const course = await prisma.course.create({
    data: { departmentId: department.id, name: 'Diploma in Electrical & Electronic Engineering', level: 'diploma', durationYears: 3 },
  });

  const unit = await prisma.unit.create({
    data: { courseId: course.id, unitCode: 'ENG/CU/ET/CR/01/6/A', unitName: 'Electrical Machines', semester: 1, creditHours: 3 },
  });

  const intake = await prisma.intake.create({
    data: { institutionId: institution.id, name: 'September 2026', startDate: new Date('2026-09-01'), endDate: new Date('2027-08-31') },
  });

  const klass = await prisma.class.create({
    data: { courseId: course.id, intakeId: intake.id, name: 'EEE 2A', yearOfStudy: 2 },
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      institutionId: institution.id, role: 'institution_admin', fullName: 'Grace Njeri',
      email: 'admin@rvnp.ac.ke', passwordHash,
    },
  });

  const trainer = await prisma.user.create({
    data: {
      institutionId: institution.id, role: 'trainer', fullName: 'Mr. Kiptoo',
      email: 'trainer@rvnp.ac.ke', passwordHash,
    },
  });
  await prisma.trainerProfile.create({ data: { userId: trainer.id, departmentId: department.id } });
  await prisma.unitAssignment.create({ data: { unitId: unit.id, classId: klass.id, trainerId: trainer.id } });

  const student = await prisma.user.create({
    data: {
      institutionId: institution.id, role: 'student', fullName: 'Brian Otieno',
      email: 'student@rvnp.ac.ke', passwordHash,
    },
  });
  await prisma.studentProfile.create({
    data: { userId: student.id, admissionNumber: 'EEE/2024/00231', classId: klass.id },
  });

  const assessment = await prisma.assessment.create({
    data: {
      unitId: unit.id, classId: klass.id, trainerId: trainer.id, type: 'cat',
      title: 'CAT 1', maxScore: 30, weightPercent: 30, date: new Date(),
    },
  });
  await prisma.mark.create({
    data: { assessmentId: assessment.id, studentId: student.id, score: 26, enteredById: trainer.id },
  });

  console.log('Seed complete. Login with:');
  console.log('  admin@rvnp.ac.ke / password123 (institution_admin)');
  console.log('  trainer@rvnp.ac.ke / password123 (trainer)');
  console.log('  student@rvnp.ac.ke / password123 (student)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
