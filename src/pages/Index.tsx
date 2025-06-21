import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { logger } from '../lib/logger';

const Index = () => {
  const { isAuthenticated } = useAuthStore();
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [adminExists, setAdminExists] = useState(false);

  useEffect(() => {
    logger.info('Index.tsx: Iniciando verificação', { isAuthenticated });
    
    // Se já está autenticado, vai direto para o dashboard
    if (isAuthenticated) {
      logger.info('Index.tsx: Usuário autenticado, redirecionando para dashboard');
      return;
    }

    // Verificar se existe administrador
    logger.info('Index.tsx: Verificando se existe administrador');
    fetch('/api/users/admin-exists')
      .then(res => res.json())
      .then(data => {
        logger.info('Index.tsx: Resposta da API admin-exists', { data });
        setAdminExists(data.exists);
        setCheckingAdmin(false);
      })
      .catch((error) => {
        logger.error('Index.tsx: Erro ao verificar administrador', { error });
        // Em caso de erro, assume que não existe admin (permite registro)
        setAdminExists(false);
        setCheckingAdmin(false);
      });
  }, [isAuthenticated]);

  // Se está autenticado, vai para dashboard
  if (isAuthenticated) {
    logger.info('Index.tsx: Redirecionando para dashboard (usuário autenticado)');
    return <Navigate to="/dashboard" replace />;
  }

  // Se está verificando, mostra loading
  if (checkingAdmin) {
    logger.info('Index.tsx: Mostrando loading durante verificação');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <span className="text-white text-lg">Inicializando sistema...</span>
        </div>
      </div>
    );
  }

  // Se não existe admin, vai para registro
  if (!adminExists) {
    logger.info('Index.tsx: Não existe administrador, redirecionando para registro');
    return <Navigate to="/register" replace />;
  }

  // Se existe admin, vai para login
  logger.info('Index.tsx: Existe administrador, redirecionando para login');
  return <Navigate to="/login" replace />;
};

export default Index;
