import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import {config} from "./config/index.js";
import {logger} from "./utils/logger.js";
import {rabbitmq} from "./lib/rabbitmq.js";
import {notificationRoutes} from "./routes/notification.routes.js";

// initializing express APP
const app = express();

// Configure CORS
const corsOptions = {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'], // Add your frontend origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(helmet()); //Security Headers 
app.use(morgan("combined")); //HTTP Request Logger
app.use(express.json()); // Parse JSON request bodies (replaces body-parser)
app.use(express.urlencoded({extended: true}));

// Routes
app.use('/api/test-notification', notificationRoutes);

// Health Check Endpoint
app.get('/health',(req,res) => {
    res.status(200).json({
        status:"ok",
        service:"message-queue-service",
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error("Unhandled error", {error:err.message});
    res.status(500).json({
        success:false,
        error:"Internal server error"
    });
})

// Server startup function
async function startServer() {
    try{
        // Connect to RabbitMQ
        await rabbitmq.connect();

        // Start the express server
        app.listen(config.port, () => {
            logger.info(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
        });
    }catch(error){
        logger.error("Failed to start server", {error:error.message});
        process.exit(1);
    }
}

// Gracefully shutdown the handlers
process.on('SIGTERM',async() => {
    logger.info("SIGTERM received, shutting down gracefully");
    await rabbitmq.disconnect();
    process.exit(0);
});

process.on("SIGNINT",async() => {
    logger.info("SIGINT received, shutting down gracefully");
    await rabbitmq.disconnect();
    process.exit(0);
});

// Start the server
startServer();