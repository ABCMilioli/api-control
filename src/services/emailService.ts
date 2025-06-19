import nodemailer from 'nodemailer';
import { prisma } from '../lib/database.js';

export async function sendMail({ to, subject, html }: { to: string, subject: string, html: string }) {
  const config = await prisma.sMTPConfig.findFirst({ where: { ativo: true } });
  if (!config) throw new Error('Configuração SMTP não encontrada');

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.encryption === 'SSL',
    auth: {
      user: config.username,
      pass: config.password,
    },
    tls: config.encryption === 'TLS' ? { ciphers: 'SSLv3' } : undefined,
  });

  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to,
    subject,
    html,
  });
} 