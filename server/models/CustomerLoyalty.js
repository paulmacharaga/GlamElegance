const mongoose = require('mongoose');

const customerLoyaltySchema = new mongoose.Schema({
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  points: {
    type: Number,
    default: 0
  },
  totalPointsEarned: {
    type: Number,
    default: 0
  },
  totalPointsRedeemed: {
    type: Number,
    default: 0
  },
  rewardsRedeemed: {
    type: Number,
    default: 0
  },
  pointsHistory: [{
    points: Number,
    type: {
      type: String,
      enum: ['earned', 'redeemed']
    },
    source: {
      type: String,
      enum: ['booking', 'purchase', 'reward', 'manual', 'other']
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    description: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
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
customerLoyaltySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to add points
customerLoyaltySchema.methods.addPoints = async function(points, source, bookingId, description) {
  this.points += points;
  this.totalPointsEarned += points;
  
  this.pointsHistory.push({
    points,
    type: 'earned',
    source,
    bookingId,
    description
  });
  
  return this.save();
};

// Method to redeem points
customerLoyaltySchema.methods.redeemPoints = async function(points, source, bookingId, description) {
  if (this.points < points) {
    throw new Error('Insufficient points');
  }
  
  this.points -= points;
  this.totalPointsRedeemed += points;
  this.rewardsRedeemed += 1;
  
  this.pointsHistory.push({
    points,
    type: 'redeemed',
    source,
    bookingId,
    description
  });
  
  return this.save();
};

module.exports = mongoose.model('CustomerLoyalty', customerLoyaltySchema);
