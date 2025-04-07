import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

// Configuración del transporte de email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASSWORD || 'password',
  },
});

// Interfaz para las opciones de email
interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Función para enviar emails
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Cluster Alimentos Guanajuato <noreply@clusteralimentos.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email enviado a ${options.to}`);
    return true;
  } catch (error) {
    logger.error(`Error al enviar email: ${error}`);
    throw new Error('Error al enviar email');
  }
};

// Plantillas de email
export const emailTemplates = {
  // Plantilla para bienvenida de nuevo usuario
  welcome: (name: string): { subject: string; html: string } => {
    return {
      subject: 'Bienvenido al Cluster Alimentos Guanajuato',
      html: `
        <h1>Bienvenido, ${name}!</h1>
        <p>Gracias por registrarte en el Cluster Alimentos Guanajuato.</p>
        <p>Ahora puedes completar tu perfil de empresa y solicitar tu membresía.</p>
        <p>Saludos,<br>El equipo del Cluster Alimentos Guanajuato</p>
      `,
    };
  },

  // Plantilla para aprobación de membresía
  membershipApproved: (name: string, companyName: string): { subject: string; html: string } => {
    return {
      subject: 'Tu membresía ha sido aprobada',
      html: `
        <h1>Felicidades, ${name}!</h1>
        <p>Tu solicitud de membresía para <strong>${companyName}</strong> ha sido aprobada.</p>
        <p>Ahora formas parte oficialmente del Cluster Alimentos Guanajuato.</p>
        <p>Saludos,<br>El equipo del Cluster Alimentos Guanajuato</p>
      `,
    };
  },

  // Plantilla para recordatorio de renovación
  renewalReminder: (name: string, companyName: string, renewalDate: Date): { subject: string; html: string } => {
    const formattedDate = new Date(renewalDate).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      subject: 'Recordatorio de renovación de membresía',
      html: `
        <h1>Hola, ${name}</h1>
        <p>Te recordamos que la membresía de <strong>${companyName}</strong> vence el <strong>${formattedDate}</strong>.</p>
        <p>Para continuar disfrutando de los beneficios del Cluster Alimentos Guanajuato, te recomendamos renovar tu membresía antes de la fecha de vencimiento.</p>
        <p>Saludos,<br>El equipo del Cluster Alimentos Guanajuato</p>
      `,
    };
  },

  // Plantilla para recuperación de contraseña
  passwordReset: (name: string, resetToken: string): { subject: string; html: string } => {
    return {
      subject: 'Recuperación de contraseña',
      html: `
        <h1>Hola, ${name}</h1>
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Utiliza el siguiente token para restablecer tu contraseña:</p>
        <p><strong>${resetToken}</strong></p>
        <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
        <p>Saludos,<br>El equipo del Cluster Alimentos Guanajuato</p>
      `,
    };
  },
};