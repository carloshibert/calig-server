import { body } from 'express-validator';

export const createCompanyValidator = [
  body('companyName')
    .notEmpty()
    .withMessage('El nombre de la empresa es obligatorio')
    .trim(),
  body('sector')
    .notEmpty()
    .withMessage('El sector es obligatorio')
    .isIn(['Servicios Financieros', 'Frescos', 'Cárnicos', 'Lácteos', 'Procesados', 'Bebidas', 'Tecnología', 'Logística', 'Consultoría', 'Otro'])
    .withMessage('Seleccione un sector válido'),
  body('description')
    .notEmpty()
    .withMessage('La descripción es obligatoria'),
  body('contactInfo.address')
    .notEmpty()
    .withMessage('La dirección es obligatoria'),
  body('contactInfo.phone')
    .notEmpty()
    .withMessage('El teléfono es obligatorio'),
  body('contactInfo.email')
    .isEmail()
    .withMessage('Ingrese un email de contacto válido')
    .normalizeEmail(),
  body('contactInfo.website')
    .optional()
    .isURL()
    .withMessage('Ingrese una URL válida para el sitio web'),
  body('socialMedia.facebook')
    .optional()
    .isURL()
    .withMessage('Ingrese una URL válida para Facebook'),
  body('socialMedia.instagram')
    .optional()
    .isURL()
    .withMessage('Ingrese una URL válida para Instagram'),
  body('socialMedia.linkedin')
    .optional()
    .isURL()
    .withMessage('Ingrese una URL válida para LinkedIn'),
  body('socialMedia.twitter')
    .optional()
    .isURL()
    .withMessage('Ingrese una URL válida para Twitter'),
];

export const updateCompanyValidator = [
  body('companyName')
    .optional()
    .notEmpty()
    .withMessage('El nombre de la empresa no puede estar vacío')
    .trim(),
  body('sector')
    .optional()
    .isIn(['Servicios Financieros', 'Frescos', 'Cárnicos', 'Lácteos', 'Procesados', 'Bebidas', 'Tecnología', 'Logística', 'Consultoría', 'Otro'])
    .withMessage('Seleccione un sector válido'),
  body('description')
    .optional()
    .notEmpty()
    .withMessage('La descripción no puede estar vacía'),
  body('contactInfo.address')
    .optional()
    .notEmpty()
    .withMessage('La dirección no puede estar vacía'),
  body('contactInfo.phone')
    .optional()
    .notEmpty()
    .withMessage('El teléfono no puede estar vacío'),
  body('contactInfo.email')
    .optional()
    .isEmail()
    .withMessage('Ingrese un email de contacto válido')
    .normalizeEmail(),
  body('contactInfo.website')
    .optional()
    .isURL()
    .withMessage('Ingrese una URL válida para el sitio web'),
  body('socialMedia.facebook')
    .optional()
    .isURL()
    .withMessage('Ingrese una URL válida para Facebook'),
  body('socialMedia.instagram')
    .optional()
    .isURL()
    .withMessage('Ingrese una URL válida para Instagram'),
  body('socialMedia.linkedin')
    .optional()
    .isURL()
    .withMessage('Ingrese una URL válida para LinkedIn'),
  body('socialMedia.twitter')
    .optional()
    .isURL()
    .withMessage('Ingrese una URL válida para Twitter'),
];