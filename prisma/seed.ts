import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { hash } from 'bcryptjs';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL || 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // ── Users ───────────────────────────────────────────────────────────────

  const citizenPassword = await hash('demo123', 10);
  const adminPassword = await hash('admin123', 10);

  const citizenUsers = [
    { nickName: 'maria_valencia', province: 'Valencia', residenceType: 'planta_baja', specialNeeds: JSON.stringify(['elderly', 'pets']) },
    { nickName: 'carlos_madrid', province: 'Madrid', residenceType: 'piso_alto', specialNeeds: JSON.stringify([]) },
    { nickName: 'ana_sevilla', province: 'Sevilla', residenceType: 'sotano', specialNeeds: JSON.stringify(['wheelchair', 'medical_equipment']) },
    { nickName: 'pedro_barcelona', province: 'Barcelona', residenceType: 'atico', specialNeeds: JSON.stringify(['children', 'pets']) },
    { nickName: 'lucia_alicante', province: 'Alicante', residenceType: 'casa_unifamiliar', specialNeeds: JSON.stringify(['elderly', 'hearing_impaired']) },
  ] as const;

  for (const u of citizenUsers) {
    await prisma.user.upsert({
      where: { nickName: u.nickName },
      update: {},
      create: { ...u, password: citizenPassword, role: 'citizen' },
    });
  }

  // Admin user (upsert to avoid duplicate errors on re-seed)
  await prisma.user.upsert({
    where: { nickName: 'admin' },
    update: {},
    create: {
      nickName: 'admin',
      password: adminPassword,
      role: 'backoffice',
      province: 'Madrid',
      residenceType: 'piso_alto',
      specialNeeds: '[]',
    },
  });

  console.log('  Users created');

  // ── Weather records (last 24 hours, one per hour) ───────────────────────

  const weatherRecords = [];
  const now = new Date();

  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3_600_000);
    const isStorm = i < 6; // last 6 hours = storm approaching

    weatherRecords.push({
      rawData: JSON.stringify({ source: 'seed' }),
      temperature: isStorm ? 12 + Math.random() * 3 : 22 + Math.random() * 5,
      humidity: isStorm ? 85 + Math.random() * 15 : 45 + Math.random() * 20,
      precipitation: isStorm ? 30 + Math.random() * 70 : Math.random() * 5,
      windSpeed: isStorm ? 60 + Math.random() * 40 : 10 + Math.random() * 20,
      pressure: isStorm ? 990 + Math.random() * 5 : 1013 + Math.random() * 5,
      riskScore: isStorm ? 65 + Math.random() * 30 : 10 + Math.random() * 20,
      isDisaster: isStorm && i < 3,
      recordedAt: time,
    });
  }

  await prisma.weatherRecord.createMany({ data: weatherRecords });
  console.log('  Weather records created (24 hours)');

  // ── Active alerts ───────────────────────────────────────────────────────

  await prisma.alert.createMany({
    data: [
      {
        severity: 4,
        type: 'flood',
        province: 'Valencia',
        title: 'Alerta por lluvias intensas',
        description:
          'Se esperan precipitaciones superiores a 100mm en las proximas 12 horas. Riesgo de inundaciones en zonas bajas.',
        isActive: true,
        autoDetected: true,
      },
      {
        severity: 3,
        type: 'wind_storm',
        province: 'Barcelona',
        title: 'Aviso por viento fuerte',
        description:
          'Rachas de viento de hasta 90 km/h previstas para la costa catalana.',
        isActive: true,
        autoDetected: false,
      },
      {
        severity: 2,
        type: 'cold_snap',
        province: 'Madrid',
        title: 'Descenso de temperaturas',
        description:
          'Temperaturas minimas de -2C previstas para la madrugada. Precaucion en desplazamientos.',
        isActive: true,
        autoDetected: true,
      },
    ],
  });

  console.log('  Alerts created');

  // ── Sample consultation ─────────────────────────────────────────────────

  const maria = await prisma.user.findUnique({
    where: { nickName: 'maria_valencia' },
  });

  if (maria) {
    await prisma.consultation.create({
      data: {
        userId: maria.id,
        systemPrompt: 'Eres un asesor de emergencias climaticas...',
        userPrompt:
          'Condiciones actuales: precipitacion 85mm, humedad 92%, temperatura 14C...',
        llmResponse:
          'ALERTA IMPORTANTE para su situacion especifica en Valencia...\n\n1. Como residente en planta baja, debe preparar una bolsa de emergencia...\n2. Sus mascotas necesitan un transportin preparado...\n3. Mantenga los documentos importantes en una bolsa impermeable...',
        weatherSnapshot: JSON.stringify({
          temperature: 14,
          precipitation: 85,
          humidity: 92,
          windSpeed: 45,
        }),
        riskScore: 78,
      },
    });

    console.log('  Sample consultation created');
  }

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
