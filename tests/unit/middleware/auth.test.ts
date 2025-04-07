import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { protect, authorize } from '../../../src/middleware/auth';
import { mockRequest, mockResponse } from '../../helpers/test-utils';

// Mock de jsonwebtoken
jest.mock('jsonwebtoken');

// Mock del modelo User
jest.mock('../../../src/models/User', () => ({
  findById: jest.fn()
}));

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('protect middleware', () => {
    it('debería devolver error 401 si no hay token', async () => {
      req.headers = {};

      await protect(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No estás autorizado para acceder a esta ruta'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('debería verificar el token y llamar a next si es válido', async () => {
      // Mock del token
      req.headers = { authorization: 'Bearer valid-token' };
      
      // Mock de la verificación del token
      (jwt.verify as jest.Mock).mockReturnValue({ id: 'user-id' });
      
      // Mock del usuario encontrado - make sure this matches how your middleware uses it
      const mockUser = { _id: 'user-id', role: 'user' };
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      const mockFindById = jest.fn().mockReturnValue({ select: mockSelect });
      
      // Replace the User.findById mock
      const User = require('../../../src/models/User');
      User.findById = mockFindById;

      await protect(req as Request, res as Response, next);

      expect(jwt.verify).toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith('user-id');
      expect(next).toHaveBeenCalled();
    });

    it('debería devolver error 401 si el token es inválido', async () => {
      req.headers = { authorization: 'Bearer invalid-token' };
      
      // Mock para simular token inválido
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Token inválido');
      });

      await protect(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No autorizado, token inválido'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    it('debería permitir acceso si el usuario tiene el rol correcto', () => {
      req.user = { role: 'admin' };

      const authMiddleware = authorize('admin', 'superadmin');
      authMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('debería devolver error 403 si el usuario no tiene el rol correcto', () => {
      req.user = { role: 'user' };

      const authMiddleware = authorize('admin');
      authMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Prohibido, no tiene permisos para esta acción'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});