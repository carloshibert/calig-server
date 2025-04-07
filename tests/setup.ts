import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Configurar variables de entorno para pruebas
dotenv.config({ path: '.env.test' });

// Variables globales para MongoDB en memoria
let mongoServer: MongoMemoryServer;

// Configuración antes de todas las pruebas
beforeAll(async () => {
  // Iniciar MongoDB en memoria
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Conectar a la base de datos en memoria
  await mongoose.connect(mongoUri);
  
  console.log(`MongoDB Memory Server iniciado en ${mongoUri}`);
});

// Limpiar después de cada prueba
afterEach(async () => {
  // Limpiar todas las colecciones después de cada prueba
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Limpiar después de todas las pruebas
afterAll(async () => {
  // Cerrar conexión a MongoDB
  await mongoose.connection.close();
  
  // Detener el servidor MongoDB en memoria
  if (mongoServer) {
    await mongoServer.stop();
    console.log('MongoDB Memory Server detenido');
  }
});

// Configuración de tokens JWT para pruebas
export const testTokens = {
  validUserToken: 'jwt-token-for-testing-user',
  validAdminToken: 'jwt-token-for-testing-admin',
  expiredToken: 'expired-jwt-token-for-testing',
  invalidToken: 'invalid-jwt-token-for-testing'
};

// Silenciar logs durante las pruebas
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock para el servicio de email
jest.mock('../src/services/email.service', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));