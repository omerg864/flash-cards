import express from 'express';
import dotenv from 'dotenv';
import colors from 'colors';
import { errorHandler } from './middleware/errorMiddleware.js';
import connectDB from './config/db.js';
const config = dotenv.config();
import mongoSanitize from 'express-mongo-sanitize';
import cors from 'cors';
import rateLimiterMiddleware from './middleware/rateLimiterMiddleware.js';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import cardRoutes from './routes/cardRoutes.js';

connectDB();

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(mongoSanitize());

app.use(
	cors({
		origin: process.env.CLIENT_URL,
		credentials: true,
	})
);
app.use(rateLimiterMiddleware);

app.use(cookieParser());

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

// app.use('/api/name', name); use the route
app.use('/api/user', userRoutes);
app.use('/api/subject', subjectRoutes);
app.use('/api/card', cardRoutes);

app.use(errorHandler);
