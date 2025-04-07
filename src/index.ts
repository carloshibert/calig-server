import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { logger } from './utils/logger';

// Importar rutas
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import membershipRoutes from './routes/membership.routes';
import adminRoutes from './routes/admin.routes';

// Configuración de variables de entorno
dotenv.config();

// Inicialización de la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Conectar a la base de datos
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
  res.json({ message: '👌 API del Cluster Alimentos Guanajuato funcionando correctamente' });
});

// Configuración de rutas
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/admin', adminRoutes);

// Middleware para manejo de rutas no encontradas
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware para manejo de errores
app.use((err: Error, req: Request, res: Response, next: Function) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ message: 'Error interno del servidor' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  logger.info(`✅ Servidor corriendo en http://localhost:${PORT}`);
});