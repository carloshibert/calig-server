import { Request, Response } from 'express';
import User from '../models/User';
import Company from '../models/Company';
import Membership from '../models/Membership';
import { logger } from '../utils/logger';

// Obtener estadísticas del sistema
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Contar usuarios por rol
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const memberUsers = await User.countDocuments({ role: 'member' });

    // Contar empresas por sector
    const totalCompanies = await Company.countDocuments();
    const publishedCompanies = await Company.countDocuments({ isPublished: true });
    const unpublishedCompanies = await Company.countDocuments({ isPublished: false });

    // Obtener distribución por sector
    const sectorDistribution = await Company.aggregate([
      { $group: { _id: '$sector', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Contar membresías por estado
    const totalMemberships = await Membership.countDocuments();
    const activeMemberships = await Membership.countDocuments({ status: 'active' });
    const pendingMemberships = await Membership.countDocuments({ status: 'pending' });
    const expiredMemberships = await Membership.countDocuments({ status: 'expired' });

    // Contar membresías por estado de pago
    const paidMemberships = await Membership.countDocuments({ paymentStatus: 'paid' });
    const pendingPayments = await Membership.countDocuments({ paymentStatus: 'pending' });
    const overdueMemberships = await Membership.countDocuments({ paymentStatus: 'overdue' });

    // Membresías próximas a renovar (en los próximos 30 días)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const upcomingRenewals = await Membership.countDocuments({
      status: 'active',
      renewalDate: { $lte: thirtyDaysFromNow, $gte: new Date() }
    });

    res.json({
      users: {
        total: totalUsers,
        admin: adminUsers,
        member: memberUsers
      },
      companies: {
        total: totalCompanies,
        published: publishedCompanies,
        unpublished: unpublishedCompanies,
        sectorDistribution
      },
      memberships: {
        total: totalMemberships,
        active: activeMemberships,
        pending: pendingMemberships,
        expired: expiredMemberships,
        paid: paidMemberships,
        pendingPayment: pendingPayments,
        overdue: overdueMemberships,
        upcomingRenewals
      }
    });
  } catch (error) {
    logger.error(`Error al obtener estadísticas: ${error}`);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

// Listar usuarios con posibilidad de filtrado
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.query;
    
    let query = {};
    
    // Aplicar filtro por rol si se proporciona
    if (role) {
      query = { role };
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    logger.error(`Error al listar usuarios: ${error}`);
    res.status(500).json({ message: 'Error al listar usuarios' });
  }
};

// Activar/desactivar usuario
/**
 * @desc    Activar/Desactivar un usuario
 * @route   PUT /api/admin/users/:id/status
 * @access  Private/Admin
 */
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      res.status(400).json({ message: 'El estado de activación es requerido' });
      return;
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive
    });
  } catch (error) {
    logger.error(`Error al actualizar estado de usuario: ${error}`);
    res.status(500).json({ message: 'Error al actualizar estado de usuario' });
  }
};

// Cambiar rol de usuario
export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    
    if (!role || !['admin', 'member'].includes(role)) {
      res.status(400).json({ message: 'Rol no válido' });
      return;
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    user.role = role;
    await user.save();

    res.json({
      message: 'Rol de usuario actualizado correctamente',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    logger.error(`Error al cambiar rol de usuario: ${error}`);
    res.status(500).json({ message: 'Error al cambiar rol de usuario' });
  }
};