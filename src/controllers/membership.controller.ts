import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Membership from '../models/Membership';
import Company from '../models/Company';
import { logger } from '../utils/logger';
import moment from 'moment';

// Solicitar nueva membresía
export const applyMembership = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    // Verificar si el usuario tiene una empresa registrada
    const company = await Company.findOne({ userId: req.user._id });

    if (!company) {
      res.status(400).json({ message: 'Debes registrar una empresa antes de solicitar membresía' });
      return;
    }

    // Verificar si ya tiene una membresía activa o pendiente
    const existingMembership = await Membership.findOne({
      userId: req.user._id,
      status: { $in: ['active', 'pending'] }
    });

    if (existingMembership) {
      res.status(400).json({ message: 'Ya tienes una membresía activa o pendiente' });
      return;
    }

    const { membershipLevel, startDate } = req.body;

    // Calcular fecha de renovación (1 año después de la fecha de inicio)
    const start = startDate ? new Date(startDate) : new Date();
    const renewalDate = moment(start).add(1, 'year').toDate();

    const membership = new Membership({
      userId: req.user._id,
      companyId: company._id,
      membershipLevel,
      startDate: start,
      renewalDate,
      status: 'pending',
      paymentStatus: 'pending',
      paymentHistory: [],
    });

    const savedMembership = await membership.save();

    res.status(201).json(savedMembership);
  } catch (error) {
    logger.error(`Error al solicitar membresía: ${error}`);
    res.status(500).json({ message: 'Error al solicitar membresía' });
  }
};

// Obtener detalles de membresía actual del usuario
export const getCurrentMembership = async (req: Request, res: Response): Promise<void> => {
  try {
    const membership = await Membership.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('companyId', 'companyName sector');

    if (!membership) {
      res.status(404).json({ message: 'No tienes membresía registrada' });
      return;
    }

    res.json(membership);
  } catch (error) {
    logger.error(`Error al obtener membresía: ${error}`);
    res.status(500).json({ message: 'Error al obtener membresía' });
  }
};

// Listar todas las membresías (solo admin)
export const getAllMemberships = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, paymentStatus } = req.query;
    
    let query = {};
    
    // Aplicar filtros si se proporcionan
    if (status) {
      Object.assign(query, { status });
    }
    
    if (paymentStatus) {
      Object.assign(query, { paymentStatus });
    }

    const memberships = await Membership.find(query)
      .populate('userId', 'email firstName lastName')
      .populate('companyId', 'companyName sector')
      .sort({ createdAt: -1 });

    res.json(memberships);
  } catch (error) {
    logger.error(`Error al listar membresías: ${error}`);
    res.status(500).json({ message: 'Error al listar membresías' });
  }
};

// Función para enviar recordatorios de renovación
export const sendRenewalReminders = async (req?: Request, res?: Response): Promise<void> => {
  try {
    // Definir el rango de fechas para enviar recordatorios (membresías que vencen en los próximos 30 días)
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    // Buscar membresías activas que vencen en los próximos 30 días
    const memberships = await Membership.find({
      status: 'active',
      renewalDate: { $gte: today, $lte: thirtyDaysFromNow }
    })
      .populate('userId', 'email firstName lastName')
      .populate('companyId', 'companyName');
    
    if (memberships.length === 0) {
      if (res) res.json({ message: 'No hay membresías próximas a vencer' });
      return;
    }
    
    // Importar servicio de email
    const { emailTemplates, sendEmail } = await import('../services/email.service');
    
    // Contador de emails enviados
    let emailsSent = 0;
    
    // Enviar recordatorios a cada usuario
    for (const membership of memberships) {
      const user = membership.userId as any;
      const company = membership.companyId as any;
      
      const emailContent = emailTemplates.renewalReminder(
        user.firstName,
        company.companyName,
        membership.renewalDate
      );
      
      const sent = await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html
      });
      
      if (sent) emailsSent++;
    }
    
    if (res) {
      res.json({
        message: `Se enviaron ${emailsSent} recordatorios de renovación`,
        totalMemberships: memberships.length
      });
    }
  } catch (error) {
    logger.error(`Error al enviar recordatorios de renovación: ${error}`);
    if (res) res.status(500).json({ message: 'Error al enviar recordatorios de renovación' });
  }
};

// Aprobar membresía
export const approveMembership = async (req: Request, res: Response): Promise<void> => {
  try {
    const membership = await Membership.findById(req.params.id)
      .populate('userId', 'email firstName lastName')
      .populate('companyId', 'companyName');

    if (!membership) {
      res.status(404).json({ message: 'Membresía no encontrada' });
      return;
    }

    if (membership.status === 'active') {
      res.status(400).json({ message: 'La membresía ya está activa' });
      return;
    }

    membership.status = 'active';
    membership.paymentStatus = 'paid';
    
    await membership.save();

    // Enviar email de notificación al usuario
    const { emailTemplates, sendEmail } = await import('../services/email.service');
    
    const user = membership.userId as any;
    const company = membership.companyId as any;
    
    const emailContent = emailTemplates.membershipApproved(
      user.firstName,
      company.companyName
    );
    
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html
    });

    res.json({
      message: 'Membresía aprobada correctamente',
      membership
    });
  } catch (error) {
    logger.error(`Error al aprobar membresía: ${error}`);
    res.status(500).json({ message: 'Error al aprobar membresía' });
  }
};

