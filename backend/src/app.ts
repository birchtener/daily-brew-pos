import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/error.middleware';

import inventoryRoutes from './modules/inventory/inventory.routes';
import authRoutes from './modules/auth/auth.routes';
// import userRoutes from './modules/user/user.routes';
import ordersRoutes from './modules/orders/orders.routes';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

app.use(errorHandler);

app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/orders', ordersRoutes);
// app.use('/api/v1/users', userRoutes);

export default app;