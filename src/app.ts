import express from 'express';
import cors from 'cors';
import { clientRouter } from './routes/client.js';
import { userRouter } from './routes/user.js';
import { apiKeyRouter } from './routes/apiKey.js';

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/clients', clientRouter);
app.use('/api/users', userRouter);
app.use('/api/api-keys', apiKeyRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export default app; 