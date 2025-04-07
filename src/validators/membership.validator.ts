import { body } from 'express-validator';

export const applyMembershipValidator = [
  body('membershipLevel')
    .notEmpty()
    .withMessage('El nivel de membresía es obligatorio'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio debe tener un formato válido'),
];

export const updateMembershipStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('El estado es obligatorio')
    .isIn(['active', 'pending', 'expired'])
    .withMessage('Estado de membresía no válido'),
];

export const updatePaymentStatusValidator = [
  body('paymentStatus')
    .notEmpty()
    .withMessage('El estado de pago es obligatorio')
    .isIn(['paid', 'pending', 'overdue'])
    .withMessage('Estado de pago no válido'),
];

export const addPaymentHistoryValidator = [
  body('amount')
    .notEmpty()
    .withMessage('El monto es obligatorio')
    .isNumeric()
    .withMessage('El monto debe ser un número'),
  body('description')
    .notEmpty()
    .withMessage('La descripción es obligatoria'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('La fecha debe tener un formato válido'),
];