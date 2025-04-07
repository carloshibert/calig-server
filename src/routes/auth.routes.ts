import { Router } from 'express';
import { register, login, getProfile, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator } from '../validators/auth.validator';
import { protect } from '../middleware/auth';

const router = Router();

// Rutas públicas
router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/forgot-password', forgotPasswordValidator, forgotPassword);
router.post('/reset-password', resetPasswordValidator, resetPassword);

// Rutas protegidas
router.get('/me', protect, getProfile);

export default router;