import request from 'supertest';
import express from 'express';
import authRoutes from '../../../src/routes/auth.routes';
import User from '../../../src/models/User';
import { generateTestToken, createTestUser } from '../../helpers/test-utils';
// La configuración global ya está siendo cargada por Jest

// Configuración de la aplicación Express para pruebas
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// No necesitamos configuración de MongoDB aquí, ya está en setup.ts

describe('API de Autenticación', () => {
  describe('POST /api/auth/register', () => {
    it('debería registrar un nuevo usuario', async () => {
      const userData = {
        firstName: 'Usuario',
        lastName: 'Prueba',
        email: 'test@example.com',
        password: 'Password123!',
        role: 'member'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', userData.email);
      
      // Verificar que el usuario se guardó en la base de datos
      const userInDb = await User.findOne({ email: userData.email });
      expect(userInDb).not.toBeNull();
    });

    it('debería devolver error si falta información requerida', async () => {
      const incompleteUserData = {
        email: 'incomplete@example.com',
        // Falta el password y el nombre
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteUserData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('debería devolver error si el email ya está registrado', async () => {
      // Crear un usuario primero
      const existingUser = {
        firstName: 'Usuario',
        lastName: 'Existente',
        email: 'existing@example.com',
        password: 'Password123!',
        role: 'member'
      };

      await User.create(existingUser);

      // Intentar registrar con el mismo email
      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'El usuario ya existe');
    });
  });

  describe('POST /api/auth/login', () => {
    it('debería iniciar sesión con credenciales válidas', async () => {
      // Crear un usuario para la prueba
      const userData = {
        firstName: 'Usuario',
        lastName: 'Login',
        email: 'login@example.com',
        password: 'Password123!',
        role: 'member'
      };

      await User.create(userData);

      // Intentar iniciar sesión
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', userData.email);
    });

    it('debería devolver error con credenciales inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Email o contraseña incorrectos');
    });
  });

  describe('GET /api/auth/me', () => {
    it('debería obtener el perfil del usuario autenticado', async () => {
      // Crear un usuario para la prueba
      const userData = {
        firstName: 'Usuario',
        lastName: 'Perfil',
        email: 'profile@example.com',
        password: 'Password123!',
        role: 'member'
      };

      const user = await createTestUser(userData);
      
      // Generar un token JWT para el usuario
      const token = user.generateAuthToken();

      // Obtener el perfil con el token
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', userData.email);
    });

    it('debería devolver error 401 sin token de autenticación', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });
});