import mongoose, { Document, Schema } from 'mongoose';

export interface IMembership extends Document {
  userId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  startDate: Date;
  renewalDate: Date;
  status: 'active' | 'pending' | 'expired';
  paymentStatus: 'paid' | 'pending' | 'overdue';
  membershipLevel: string;
  paymentHistory: {
    date: Date;
    amount: number;
    description: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    renewalDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'expired'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'overdue'],
      default: 'pending',
    },
    membershipLevel: {
      type: String,
      required: true,
      default: 'Estándar',
    },
    paymentHistory: [
      {
        date: {
          type: Date,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMembership>('Membership', MembershipSchema);