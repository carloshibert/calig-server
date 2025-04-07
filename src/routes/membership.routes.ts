import { Router } from 'express';
import {
  applyMembership,
  getCurrentMembership,
  getAllMemberships,
  approveMembership,
  rejectMembership,
  renewMembership,
  updateMembershipStatus,
  updatePaymentStatus,
  registerPayment,
  getPendingMemberships,
  sendRenewalReminders
} from '../controllers/membership.controller';
import {
  applyMembershipValidator,
  updateMembershipStatusValidator,
  updatePaymentStatusValidator,
  addPaymentHistoryValidator
} from '../validators/membership.validator';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para todos los usuarios autenticados
router.post('/apply', applyMembershipValidator, applyMembership);
router.get('/me', getCurrentMembership);

// Rutas solo para administradores
router.get('/', authorize('admin'), getAllMemberships);
router.put('/:id/approve', authorize('admin'), approveMembership);
router.put('/:id/reject', authorize('admin'), rejectMembership);
router.put('/:id/renew', authorize('admin'), renewMembership);
router.put('/:id/status', authorize('admin'), updateMembershipStatusValidator, updateMembershipStatus);
router.put('/:id/payment-status', authorize('admin'), updatePaymentStatusValidator, updatePaymentStatus);
router.post('/:id/payment', authorize('admin'), addPaymentHistoryValidator, registerPayment);
router.get('/pending', authorize('admin'), getPendingMemberships);
router.post('/send-renewal-reminders', authorize('admin'), sendRenewalReminders);

export default router;