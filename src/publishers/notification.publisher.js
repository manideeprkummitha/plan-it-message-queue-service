import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { rabbitmq } from '../lib/rabbitmq.js';

class NotificationPublisher {
  async publishNotification(notification) {
    try {
      if (!rabbitmq.channel) {
        await rabbitmq.connect();
      }

      // Add timestamp if not present
      if (!notification.timestamp) {
        notification.timestamp = new Date().toISOString();
      }

      // Determine routing key based on notification type
      let routingKey = 'notification.default';
      if (notification.type) {
        routingKey = `notification.${notification.type}`;
      }
      if (notification.urgent) {
        routingKey = `notification.urgent.${notification.type || 'default'}`;
      }

      // Publish to exchange
      const success = rabbitmq.channel.publish(
        config.rabbitmq.exchange.name,
        routingKey,
        Buffer.from(JSON.stringify(notification)),
        { persistent: true } // Make message persistent
      );

      if (success) {
        logger.info(`Published notification to ${routingKey}`, { 
          notificationId: notification.id,
          userId: notification.userId
        });
        return true;
      } else {
        logger.warn('Channel write buffer is full - could not publish notification immediately');
        return false;
      }
    } catch (error) {
      logger.error('Error publishing notification', { error: error.message });
      throw error;
    }
  }
}

export const notificationPublisher = new NotificationPublisher();