import express from 'express';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import deckRoutes from './routes/deck.routes.js';
import marketplaceRoutes from './routes/marketplace.routes.js';
import adminRoutes from './routes/admin.routes.js';
import systemRoutes from './routes/system.routes.js';
import { applySecurityMiddleware } from './middleware/security.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

applySecurityMiddleware(app);

app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', deckRoutes);
app.use('/api', marketplaceRoutes);
app.use('/api', adminRoutes);
app.use('/api', systemRoutes);

app.use(errorHandler);

export default app;
