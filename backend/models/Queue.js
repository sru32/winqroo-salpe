import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  position: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'waiting'
  },
  estimatedWaitTime: {
    type: Number, // in minutes
    default: 0
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queue queries
queueSchema.index({ shop: 1, service: 1, status: 1 });
queueSchema.index({ customer: 1, status: 1 });

export default mongoose.model('Queue', queueSchema);

