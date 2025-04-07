import mongoose, { Document, Schema } from 'mongoose';

export interface ICompany extends Document {
  userId: mongoose.Types.ObjectId;
  companyName: string;
  logo: string;
  sector: string;
  description: string;
  contactInfo: {
    address: string;
    phone: string;
    email: string;
    website: string;
  };
  socialMedia: {
    facebook: string;
    instagram: string;
    linkedin: string;
    twitter: string;
  };
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyName: {
      type: String,
      required: [true, 'El nombre de la empresa es obligatorio'],
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    sector: {
      type: String,
      required: [true, 'El sector es obligatorio'],
      enum: ['Servicios Financieros', 'Frescos', 'Cárnicos', 'Lácteos', 'Procesados', 'Bebidas', 'Tecnología', 'Logística', 'Consultoría', 'Otro'],
    },
    description: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
    },
    contactInfo: {
      address: {
        type: String,
        required: [true, 'La dirección es obligatoria'],
      },
      phone: {
        type: String,
        required: [true, 'El teléfono es obligatorio'],
      },
      email: {
        type: String,
        required: [true, 'El email de contacto es obligatorio'],
        lowercase: true,
      },
      website: {
        type: String,
        default: '',
      },
    },
    socialMedia: {
      facebook: {
        type: String,
        default: '',
      },
      instagram: {
        type: String,
        default: '',
      },
      linkedin: {
        type: String,
        default: '',
      },
      twitter: {
        type: String,
        default: '',
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICompany>('Company', CompanySchema);