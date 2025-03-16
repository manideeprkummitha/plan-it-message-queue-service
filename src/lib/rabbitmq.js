import amqp from 'amqplib';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

class RabbitMQConnection {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      // Create connection
      this.connection = await amqp.connect(config.rabbitmq.url);
      logger.info('Connected to RabbitMQ');

      // Create channel
      this.channel = await this.connection.createChannel();
      logger.info('Created RabbitMQ channel');

      // Setup exchange
      const { name, type, options } = config.rabbitmq.exchange;
      await this.channel.assertExchange(name, type, options);
      logger.info(`Asserted exchange: ${name}`);

      // Setup queues
      for (const key in config.rabbitmq.queues) {
        const queue = config.rabbitmq.queues[key];
        await this.channel.assertQueue(queue.name, queue.options);
        await this.channel.bindQueue(queue.name, name, queue.bindingKey);
        logger.info(`Asserted and bound queue: ${queue.name} with binding key: ${queue.bindingKey}`);
      }

      // Handle connection close
      this.connection.on('close', () => {
        logger.error('RabbitMQ connection closed');
        this.reconnect();
      });

      return this.channel;
    } catch (error) {
      logger.error('Error connecting to RabbitMQ', { error: error.message });
      this.reconnect();
      throw error;
    }
  }

  reconnect() {
    setTimeout(() => {
      logger.info('Attempting to reconnect to RabbitMQ');
      this.connect();
    }, 5000);
  }

  async close() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    logger.info('Closed RabbitMQ connection');
  }
}

export const rabbitmq = new RabbitMQConnection();