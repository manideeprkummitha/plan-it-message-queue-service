import express from 'express';
import { notificationController } from '../controllers/notification.controller.js';

const router = express.Router();

router.post('/', notificationController.createNotification);

export const notificationRoutes = router;