// Rechazar solicitud de membresía
export const rejectMembership = async (req: Request, res: Response): Promise<void> => {
  try {
    const membership = await Membership.findById(req.params.id);

    if (!membership) {
      res.status(404).json({ message: 'Membresía no encontrada' });
      return;
    }

    if (membership.status !== 'pending') {
      res.status(400).json({ message: 'Esta membresía no está pendiente de aprobación' });
      return;
    }

    membership.status = 'expired';
    await membership.save();

    // Aquí se implementaría el envío de notificación al usuario

    res.json({ message: 'Membresía rechazada correctamente', membership });
  } catch (error) {
    logger.error(`Error al rechazar membresía: ${error}`);
    res.status(500).json({ message: 'Error al rechazar membresía' });
  }
};

// Renovar membresía
export const renewMembership = async (req: Request, res: Response): Promise<void> => {
  try {
    const membership = await Membership.findById(req.params.id)
      .populate('userId', 'email firstName lastName')
      .populate('companyId', 'companyName');

    if (!membership) {
      res.status(404).json({ message: 'Membresía no encontrada' });
      return;
    }

    // Calcular nueva fecha de renovación (1 año después de la fecha actual o de la fecha de renovación anterior)
    const newRenewalDate = moment(membership.renewalDate > new Date() ? membership.renewalDate : new Date()).add(1, 'year').toDate();

    membership.renewalDate = newRenewalDate;
    membership.status = 'active';
    membership.paymentStatus = 'pending'; // Se debe registrar el pago después

    await membership.save();

    // Enviar email de notificación al usuario
    const { emailTemplates, sendEmail } = await import('../services/email.service');
    
    const user = membership.userId as any;
    const company = membership.companyId as any;
    
    await sendEmail({
      to: user.email,
      subject: 'Membresía renovada',
      html: `
        <h1>Hola, ${user.firstName}</h1>
        <p>Tu membresía para <strong>${company.companyName}</strong> ha sido renovada correctamente.</p>
        <p>La nueva fecha de vencimiento es: <strong>${newRenewalDate.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}</strong>.</p>
        <p>Saludos,<br>El equipo del Cluster Alimentos Guanajuato</p>
      `
    });

    res.json({ message: 'Membresía renovada correctamente', membership });
  } catch (error) {
    logger.error(`Error al renovar membresía: ${error}`);
    res.status(500).json({ message: 'Error al renovar membresía' });
  }
};

// Actualizar estado de membresía
export const updateMembershipStatus = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { status } = req.body;
    const membership = await Membership.findById(req.params.id);

    if (!membership) {
      res.status(404).json({ message: 'Membresía no encontrada' });
      return;
    }

    membership.status = status;
    await membership.save();

    res.json({ message: 'Estado de membresía actualizado correctamente', membership });
  } catch (error) {
    logger.error(`Error al actualizar estado de membresía: ${error}`);
    res.status(500).json({ message: 'Error al actualizar estado de membresía' });
  }
};

// Actualizar estado de pago
export const updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { paymentStatus } = req.body;
    const membership = await Membership.findById(req.params.id);

    if (!membership) {
      res.status(404).json({ message: 'Membresía no encontrada' });
      return;
    }

    membership.paymentStatus = paymentStatus;
    await membership.save();

    res.json({ message: 'Estado de pago actualizado correctamente', membership });
  } catch (error) {
    logger.error(`Error al actualizar estado de pago: ${error}`);
    res.status(500).json({ message: 'Error al actualizar estado de pago' });
  }
};

// Registrar pago
export const registerPayment = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const { amount, description, date } = req.body;
    const membership = await Membership.findById(req.params.id);

    if (!membership) {
      res.status(404).json({ message: 'Membresía no encontrada' });
      return;
    }

    const paymentDate = date ? new Date(date) : new Date();

    membership.paymentHistory.push({
      date: paymentDate,
      amount,
      description,
    });

    membership.paymentStatus = 'paid';
    await membership.save();

    res.json({ message: 'Pago registrado correctamente', membership });
  } catch (error) {
    logger.error(`Error al registrar pago: ${error}`);
    res.status(500).json({ message: 'Error al registrar pago' });
  }
};

// Listar solicitudes pendientes
export const getPendingMemberships = async (req: Request, res: Response): Promise<void> => {
  try {
    const pendingMemberships = await Membership.find({ status: 'pending' })
      .populate('userId', 'email firstName lastName')
      .populate('companyId', 'companyName sector')
      .sort({ createdAt: 1 });

    res.json(pendingMemberships);
  } catch (error) {
    logger.error(`Error al listar solicitudes pendientes: ${error}`);
    res.status(500).json({ message: 'Error al listar solicitudes pendientes' });
  }
};