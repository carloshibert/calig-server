import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import companyRoutes from '../../../src/routes/company.routes';
import Company from '../../../src/models/Company';
import jwt, { JwtPayload } from 'jsonwebtoken';
// import User from '../../../src/models/User';
import { createTestUser, generateTestToken } from '../../helpers/test-utils';

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
      // Configurar req.user con todos los campos necesarios
      req.user = { 
        _id: decoded.id,
        id: decoded.id, // Algunos controladores pueden usar id en lugar de _id
        role: decoded.role || 'admin', // Asegurar que el rol esté presente y tenga permisos suficientes
        isActive: true // Asegurar que el usuario esté activo
      };
    } catch (error) {
      // Si hay un error con el token, no establecer req.user
    }
  }
  next();
});

app.use('/api/companies', companyRoutes);

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

describe('API de Empresas', () => {
  describe('POST /api/companies', () => {
    it('debería crear un nuevo perfil de empresa', async () => {
      // Crear un usuario para la prueba
      const user = await createTestUser();
      const token = generateTestToken(user._id.toString());

      const companyData = {
        companyName: 'Empresa Prueba',
        sector: 'Bebidas', // Usando un valor válido del enum
        description: 'Descripción de prueba',
        contactInfo: {
          address: 'Dirección de prueba',
          phone: '4771234567',
          email: 'empresa@test.com',
          website: 'https://empresaprueba.com'
        }
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(companyData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.companyName).toBe(companyData.companyName);

      // Verificar que la empresa se guardó en la base de datos
      const companyInDb = await Company.findById(response.body._id);
      expect(companyInDb).not.toBeNull();
      // expect(companyInDb?.owner.toString()).toBe(user._id.toString());
    });

    it('debería devolver error si falta información requerida', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id.toString());

      const incompleteCompanyData = {
        // Falta el nombre y otros campos requeridos
        sector: 'Bebidas'
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(incompleteCompanyData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('debería devolver error 401 sin token de autenticación', async () => {
      const companyData = {
        companyName: 'Empresa Sin Auth',
        sector: 'Bebidas'
      };

      const response = await request(app)
        .post('/api/companies')
        .send(companyData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/companies', () => {
    it('debería listar todas las empresas', async () => {
      // Crear un usuario para la prueba
      const user = await createTestUser();

      // Crear varias empresas para la prueba
      await Company.create([
        {
          companyName: 'Empresa 1',
          sector: 'Bebidas',
          description: 'Descripción 1',
          userId: user._id,
          contactInfo: {
            address: 'Dirección de prueba',
            phone: '4771234567',
            email: 'empresa1@test.com',
            website: 'https://empresa1.com'
          }
        },
        {
          companyName: 'Empresa 2',
          sector: 'Lácteos',
          description: 'Descripción 2',
          userId: user._id,
          contactInfo: {
            address: 'Dirección de prueba 2',
            phone: '4771234568',
            email: 'empresa2@test.com',
            website: 'https://empresa2.com'
          }
        }
      ]);

      const token = generateTestToken(user._id.toString());

      const response = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('debería filtrar empresas por sector', async () => {
      // Crear un usuario para la prueba
      const user = await createTestUser();

      // Crear varias empresas para la prueba
      await Company.create([
        {
          companyName: 'Empresa Bebidas',
          sector: 'Bebidas',
          description: 'Descripción bebidas',
          userId: user._id,
          contactInfo: {
            address: 'Dirección de prueba',
            phone: '4771234567',
            email: 'empresabebidas@test.com',
            website: 'https://empresabebidas.com'
          }
        },
        {
          companyName: 'Empresa Lácteos',
          sector: 'Lácteos',
          description: 'Descripción lácteos',
          userId: user._id,
          contactInfo: {
            address: 'Dirección de prueba 2',
            phone: '4771234568',
            email: 'empresalacteos@test.com',
            website: 'https://empresalacteos.com'
          }
        }
      ]);

      const token = generateTestToken(user._id.toString());

      const response = await request(app)
        .get('/api/companies?sector=Bebidas')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].sector).toBe('Bebidas');
    });
  });

  describe('GET /api/companies/:id', () => {
    it('debería obtener una empresa por su ID', async () => {
      // Crear un usuario para la prueba
      const user = await createTestUser();

      // Crear una empresa para la prueba
      const company = await Company.create({
        companyName: 'Empresa Detalle',
        sector: 'Bebidas',
        description: 'Descripción detalle',
        userId: user._id,
        contactInfo: {
          address: 'Dirección de prueba',
          phone: '4771234567',
          email: 'empresadetalle@test.com',
          website: 'https://empresadetalle.com'
        }
      });

      const token = generateTestToken(user._id.toString());

      const response = await request(app)
        .get(`/api/companies/${company._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('_id', company._id!.toString());
      expect(response.body.companyName).toBe('Empresa Detalle');
    });

    it('debería devolver error 404 si la empresa no existe', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id.toString());
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/companies/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/companies/:id', () => {
    it('debería actualizar una empresa existente', async () => {
      // Crear un usuario para la prueba
      const user = await createTestUser();

      // Crear una empresa para la prueba
      const company = await Company.create({
        companyName: 'Empresa Original',
        sector: 'Bebidas',
        description: 'Descripción original',
        userId: user._id,
        contactInfo: {
          address: 'Dirección de prueba',
          phone: '4771234567',
          email: 'empresaoriginal@test.com',
          website: 'https://empresaoriginal.com'
        }
      });

      const token = generateTestToken(user._id.toString());
      const updatedData = {
        companyName: 'Empresa Actualizada',
        description: 'Descripción actualizada'
      };

      const response = await request(app)
        .put(`/api/companies/${company._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.companyName).toBe(updatedData.companyName);
      expect(response.body.description).toBe(updatedData.description);

      // Verificar que la empresa se actualizó en la base de datos
      const companyInDb = await Company.findById(company._id);
      expect(companyInDb?.companyName).toBe(updatedData.companyName);
    });

    it('debería devolver error 403 si el usuario no es el propietario', async () => {
      // Crear dos usuarios para la prueba
      const owner = await createTestUser({ email: 'owner@test.com' });
      const otherUser = await createTestUser({ email: 'other@test.com' });

      // Crear una empresa para la prueba
      const company = await Company.create({
        companyName: 'Empresa Protegida',
        sector: 'Bebidas',
        description: 'Descripción protegida',
        userId: owner._id,
        contactInfo: {
          address: 'Dirección de prueba',
          phone: '4771234567',
          email: 'empresaprotegida@test.com',
          website: 'https://empresaprotegida.com'
        }
      });

      // Generar token para el otro usuario (no propietario)
      const token = generateTestToken(otherUser._id.toString());
      const updatedData = {
        companyName: 'Intento de Actualización'
      };

      const response = await request(app)
        .put(`/api/companies/${company._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedData);

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/companies/:id', () => {
    it('debería eliminar una empresa existente', async () => {
      // Crear un usuario para la prueba
      const user = await createTestUser();

      // Crear una empresa para la prueba
      const company = await Company.create({
        companyName: 'Empresa a Eliminar',
        sector: 'Bebidas',
        description: 'Descripción eliminar',
        userId: user._id,
        contactInfo: {
          address: 'Dirección de prueba',
          phone: '4771234567',
          email: 'empresaeliminar@test.com',
          website: 'https://empresaeliminar.com'
        }
      });

      const token = generateTestToken(user._id.toString());

      const response = await request(app)
        .delete(`/api/companies/${company._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      // Verificar que la empresa se eliminó de la base de datos
      const companyInDb = await Company.findById(company._id);
      expect(companyInDb).toBeNull();
    });

    it('debería devolver error 403 si el usuario no es el propietario', async () => {
      // Crear dos usuarios para la prueba
      const owner = await createTestUser({ email: 'owner@test.com' });
      const otherUser = await createTestUser({ email: 'other@test.com' });

      // Crear una empresa para la prueba
      const company = await Company.create({
        companyName: 'Empresa Protegida',
        sector: 'Bebidas',
        description: 'Descripción protegida',
        userId: owner._id,
        contactInfo: {
          address: 'Dirección de prueba',
          phone: '4771234567',
          email: 'empresaprotegida@test.com',
          website: 'https://empresaprotegida.com'
        }
      });

      // Generar token para el otro usuario (no propietario)
      const token = generateTestToken(otherUser._id.toString());

      const response = await request(app)
        .delete(`/api/companies/${company._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);

      // Verificar que la empresa sigue en la base de datos
      const companyInDb = await Company.findById(company._id);
      expect(companyInDb).not.toBeNull();
    });
  });
});