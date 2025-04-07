import { Router } from 'express';
import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  togglePublishStatus
} from '../controllers/company.controller';
import { createCompanyValidator, updateCompanyValidator } from '../validators/company.validator';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para todos los usuarios autenticados
router.post('/', createCompanyValidator, createCompany);
router.get('/', getCompanies);
router.get('/:id', getCompanyById);
router.put('/:id', updateCompanyValidator, updateCompany);
router.put('/:id/publish', togglePublishStatus);

// Rutas solo para administradores
router.delete('/:id', authorize('admin'), deleteCompany);

export default router;