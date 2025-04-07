import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import adminRoutes from '../../../src/routes/admin.routes';
import User from '../../../src/models/User';
import Company from '../../../src/models/Company';
import Membership from '../../../src/models/Membership';
import { createTestUser, createTestCompany, createTestMembership, generateTestToken } from '../../helpers/test-utils';

// Configuración de la aplicación Express para pruebas
const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

// Variables para MongoDB en memoria
let mongoServer: MongoMemoryServer;

// Configuración antes de todas las pruebas
beforeAll(async () => {
  // Iniciar MongoDB en memoria
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Configurar la URI de MongoDB para las pruebas
  process.env.MONGODB_URI = mongoUri;
  
  // Conectar a la base de datos
  await mongoose.connect(mongoUri);
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
  }
});

describe('API de Administración', () => {
  describe('GET /api/admin/stats', () => {
    it('debería obtener estadísticas generales (solo admin)', async () => {
      // Crear un administrador para la prueba
      const admin = await createTestUser({ role: 'admin' });
      
      // Crear datos de prueba
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      
      const company1 = await createTestCompany({ name: 'Empresa 1', sector: 'Alimentos' }, user1._id.toString());
      const company2 = await createTestCompany({ name: 'Empresa 2', sector: 'Bebidas' }, user2._id.toString());
      
      await createTestMembership({ status: 'active', type: 'basic' }, company1._id.toString());
      await createTestMembership({ status: 'pending', type: 'premium' }, company2._id.toString());

      // Token de administrador
      const adminToken = generateTestToken(admin._id.toString(), 'admin');

      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalCompanies');
      expect(response.body).toHaveProperty('totalActiveMemberships');
      expect(response.body).toHaveProperty('totalPendingMemberships');
      
      // Verificar los conteos
      expect(response.body.totalUsers).toBe(3); // 2 usuarios + 1 admin
      expect(response.body.totalCompanies).toBe(2);
      expect(response.body.totalActiveMemberships).toBe(1);
      expect(response.body.totalPendingMemberships).toBe(1);
    });

    it('debería devolver error 403 si el usuario no es administrador', async () => {
      // Crear un usuario normal
      const user = await createTestUser();
      const token = generateTestToken(user._id.toString());

      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/users', () => {
    it('debería listar todos los usuarios (solo admin)', async () => {
      // Crear un administrador para la prueba
      const admin = await createTestUser({ role: 'admin' });
      
      // Crear usuarios de prueba
      await createTestUser({ email: 'user1@test.com', firstName: 'Usuario', lastName: 'Uno' });
      await createTestUser({ email: 'user2@test.com', firstName: 'Usuario', lastName: 'Dos' });

      // Token de administrador
      const adminToken = generateTestToken(admin._id.toString(), 'admin');

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3); // 2 usuarios + 1 admin
    });

    it('debería filtrar usuarios por rol', async () => {
      // Crear un administrador para la prueba
      const admin = await createTestUser({ role: 'admin' });
      
      // Crear usuarios de prueba con diferentes roles
      await createTestUser({ email: 'user1@test.com', role: 'user' });
      await createTestUser({ email: 'user2@test.com', role: 'user' });
      await createTestUser({ email: 'admin2@test.com', role: 'admin' });

      // Token de administrador
      const adminToken = generateTestToken(admin._id.toString(), 'admin');

      const response = await request(app)
        .get('/api/admin/users?role=admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2); // 2 admins
      expect(response.body[0].role).toBe('admin');
      expect(response.body[1].role).toBe('admin');
    });
  });

  describe('PUT /api/admin/users/:id/status', () => {
    it('debería activar/desactivar un usuario (solo admin)', async () => {
      // Crear un administrador para la prueba
      const admin = await createTestUser({ role: 'admin' });
      
      // Crear un usuario para la prueba
      const user = await createTestUser({ isActive: true });

      // Token de administrador
      const adminToken = generateTestToken(admin._id.toString(), 'admin');

      // Desactivar el usuario
      const response = await request(app)
        .put(`/api/admin/users/${user._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(response.status).toBe(200);
      expect(response.body.isActive).toBe(false);
      
      // Verificar que el usuario se actualizó en la base de datos
      const userInDb = await User.findById(user._id);
      expect(userInDb?.isActive).toBe(false);

      // Activar el usuario nuevamente
      const response2 = await request(app)
        .put(`/api/admin/users/${user._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true });

      expect(response2.status).toBe(200);
      expect(response2.body.isActive).toBe(true);
      
      // Verificar que el usuario se actualizó en la base de datos
      const userInDb2 = await User.findById(user._id);
      expect(userInDb2?.isActive).toBe(true);
    });

    it('debería devolver error 403 si el usuario no es administrador', async () => {
      // Crear usuarios para la prueba
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      
      // Token de usuario normal
      const token = generateTestToken(user1._id.toString());

      const response = await request(app)
        .put(`/api/admin/users/${user2._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isActive: false });

      expect(response.status).toBe(403);
      
      // Verificar que el usuario no se modificó
      const userInDb = await User.findById(user2._id);
      expect(userInDb?.isActive).toBe(true); // El valor por defecto es true
    });
  });

  describe('GET /api/admin/memberships/pending', () => {
    it('debería listar todas las membresías pendientes (solo admin)', async () => {
      // Crear un administrador para la prueba
      const admin = await createTestUser({ role: 'admin' });
      
      // Crear datos de prueba
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      
      const company1 = await createTestCompany({ name: 'Empresa 1' }, user1._id.toString());
      const company2 = await createTestCompany({ name: 'Empresa 2' }, user2._id.toString());
      
      // Crear membresías con diferentes estados
      await createTestMembership({ status: 'active' }, company1._id.toString());
      await createTestMembership({ status: 'pending' }, company2._id.toString());

      // Token de administrador
      const adminToken = generateTestToken(admin._id.toString(), 'admin');

      const response = await request(app)
        .get('/api/admin/memberships/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('pending');
    });
  });

  describe('GET /api/admin/memberships/expiring', () => {
    it('debería listar las membresías a punto de expirar (solo admin)', async () => {
      // Crear un administrador para la prueba
      const admin = await createTestUser({ role: 'admin' });
      
      // Crear datos de prueba
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      
      const company1 = await createTestCompany({ name: 'Empresa 1' }, user1._id.toString());
      const company2 = await createTestCompany({ name: 'Empresa 2' }, user2._id.toString());
      
      // Crear una membresía que expira pronto (en 15 días)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 15);
      
      await createTestMembership({
        status: 'active',
        startDate: new Date(Date.now() - 350 * 24 * 60 * 60 * 1000), // Hace casi un año
        renewalDate: expirationDate
      }, company1._id.toString());
      
      // Crear una membresía que no expira pronto (en 60 días)
      const farExpirationDate = new Date();
      farExpirationDate.setDate(farExpirationDate.getDate() + 60);
      
      await createTestMembership({
        status: 'active',
        startDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
        renewalDate: farExpirationDate
      }, company2._id.toString());

      // Token de administrador
      const adminToken = generateTestToken(admin._id.toString(), 'admin');

      const response = await request(app)
        .get('/api/admin/memberships/expiring')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1); // Solo la que expira en 15 días
      
      // Verificar que la membresía que expira pronto está en la respuesta
      const expiringMembership = response.body[0];
      expect(new Date(expiringMembership.renewalDate).getTime()).toBe(expirationDate.getTime());
    });
  });
});