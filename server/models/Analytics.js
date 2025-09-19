const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const Analytics = {
  // Create a new analytics event
  async createEvent({ type, metadata, bookingId, feedbackId }) {
    try {
      // Validate required fields
      if (!type) {
        console.error('Analytics createEvent: Missing required field "type"');
        throw new Error('Analytics event type is required');
      }
      
      // Ensure metadata is an object
      const metadataObj = metadata || {};
      
      // Safely stringify metadata
      let metadataStr;
      try {
        metadataStr = JSON.stringify(metadataObj);
      } catch (jsonError) {
        console.error('Error stringifying metadata:', jsonError);
        metadataStr = '{}';
      }
      
      console.log('Creating analytics event:', {
        type,
        metadataKeys: Object.keys(metadataObj),
        bookingId: bookingId || 'null',
        feedbackId: feedbackId || 'null'
      });
      
      const event = await prisma.analytics.create({
        data: {
          type,
          metadata: metadataStr,
          bookingId: bookingId || null,
          feedbackId: feedbackId || null
        }
      });
      
      console.log('Analytics event created successfully:', event.id);
      
      // Parse metadata back to object for consistency
      return {
        ...event,
        metadata: JSON.parse(event.metadata || '{}')
      };
    } catch (error) {
      console.error('Error creating analytics event:', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      // Don't throw the error, return a failure object instead
      return {
        error: true,
        message: error.message,
        code: error.code
      };
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
