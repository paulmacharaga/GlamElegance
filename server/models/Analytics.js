const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const Analytics = {
  // Create a new analytics event
  async createEvent({ type, metadata, bookingId, feedbackId }) {
    try {
      const event = await prisma.analytics.create({
        data: {
          type,
          metadata: JSON.stringify(metadata || {}),
          bookingId: bookingId || null,
          feedbackId: feedbackId || null
        }
      });
      // Parse metadata back to object for consistency
      return {
        ...event,
        metadata: JSON.parse(event.metadata || '{}')
      };
    } catch (error) {
      console.error('Error creating analytics event:', error);
      throw error;
    }
  },

  // Get analytics events with optional filters
  async getEvents({ type, startDate, endDate, limit = 100 }) {
    try {
      const where = {};
      
      if (type) where.type = type;
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      const events = await prisma.analytics.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit
      });
      
      // Parse metadata for each event
      return events.map(event => ({
        ...event,
        metadata: JSON.parse(event.metadata || '{}')
      }));
    } catch (error) {
      console.error('Error fetching analytics events:', error);
      throw error;
    }
  }
};

module.exports = Analytics;
