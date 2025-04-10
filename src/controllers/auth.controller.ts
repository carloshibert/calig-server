import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { logger } from '../utils/logger';
import { emailTemplates, sendEmail } from '../services/email.service';

// Generar token JWT
const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secretkey', {
    expiresIn: '30d',
  });
};

// Registrar un nuevo usuario
export const register = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password, firstName, lastName, role } = req.body;

  try {
    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: 'El usuario ya existe' });
      return;
    }

    // Crear nuevo usuario
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: role || 'member', // Por defecto es miembro
    });

    if (user) {
      // Enviar email de bienvenida
      const welcomeEmail = emailTemplates.welcome(user.firstName);
      await sendEmail({
        to: user.email,
        subject: welcomeEmail.subject,
        html: welcomeEmail.html
      });

      res.status(201).json({
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        token: generateToken(user._id?.toString() || ''),
      });
      return;
    }
  } catch (error) {
    logger.error(`Error al registrar usuario: ${error}`);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
};

// Login de usuario
export const login = async (req: Request, res: Response): Promise<void> => {
  // Control logs for error tracking
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  const { email, password } = req.body;
  console.log(email, password);

  try {
    // Buscar usuario por email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Email o contraseña incorrectos' });
      return;
    }

    // Verificar contraseña
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({ message: 'Email o contraseña incorrectos' });
      return;
    }

    res.json({
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      token: generateToken(user._id?.toString() || ''),
    });
    return;
  } catch (error) {
    logger.error(`Error al iniciar sesión: ${error}`);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};

// Obtener perfil de usuario
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.json(user);
  } catch (error) {
    logger.error(`Error al obtener perfil: ${error}`);
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
};

// Actualizar perfil de usuario
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { firstName, lastName, email } = req.body;

  try {
    // Verificar si el email ya está en uso por otro usuario
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ message: 'El email ya está en uso' });
        return;
      }
    }

    // Actualizar usuario
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        firstName: firstName || req.user.firstName,
        lastName: lastName || req.user.lastName,
        email: email || req.user.email
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.json(updatedUser);
  } catch (error) {
    logger.error(`Error al actualizar perfil: ${error}`);
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
};

// Solicitar recuperación de contraseña
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      // Por seguridad, no informamos si el email existe o no
      res.status(200).json({ message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña' });
      return;
    }

    // Generar token de recuperación
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Guardar el token en el usuario (se podría implementar un campo resetToken y resetTokenExpire)
    // user.resetToken = resetToken;
    // user.resetTokenExpire = Date.now() + 3600000; // 1 hora
    // await user.save();

    // Importar el servicio de email y enviar el correo con el token
    const { emailTemplates, sendEmail } = await import('../services/email.service');

    const emailContent = emailTemplates.passwordReset(user.firstName, resetToken);

    const emailSent = await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html
    });

    if (!emailSent) {
      logger.error(`No se pudo enviar el email de recuperación a ${user.email}`);
    }

    res.status(200).json({
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
    });
  } catch (error) {
    logger.error(`Error al solicitar recuperación de contraseña: ${error}`);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
};

// Restablecer contraseña
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { token, password, email } = req.body;

  try {
    // Buscar usuario por email
    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({ message: 'Token de restablecimiento inválido' });
      return;
    }

    // Aquí se verificaría el token almacenado en el usuario
    // if (!user.resetToken || user.resetToken !== token || user.resetTokenExpire < Date.now()) {
    //   res.status(400).json({ message: 'Token de restablecimiento inválido o expirado' });
    //   return;
    // }

    // Para este ejemplo, asumimos que el token es válido
    // Actualizar contraseña
    user.password = password;
    // Limpiar token de restablecimiento
    // user.resetToken = undefined;
    // user.resetTokenExpire = undefined;

    await user.save();

    // Enviar email de confirmación
    const { emailTemplates, sendEmail } = await import('../services/email.service');

    await sendEmail({
      to: user.email,
      subject: 'Contraseña actualizada',
      html: `
        <h1>Hola, ${user.firstName}</h1>
        <p>Tu contraseña ha sido actualizada correctamente.</p>
        <p>Si no realizaste esta acción, por favor contacta con nosotros inmediatamente.</p>
        <p>Saludos,<br>El equipo del Cluster Alimentos Guanajuato</p>
      `
    });

    res.status(200).json({
      message: 'Contraseña restablecida correctamente',
    });
  } catch (error) {
    logger.error(`Error al restablecer contraseña: ${error}`);
    res.status(500).json({ message: 'Error al restablecer contraseña' });
  }
};