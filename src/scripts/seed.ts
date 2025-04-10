import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import User from '../models/User';
import Company from '../models/Company';
import Membership from '../models/Membership';
import { logger } from '../utils/logger';

dotenv.config();

// Datos de usuarios para seeding
const users = [
  {
    email: 'admin@clusteralimentos.com',
    password: 'Admin123!',
    firstName: 'Administrador',
    lastName: 'Principal',
    role: 'admin',
    isActive: true
  },
  {
    email: 'juan.perez@empresa1.com',
    password: 'Empresa1!',
    firstName: 'Juan',
    lastName: 'Pérez',
    role: 'member',
    isActive: true
  },
  {
    email: 'maria.lopez@empresa2.com',
    password: 'Empresa2!',
    firstName: 'María',
    lastName: 'López',
    role: 'member',
    isActive: true
  },
  {
    email: 'carlos.rodriguez@empresa3.com',
    password: 'Empresa3!',
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    role: 'member',
    isActive: true
  },
  {
    email: 'laura.martinez@empresa4.com',
    password: 'Empresa4!',
    firstName: 'Laura',
    lastName: 'Martínez',
    role: 'member',
    isActive: true
  }
];

// Función para crear empresas basadas en los usuarios creados
const createCompanies = async (createdUsers: any[]) => {
  const companies = [];
  
  // Empresa 1 - Sector Bebidas
  companies.push({
    userId: createdUsers[1]._id, // Juan Pérez
    companyName: 'Bebidas Guanajuato',
    logo: 'https://via.placeholder.com/150',
    sector: 'Bebidas',
    description: 'Empresa dedicada a la producción de bebidas artesanales en Guanajuato.',
    contactInfo: {
      address: 'Calle Principal 123, León, Guanajuato',
      phone: '4771234567',
      email: 'contacto@bebidasguanajuato.com',
      website: 'www.bebidasguanajuato.com'
    },
    socialMedia: {
      facebook: 'facebook.com/bebidasguanajuato',
      instagram: 'instagram.com/bebidasguanajuato',
      linkedin: 'linkedin.com/company/bebidasguanajuato',
      twitter: 'twitter.com/bebidasgto'
    },
    isPublished: true
  });
  
  // Empresa 2 - Sector Lácteos
  companies.push({
    userId: createdUsers[2]._id, // María López
    companyName: 'Lácteos del Bajío',
    logo: 'https://via.placeholder.com/150',
    sector: 'Lácteos',
    description: 'Producción y distribución de productos lácteos de alta calidad en la región del Bajío.',
    contactInfo: {
      address: 'Av. Industrial 456, Irapuato, Guanajuato',
      phone: '4621234567',
      email: 'info@lacteosdelbajio.com',
      website: 'www.lacteosdelbajio.com'
    },
    socialMedia: {
      facebook: 'facebook.com/lacteosdelbajio',
      instagram: 'instagram.com/lacteosdelbajio',
      linkedin: 'linkedin.com/company/lacteosdelbajio',
      twitter: 'twitter.com/lacteosbajio'
    },
    isPublished: true
  });
  
  // Empresa 3 - Sector Cárnicos
  companies.push({
    userId: createdUsers[3]._id, // Carlos Rodríguez
    companyName: 'Cárnicos Premium',
    logo: 'https://via.placeholder.com/150',
    sector: 'Cárnicos',
    description: 'Especialistas en cortes premium y productos cárnicos de alta calidad.',
    contactInfo: {
      address: 'Blvd. Torres Landa 789, Celaya, Guanajuato',
      phone: '4611234567',
      email: 'ventas@carnicospremium.com',
      website: 'www.carnicospremium.com'
    },
    socialMedia: {
      facebook: 'facebook.com/carnicospremium',
      instagram: 'instagram.com/carnicospremium',
      linkedin: 'linkedin.com/company/carnicospremium',
      twitter: 'twitter.com/carnicospremium'
    },
    isPublished: true
  });
  
  // Empresa 4 - Sector Procesados
  companies.push({
    userId: createdUsers[4]._id, // Laura Martínez
    companyName: 'Alimentos Procesados del Centro',
    logo: 'https://via.placeholder.com/150',
    sector: 'Procesados',
    description: 'Empresa dedicada a la elaboración de alimentos procesados con los más altos estándares de calidad.',
    contactInfo: {
      address: 'Parque Industrial 1011, Salamanca, Guanajuato',
      phone: '4641234567',
      email: 'info@alimentosprocesados.com',
      website: 'www.alimentosprocesados.com'
    },
    socialMedia: {
      facebook: 'facebook.com/alimentosprocesados',
      instagram: 'instagram.com/alimentosprocesados',
      linkedin: 'linkedin.com/company/alimentosprocesados',
      twitter: 'twitter.com/alimentospc'
    },
    isPublished: true
  });
  
  // Crear las empresas en la base de datos
  const createdCompanies = [];
  for (const company of companies) {
    const newCompany = await Company.create(company);
    createdCompanies.push(newCompany);
  }
  
  return createdCompanies;
};

