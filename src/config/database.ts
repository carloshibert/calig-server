import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cluster-alimentos';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('✅Conexión a MongoDB establecida correctamente');
  } catch (error) {
    logger.error(`❌ Error al conectar a MongoDB: ${error}`);
    process.exit(1);
  }
};