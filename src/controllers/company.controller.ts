import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Company from '../models/Company';
import { logger } from '../utils/logger';

// Crear perfil de empresa
export const createCompany = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    // Verificar si el usuario ya tiene una empresa registrada
    const existingCompany = await Company.findOne({ userId: req.user._id });

    if (existingCompany) {
      res.status(400).json({ message: 'Ya tienes una empresa registrada' });
      return;
    }

    const company = new Company({
      ...req.body,
      userId: req.user._id,
    });

    const savedCompany = await company.save();

    res.status(201).json(savedCompany);
  } catch (error) {
    logger.error(`Error al crear perfil de empresa: ${error}`);
    res.status(500).json({ message: 'Error al crear perfil de empresa' });
  }
};

// Obtener todas las empresas (con filtros opcionales)
export const getCompanies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sector } = req.query;
    
    let query = {};
    
    // Aplicar filtro por sector si se proporciona
    if (sector) {
      query = { sector };
    }

    // Solo mostrar empresas publicadas para usuarios normales
    if (req.user.role !== 'admin') {
      Object.assign(query, { isPublished: true });
    }

    const companies = await Company.find(query).sort({ companyName: 1 });

    res.json(companies);
  } catch (error) {
    logger.error(`Error al obtener empresas: ${error}`);
    res.status(500).json({ message: 'Error al obtener empresas' });
  }
};

// Obtener detalle de una empresa
export const getCompanyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      res.status(404).json({ message: 'Empresa no encontrada' });
      return;
    }

    // Verificar si la empresa está publicada o si el usuario es admin o dueño
    if (!company.isPublished && req.user.role !== 'admin' && company.userId.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'No tienes permiso para ver esta empresa' });
      return;
    }

    res.json(company);
  } catch (error) {
    logger.error(`Error al obtener detalle de empresa: ${error}`);
    res.status(500).json({ message: 'Error al obtener detalle de empresa' });
  }
};

// Actualizar perfil de empresa
export const updateCompany = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      res.status(404).json({ message: 'Empresa no encontrada' });
      return;
    }

    // Verificar si el usuario es admin o dueño de la empresa
    if (req.user.role !== 'admin' && company.userId.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'No tienes permiso para actualizar esta empresa' });
      return;
    }

    // Actualizar campos
    Object.assign(company, req.body);

    const updatedCompany = await company.save();

    res.json(updatedCompany);
  } catch (error) {
    logger.error(`Error al actualizar perfil de empresa: ${error}`);
    res.status(500).json({ message: 'Error al actualizar perfil de empresa' });
  }
};

// Eliminar perfil de empresa
export const deleteCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      res.status(404).json({ message: 'Empresa no encontrada' });
      return;
    }

    // Solo admin puede eliminar cualquier empresa
    // Un usuario normal solo puede eliminar su propia empresa
    if (req.user.role !== 'admin' && company.userId.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'No tienes permiso para eliminar esta empresa' });
      return;
    }

    await company.deleteOne();

    res.json({ message: 'Empresa eliminada correctamente' });
  } catch (error) {
    logger.error(`Error al eliminar perfil de empresa: ${error}`);
    res.status(500).json({ message: 'Error al eliminar perfil de empresa' });
  }
};

// Cambiar estado de publicación (publicar/despublicar)
export const togglePublishStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      res.status(404).json({ message: 'Empresa no encontrada' });
      return;
    }

    // Verificar si el usuario es admin o dueño de la empresa
    if (req.user.role !== 'admin' && company.userId.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'No tienes permiso para cambiar el estado de esta empresa' });
      return;
    }

    company.isPublished = !company.isPublished;
    await company.save();

    res.json({
      message: company.isPublished ? 'Empresa publicada correctamente' : 'Empresa despublicada correctamente',
      isPublished: company.isPublished
    });
    return;
  } catch (error) {
    logger.error(`Error al cambiar estado de publicación: ${error}`);
    res.status(500).json({ message: 'Error al cambiar estado de publicación' });
  }
};