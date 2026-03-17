import { PrismaClient } from '@/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';

const adapter = new PrismaLibSql({ url: dbUrl });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbInitialized: boolean | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

async function initializeDatabase() {
  if (globalForPrisma.dbInitialized) return;

  const client = createClient({ url: dbUrl });

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "nickName" TEXT NOT NULL UNIQUE,
      "password" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'citizen',
      "province" TEXT NOT NULL,
      "residenceType" TEXT NOT NULL,
      "specialNeeds" TEXT NOT NULL DEFAULT '[]',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "WeatherRecord" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "rawData" TEXT NOT NULL,
      "temperature" REAL NOT NULL,
      "humidity" REAL NOT NULL,
      "precipitation" REAL NOT NULL,
      "windSpeed" REAL,
      "pressure" REAL,
      "riskScore" REAL,
      "analysis" TEXT,
      "isDisaster" INTEGER NOT NULL DEFAULT 0,
      "recordedAt" DATETIME NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Alert" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "severity" INTEGER NOT NULL,
      "type" TEXT NOT NULL,
      "province" TEXT,
      "municipality" TEXT,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "weatherData" TEXT,
      "isActive" INTEGER NOT NULL DEFAULT 1,
      "autoDetected" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Consultation" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "userId" INTEGER NOT NULL,
      "systemPrompt" TEXT NOT NULL,
      "userPrompt" TEXT NOT NULL,
      "llmResponse" TEXT NOT NULL,
      "weatherSnapshot" TEXT,
      "riskScore" REAL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "User"("id")
    );
  `);

  const result = await client.execute('SELECT COUNT(*) as count FROM "User"');
  const count = Number(result.rows[0]?.count ?? 0);

  if (count === 0) {
    const bcrypt = await import('bcryptjs');
    const citizenHash = await bcrypt.hash('demo123', 10);
    const adminHash = await bcrypt.hash('admin123', 10);

    await client.executeMultiple(`
      INSERT INTO "User" ("nickName","password","role","province","residenceType","specialNeeds","updatedAt")
      VALUES ('admin','${adminHash}','backoffice','Madrid','piso_alto','[]',datetime('now'));

      INSERT INTO "User" ("nickName","password","role","province","residenceType","specialNeeds","updatedAt")
      VALUES ('maria_valencia','${citizenHash}','citizen','Valencia','planta_baja','["elderly","pets"]',datetime('now'));

      INSERT INTO "User" ("nickName","password","role","province","residenceType","specialNeeds","updatedAt")
      VALUES ('carlos_madrid','${citizenHash}','citizen','Madrid','piso_alto','[]',datetime('now'));

      INSERT INTO "User" ("nickName","password","role","province","residenceType","specialNeeds","updatedAt")
      VALUES ('ana_sevilla','${citizenHash}','citizen','Sevilla','sotano','["wheelchair","medical_equipment"]',datetime('now'));

      INSERT INTO "User" ("nickName","password","role","province","residenceType","specialNeeds","updatedAt")
      VALUES ('pedro_barcelona','${citizenHash}','citizen','Barcelona','atico','["children","pets"]',datetime('now'));

      INSERT INTO "User" ("nickName","password","role","province","residenceType","specialNeeds","updatedAt")
      VALUES ('lucia_alicante','${citizenHash}','citizen','Alicante','casa_unifamiliar','["elderly","hearing_impaired"]',datetime('now'));

      INSERT INTO "Alert" ("severity","type","province","title","description","isActive","autoDetected","updatedAt")
      VALUES (4,'flood','Valencia','Alerta por lluvias intensas','Se esperan precipitaciones superiores a 100mm en las proximas 12 horas. Riesgo de inundaciones en zonas bajas.',1,1,datetime('now'));

      INSERT INTO "Alert" ("severity","type","province","title","description","isActive","autoDetected","updatedAt")
      VALUES (3,'wind_storm','Barcelona','Aviso por viento fuerte','Rachas de viento de hasta 90 km/h previstas para la costa catalana.',1,0,datetime('now'));

      INSERT INTO "Alert" ("severity","type","province","title","description","isActive","autoDetected","updatedAt")
      VALUES (2,'cold_snap','Madrid','Descenso de temperaturas','Temperaturas minimas de -2C previstas para la madrugada. Precaucion en desplazamientos.',1,1,datetime('now'));
    `);
  }

  client.close();
  globalForPrisma.dbInitialized = true;
}

export { initializeDatabase };
