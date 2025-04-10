import { Router } from 'express';
import { register, login, getProfile, forgotPassword, resetPassword, updateProfile } from '../controllers/auth.controller';
import { registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator, updateProfileValidator } from '../validators/auth.validator';
import { protect } from '../middleware/auth';

const router = Router();

// Rutas públicas
router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/forgot-password', forgotPasswordValidator, forgotPassword);
router.post('/reset-password', resetPasswordValidator, resetPassword);

// Rutas protegidas
router.get('/me', protect, getProfile);
router.put('/profile', protect, updateProfileValidator, updateProfile);

export default router;