import { Router } from 'express';
import {
  getStats,
  getUsers,
  // getPendingMemberships,
  // getExpiringMemberships,
  updateUserStatus 
} from '../controllers/admin.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Proteger todas las rutas de admin
router.use(protect);
router.use(authorize('admin'));

// Rutas de administración
router.get('/stats', getStats);
router.get('/users', getUsers);
// Ruta para activar/desactivar usuarios
router.put('/users/:id/status', updateUserStatus);

export default router;