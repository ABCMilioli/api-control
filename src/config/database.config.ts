
export const databaseConfig = {
  url: process.env.DATABASE_URL || 'postgresql://api_control:your_password_here@localhost:5432/api_control?schema=public',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'api_control',
  username: process.env.POSTGRES_USER || 'api_control',
  password: process.env.POSTGRES_PASSWORD || 'your_password_here',
};

export const isDevelopment = process.env.NODE_ENV !== 'production';
export const isProduction = process.env.NODE_ENV === 'production';
