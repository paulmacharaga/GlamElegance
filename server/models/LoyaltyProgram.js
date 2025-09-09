const mongoose = require('mongoose');

const loyaltyProgramSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  pointsPerBooking: {
    type: Number,
    required: true,
    default: 10
  },
  pointsPerDollar: {
    type: Number,
    required: true,
    default: 1
  },
  rewardThreshold: {
    type: Number,
    required: true,
    default: 100
  },
  rewardAmount: {
    type: Number,
    required: true,
    default: 10 // $10 discount
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
loyaltyProgramSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('LoyaltyProgram', loyaltyProgramSchema);
