import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';
import routes from './routes/index.js';

import { connectDB } from './config/database.js';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

connectDB();

app.use('/api',routes);

const PORT = process.env.PORT || 5009;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});