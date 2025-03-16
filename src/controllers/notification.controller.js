import { notificationPublisher } from '../publishers/notification.publisher.js';
import { logger } from '../utils/logger.js';

class NotificationController {
  async createNotification(req, res) {
    try {
      const notification = req.body;
      
      // Validate required fields
      if (!notification.userId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required field: userId'
        });
      }
      
      if (!notification.title) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required field: title'
        });
      }
      
      // Ensure notification has an ID
      notification.id = notification.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Publish to queue
      await notificationPublisher.publishNotification(notification);
      
      // Return success response
      return res.status(201).json({
        success: true,
        message: 'Notification published successfully',
        notificationId: notification.id
      });
    } catch (error) {
      logger.error('Error in createNotification controller', { error: error.message });
      return res.status(500).json({
        success: false,
        error: 'Failed to publish notification'
      });
    }
  }
}

export const notificationController = new NotificationController();