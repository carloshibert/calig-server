import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import User from '../models/User';

// Extender la interfaz Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

interface JwtPayload {
  id: string;
}

// Middleware para verificar el token JWT
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ message: 'No estás autorizado para acceder a esta ruta' });
      return;
    }

    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
      
      // Buscar el usuario
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        res.status(401).json({ message: 'No estás autorizado para acceder a esta ruta' });
        return;
      }

      // Añadir el usuario a la request
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: 'No autorizado, token inválido' });
    }
  } catch (error) {
    logger.error(`Error de autenticación: ${error}`);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// Middleware para verificar roles
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'No autorizado, usuario no autenticado' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Prohibido, no tiene permisos para esta acción' });
      return;
    }

    next();
  };
};