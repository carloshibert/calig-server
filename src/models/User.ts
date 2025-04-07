import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
  generateAuthToken(): string; // Add this method
  getResetPasswordToken(): string;
}

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
  },
  firstName: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'El apellido es obligatorio'],
    trim: true,
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member',
  },
  isActive: {
    type: Boolean,
    default: true
  },
}, {
  timestamps: true
});

// Middleware para hashear la contraseña antes de guardar
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para generar un token de autenticación
UserSchema.methods.generateAuthToken = function (): string {
// Import JWT for token generation
// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate JWT token with user information
const token = jwt.sign(
  { 
    id: this._id,
    email: this.email,
    role: this.role 
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);

return token;
}

// Make sure the export is correct
const User = mongoose.model<IUser>('User', UserSchema);
export default User;