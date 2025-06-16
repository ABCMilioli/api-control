
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const Index = () => {
  const { isAuthenticated } = useAuthStore();
  
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};

export default Index;
