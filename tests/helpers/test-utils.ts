import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../../src/models/User';
import Company from '../../src/models/Company';
import Membership from '../../src/models/Membership';

// Función para generar un token JWT para pruebas
export const generateTestToken = (userId: string, role: string = 'member'): string => {
  // Definir el secreto como string
  const secret = process.env.JWT_SECRET || 'test-jwt-secret-key';
  // Definir las opciones de firma
  const options: jwt.SignOptions = { expiresIn: process.env.JWT_EXPIRES_IN as any || '1 day' };
  // Generar y retornar el token
  return jwt.sign({ id: userId, role }, secret, options);
};

// Función para crear un usuario de prueba
export const createTestUser = async (userData: Partial<any> = {}): Promise<any> => {
  const defaultUser = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test', // Make sure these required fields are included
    lastName: 'User',  // Make sure these required fields are included
    role: 'member',    // Change from 'user' to 'member' to match your enum
    isActive: true
  };

  const user = new User({
    ...defaultUser,
    ...userData
  });

  await user.save();
  return user;
};

// Función para crear una empresa de prueba
export const createTestCompany = async (companyData: Partial<any> = {}, userId?: string): Promise<any> => {
  // Si no se proporciona un userId, crear un usuario de prueba
  if (!userId) {
    const user = await createTestUser();
    userId = user._id;
  }

  const defaultCompany = {
    userId: userId,
    companyName: 'Test Company',
    sector: 'Bebidas', // Usando un valor válido del enum
    description: 'Empresa de prueba',
    contactInfo: {
      address: 'Dirección de prueba',
      phone: '4771234567',
      email: 'company@test.com',
      website: 'https://testcompany.com'
    },
    socialMedia: {
      facebook: '',
      instagram: '',
      linkedin: '',
      twitter: ''
    },
    isPublished: true
  };

  const company = await Company.create({
    ...defaultCompany,
    ...companyData
  });
  return company;
};

// Función para crear una membresía de prueba
export const createTestMembership = async (membershipData: Partial<any> = {}, companyId?: string): Promise<any> => {
  // Si no se proporciona un companyId, crear una empresa de prueba
  if (!companyId) {
    const company = await createTestCompany();
    companyId = company._id;
  }

  const defaultMembership = {
    company: companyId,
    type: 'basic',
    status: 'active',
    startDate: new Date(),
    renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Un año después
    paymentStatus: 'paid',
    ...membershipData
  };

  const membership = await Membership.create(defaultMembership);
  return membership;
};

// Función para limpiar la base de datos de prueba
export const clearDatabase = async (): Promise<void> => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

// Mock para Request y Response de Express
export const mockRequest = (data: any = {}): Partial<Request> => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ...data
  };
};

export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Mock para el servicio de email
export const mockEmailService = (): void => {
  jest.mock('../../src/services/email.service', () => ({
    sendEmail: jest.fn().mockResolvedValue(true)
  }));
};