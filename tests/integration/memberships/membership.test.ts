import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import membershipRoutes from '../../../src/routes/membership.routes';
import Membership from '../../../src/models/Membership';
import Company from '../../../src/models/Company';
import User from '../../../src/models/User';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { createTestUser, createTestCompany, generateTestToken } from '../../helpers/test-utils';

// Interfaz para el payload del JWT
interface DecodedToken extends JwtPayload {
  id: string;
  role?: string;
}

// Configuración de la aplicación Express para pruebas
const app = express();
app.use(express.json());

// Middleware para simular la autenticación en las pruebas
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      // Verificar el token y establecer req.user
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret-key') as DecodedToken;
      req.user = { _id: decoded.id };
    } catch (error) {
      // Si hay un error con el token, no establecer req.user
    }
  }
  next();
});

app.use('/api/memberships', membershipRoutes);

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

describe('API de Membresías', () => {
  describe('POST /api/memberships', () => {
    it('debería crear una solicitud de membresía', async () => {
      // Crear un usuario y una empresa para la prueba
      const user = await createTestUser();
      const company = await createTestCompany({}, user._id.toString());
      const token = generateTestToken(user._id.toString());

      const membershipData = {
        companyId: company._id,
        membershipLevel: 'basic',
        paymentMethod: 'transfer'
      };

      const response = await request(app)
        .post('/api/memberships/apply')
        .set('Authorization', `Bearer ${token}`)
        .send(membershipData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.status).toBe('pending');
      expect(response.body.companyId.toString()).toBe(company._id.toString());
      
      // Verificar que la membresía se guardó en la base de datos
      const membershipInDb = await Membership.findById(response.body._id);
      expect(membershipInDb).not.toBeNull();
      expect(membershipInDb?.status).toBe('pending');
    });

    it('debería devolver error si la empresa no pertenece al usuario', async () => {
      // Crear dos usuarios para la prueba
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      
      // Crear una empresa para el primer usuario
      const company = await createTestCompany({}, user1._id.toString());
      
      // Intentar crear membresía con el segundo usuario
      const token = generateTestToken(user2._id.toString());

      const membershipData = {
        companyId: company._id,
        membershipLevel: 'basic',
        paymentMethod: 'transfer'
      };

      const response = await request(app)
        .post('/api/memberships/apply')
        .set('Authorization', `Bearer ${token}`)
        .send(membershipData);

      expect(response.status).toBe(403);
    });

    it('debería devolver error si ya existe una membresía activa o pendiente', async () => {
      // Crear un usuario y una empresa para la prueba
      const user = await createTestUser();
      const company = await createTestCompany({}, user._id.toString());
      
      // Crear una membresía existente
      await Membership.create({
        companyId: company._id,
        userId: user._id,
        membershipLevel: 'basic',
        status: 'active',
        startDate: new Date(),
        renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });

      const token = generateTestToken(user._id.toString());

      const membershipData = {
        companyId: company._id,
        membershipLevel: 'basic',
        paymentMethod: 'transfer'
      };

      const response = await request(app)
        .post('/api/memberships/apply')
        .set('Authorization', `Bearer ${token}`)
        .send(membershipData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/memberships', () => {
    it('debería listar las membresías del usuario', async () => {
      // Crear un usuario y empresas para la prueba
      const user = await createTestUser();
      const company1 = await createTestCompany({ name: 'Empresa 1' }, user._id.toString());
      const company2 = await createTestCompany({ name: 'Empresa 2' }, user._id.toString());
      
      // Crear membresías para las empresas
      await Membership.create([
        {
          companyId: company1._id,
          userId: user._id,
          membershipLevel: 'basic',
          status: 'active',
          startDate: new Date(),
          renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },
        {
          companyId: company2._id,
          userId: user._id,
          membershipLevel: 'premium',
          status: 'pending',
          startDate: new Date(),
          renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      ]);

      const token = generateTestToken(user._id.toString());

      const response = await request(app)
        .get('/api/memberships')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('debería filtrar membresías por estado', async () => {
      // Crear un usuario y empresas para la prueba
      const user = await createTestUser();
      const company1 = await createTestCompany({ name: 'Empresa Activa' }, user._id.toString());
      const company2 = await createTestCompany({ name: 'Empresa Pendiente' }, user._id.toString());
      
      // Crear membresías con diferentes estados
      await Membership.create([
        {
          companyId: company1._id,
          userId: user._id,
          membershipLevel: 'basic',
          status: 'active',
          startDate: new Date(),
          renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        },
        {
          companyId: company2._id,
          userId: user._id,
          membershipLevel: 'premium',
          status: 'pending',
          startDate: new Date(),
          renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      ]);

      const token = generateTestToken(user._id.toString());

      const response = await request(app)
        .get('/api/memberships?status=active')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('active');
    });
  });

  describe('GET /api/memberships/:id', () => {
    it('debería obtener una membresía por su ID', async () => {
      // Crear un usuario y una empresa para la prueba
      const user = await createTestUser();
      const company = await createTestCompany({}, user._id.toString());
      
      // Crear una membresía para la prueba
      const membership = await Membership.create({
        companyId: company._id,
        userId: user._id,
        membershipLevel: 'basic',
        status: 'active',
        startDate: new Date(),
        renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });

      const token = generateTestToken(user._id.toString());

      const response = await request(app)
        .get(`/api/memberships/${membership._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id', (membership as any)._id.toString());
      expect(response.body.membershipLevel).toBe('basic');
      expect(response.body.status).toBe('active');
    });

    it('debería devolver error 404 si la membresía no existe', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id.toString());
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/memberships/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/memberships/:id/renew', () => {
    it('debería renovar una membresía existente', async () => {
      // Crear un usuario y una empresa para la prueba
      const user = await createTestUser();
      const company = await createTestCompany({}, user._id.toString());
      
      // Crear una membresía a punto de expirar
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 10); // 10 días para expirar
      
      const membership = await Membership.create({
        companyId: company._id,
        userId: user._id,
        membershipLevel: 'basic',
        status: 'active',
        startDate: new Date(Date.now() - 355 * 24 * 60 * 60 * 1000), // Hace casi un año
        renewalDate: expirationDate
      });

      const token = generateTestToken(user._id.toString());

      const renewalData = {
        paymentMethod: 'transfer'
      };

      const response = await request(app)
        .put(`/api/memberships/${membership._id}/renew`)
        .set('Authorization', `Bearer ${token}`)
        .send(renewalData);

      expect(response.status).toBe(200);
      
      // Verificar que la membresía se renovó en la base de datos
      const membershipInDb = await Membership.findById(membership._id);
      expect(membershipInDb).not.toBeNull();
      
      // La fecha de fin debería ser aproximadamente un año después de la fecha original
      const originalEndTime = expirationDate.getTime();
      const newEndTime = new Date(membershipInDb?.renewalDate as Date).getTime();
      const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
      
      // Verificar que la nueva fecha es aproximadamente un año después (con margen de error)
      expect(newEndTime - originalEndTime).toBeGreaterThanOrEqual(oneYearInMs - 1000 * 60 * 60 * 24);
      expect(newEndTime - originalEndTime).toBeLessThanOrEqual(oneYearInMs + 1000 * 60 * 60 * 24);
    });

    it('debería devolver error si la membresía no pertenece al usuario', async () => {
      // Crear dos usuarios para la prueba
      const user1 = await createTestUser({ email: 'user1@test.com' });
      const user2 = await createTestUser({ email: 'user2@test.com' });
      
      // Crear una empresa para el primer usuario
      const company = await createTestCompany({}, user1._id.toString());
      
      // Crear una membresía para la empresa del primer usuario
      const membership = await Membership.create({
        companyId: company._id,
        userId: user1._id,
        membershipLevel: 'basic',
        status: 'active',
        startDate: new Date(),
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días para expirar
      });

      // Intentar renovar con el segundo usuario
      const token = generateTestToken(user2._id.toString());

      const renewalData = {
        paymentMethod: 'transfer'
      };

      const response = await request(app)
        .put(`/api/memberships/${membership._id}/renew`)
        .set('Authorization', `Bearer ${token}`)
        .send(renewalData);

      expect(response.status).toBe(403);
    });
  });

  // Pruebas para administradores (aprobar/rechazar membresías)
  describe('PUT /api/memberships/:id/approve', () => {
    it('debería aprobar una solicitud de membresía pendiente (solo admin)', async () => {
      // Crear un usuario normal y un administrador
      const user = await createTestUser();
      const admin = await createTestUser({ email: 'admin@test.com', role: 'admin' });
      
      // Crear una empresa para el usuario
      const company = await createTestCompany({}, user._id.toString());
      
      // Crear una solicitud de membresía pendiente
      const membership = await Membership.create({
        companyId: company._id,
        userId: user._id,
        membershipLevel: 'basic',
        status: 'pending',
        startDate: new Date(),
        renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });

      // Token de administrador
      const adminToken = generateTestToken(admin._id.toString(), 'admin');

      const response = await request(app)
        .put(`/api/memberships/${membership._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('active');
      
      // Verificar que la membresía se actualizó en la base de datos
      const membershipInDb = await Membership.findById(membership._id);
      expect(membershipInDb?.status).toBe('active');
      expect(membershipInDb?.startDate).not.toBeNull();
      expect(membershipInDb?.renewalDate).not.toBeNull();
    });

    it('debería devolver error 403 si el usuario no es administrador', async () => {
      // Crear un usuario normal
      const user = await createTestUser();
      
      // Crear una empresa para el usuario
      const company = await createTestCompany({}, user._id.toString());
      
      // Crear una solicitud de membresía pendiente
      const membership = await Membership.create({
        companyId: company._id,
        userId: user._id,
        membershipLevel: 'basic',
        status: 'pending',
        startDate: new Date(),
        renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });

      // Token de usuario normal
      const userToken = generateTestToken(user._id.toString());

      const response = await request(app)
        .put(`/api/memberships/${membership._id}/approve`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      
      // Verificar que la membresía sigue pendiente
      const membershipInDb = await Membership.findById(membership._id);
      expect(membershipInDb?.status).toBe('pending');
    });
  });

  describe('PUT /api/memberships/:id/reject', () => {
    it('debería rechazar una solicitud de membresía pendiente (solo admin)', async () => {
      // Crear un usuario normal y un administrador
      const user = await createTestUser();
      const admin = await createTestUser({ email: 'admin@test.com', role: 'admin' });
      
      // Crear una empresa para el usuario
      const company = await createTestCompany({}, user._id.toString());
      
      // Crear una solicitud de membresía pendiente
      const membership = await Membership.create({
        companyId: company._id,
        userId: user._id,
        membershipLevel: 'basic',
        status: 'pending',
        startDate: new Date(),
        renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });

      // Token de administrador
      const adminToken = generateTestToken(admin._id.toString(), 'admin');

      const rejectionData = {
        reason: 'Documentación incompleta'
      };

      const response = await request(app)
        .put(`/api/memberships/${membership._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(rejectionData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('rejected');
      
      // Verificar que la membresía se actualizó en la base de datos
      const membershipInDb = await Membership.findById(membership._id);
      expect(membershipInDb?.status).toBe('rejected');
    });
  });
});