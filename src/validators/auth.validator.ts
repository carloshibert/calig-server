import { body } from 'express-validator';

export const registerValidator = [
  body('email')
    .isEmail()
    .withMessage('Ingrese un email válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('firstName')
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .trim(),
  body('lastName')
    .notEmpty()
    .withMessage('El apellido es obligatorio')
    .trim(),
];

export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Ingrese un email válido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria'),
];

export const forgotPasswordValidator = [
  body('email')
    .isEmail()
    .withMessage('Ingrese un email válido')
    .normalizeEmail(),
];

export const resetPasswordValidator = [
  body('token')
    .notEmpty()
    .withMessage('El token es obligatorio'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
];

export const updateProfileValidator = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Ingrese un email válido')
    .normalizeEmail(),
  body('firstName')
    .optional()
    .notEmpty()
    .withMessage('El nombre no puede estar vacío')
    .trim(),
  body('lastName')
    .optional()
    .notEmpty()
    .withMessage('El apellido no puede estar vacío')
    .trim(),
];