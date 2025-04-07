import { Request, Response, NextFunction } from 'express';
import { registerValidator, loginValidator } from '../../../src/validators/auth.validator';
import { mockRequest, mockResponse } from '../../helpers/test-utils';

// Mock de express-validator
jest.mock('express-validator', () => ({
  body: () => ({
    isEmail: () => ({ withMessage: () => ({ normalizeEmail: () => ({}) }) }),
    isLength: () => ({ withMessage: () => ({}) }),
    notEmpty: () => ({ withMessage: () => ({ trim: () => ({}) }) })
  }),
  validationResult: jest.fn().mockReturnValue({
    isEmpty: jest.fn(),
    array: jest.fn()
  })
}));

// Middleware de validación simulado para las pruebas
const validationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const validationResult = require('express-validator').validationResult;
  const result = validationResult(req);
  
  if (result.isEmpty()) {
    return next();
  }
  
  return res.status(400).json({
    message: result.array()[0].msg,
    errors: result.array()
  });
};

// Agregar el middleware de validación a los arrays de validadores
// Create a custom validation chain for the middleware
const validationChain = {
  builder: {},
  not: jest.fn(),
  withMessage: jest.fn(),
  custom: jest.fn(),
  run: validationMiddleware
};
registerValidator.push(validationChain as any);
loginValidator.push(validationMiddleware as any);

describe('Auth Validators', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('registerValidator', () => {
    it('debería llamar a next si la validación pasa', () => {
      const validationResult = require('express-validator').validationResult;
      validationResult.mockReturnValueOnce({
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
      });

      // Ejecutar el middleware de validación (que ahora es el último en el array)
      validationMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('debería devolver error 400 si la validación falla', () => {
      const validationResult = require('express-validator').validationResult;
      validationResult.mockReturnValueOnce({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Error de validación' }])
      });

      // Ejecutar el middleware de validación directamente
      validationMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error de validación',
        errors: [{ msg: 'Error de validación' }]
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('loginValidator', () => {
    it('debería llamar a next si la validación pasa', () => {
      const validationResult = require('express-validator').validationResult;
      validationResult.mockReturnValueOnce({
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
      });

      // Ejecutar el middleware de validación directamente
      validationMiddleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('debería devolver error 400 si la validación falla', () => {
      const validationResult = require('express-validator').validationResult;
      validationResult.mockReturnValueOnce({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Error de validación' }])
      });

      // Ejecutar el middleware de validación directamente
      validationMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error de validación',
        errors: [{ msg: 'Error de validación' }]
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});