// Función para crear membresías basadas en las empresas creadas
const createMemberships = async (createdCompanies: any[]) => {
  const memberships = [];
  
  // Fechas para las membresías
  const currentDate = new Date();
  const oneYearLater = new Date(currentDate);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  
  // Membresía para Empresa 1
  memberships.push({
    userId: createdCompanies[0].userId,
    companyId: createdCompanies[0]._id,
    startDate: currentDate,
    renewalDate: oneYearLater,
    status: 'active',
    paymentStatus: 'paid',
    membershipLevel: 'Premium',
    paymentHistory: [
      {
        date: currentDate,
        amount: 5000,
        description: 'Pago inicial de membresía Premium'
      }
    ]
  });
  
  // Membresía para Empresa 2
  memberships.push({
    userId: createdCompanies[1].userId,
    companyId: createdCompanies[1]._id,
    startDate: currentDate,
    renewalDate: oneYearLater,
    status: 'active',
    paymentStatus: 'paid',
    membershipLevel: 'Estándar',
    paymentHistory: [
      {
        date: currentDate,
        amount: 3000,
        description: 'Pago inicial de membresía Estándar'
      }
    ]
  });
  
  // Membresía para Empresa 3
  memberships.push({
    userId: createdCompanies[2].userId,
    companyId: createdCompanies[2]._id,
    startDate: currentDate,
    renewalDate: oneYearLater,
    status: 'active',
    paymentStatus: 'paid',
    membershipLevel: 'Premium',
    paymentHistory: [
      {
        date: currentDate,
        amount: 5000,
        description: 'Pago inicial de membresía Premium'
      }
    ]
  });
  
  // Membresía para Empresa 4
  memberships.push({
    userId: createdCompanies[3].userId,
    companyId: createdCompanies[3]._id,
    startDate: currentDate,
    renewalDate: oneYearLater,
    status: 'active',
    paymentStatus: 'paid',
    membershipLevel: 'Estándar',
    paymentHistory: [
      {
        date: currentDate,
        amount: 3000,
        description: 'Pago inicial de membresía Estándar'
      }
    ]
  });
  
  // Crear las membresías en la base de datos
  const createdMemberships = [];
  for (const membership of memberships) {
    const newMembership = await Membership.create(membership);
    createdMemberships.push(newMembership);
  }
  
  return createdMemberships;
};

// Función principal para ejecutar el seeding
const seedDatabase = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();
    
    // Limpiar la base de datos antes de hacer el seeding
    await User.deleteMany({});
    await Company.deleteMany({});
    await Membership.deleteMany({});
    
    logger.info('Base de datos limpiada correctamente');
    
    // Crear usuarios
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }
    
    logger.info(`${createdUsers.length} usuarios creados correctamente`);
    
    // Crear empresas
    const createdCompanies = await createCompanies(createdUsers);
    logger.info(`${createdCompanies.length} empresas creadas correctamente`);
    
    // Crear membresías
    const createdMemberships = await createMemberships(createdCompanies);
    logger.info(`${createdMemberships.length} membresías creadas correctamente`);
    
    logger.info('✅ Seeding completado exitosamente');
    
    // Cerrar la conexión a la base de datos
    await mongoose.disconnect();
    logger.info('Conexión a la base de datos cerrada');
    
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Error durante el seeding: ${error}`);
    // Cerrar la conexión a la base de datos en caso de error
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Ejecutar el seeding
seedDatabase();