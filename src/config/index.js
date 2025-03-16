import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    exchange: {
      name: process.env.RABBITMQ_EXCHANGE || 'notifications.exchange',
      type: 'topic',
      options: { durable: true }
    },
    queues: {
      notifications: {
        name: process.env.RABBITMQ_QUEUE || 'notifications.queue',
        options: { durable: true },
        bindingKey: 'notification.#'
      }
    }
  }
};