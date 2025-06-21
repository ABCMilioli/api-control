import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuthStore } from '../stores/authStore';
import { toast } from '../hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: 'admin@apicontrol.com',
    password: '123456'
  });
  const [loading, setLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    // Verificar se existe administrador
    fetch('/api/users/admin-exists')
      .then(res => res.json())
      .then(data => {
        if (!data.exists) {
          // Se não existe admin, redireciona para registro
          navigate('/register', { replace: true });
        } else {
          setCheckingAdmin(false);
        }
      })
      .catch(() => {
        // Em caso de erro, assume que não existe admin
        navigate('/register', { replace: true });
      });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        navigate('/');
      } else {
        toast({
          title: "Erro de Login",
          description: "Email ou senha incorretos",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro durante o login",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <span className="text-white text-lg">Verificando sistema...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">API Control</CardTitle>
          <p className="text-gray-600">Sistema de Gerenciamento de API Keys</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  email: e.target.value 
                }))}
                placeholder="admin@apicontrol.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  password: e.target.value 
                }))}
                placeholder="••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Esqueceu sua senha?{' '}
              <Link to="/recuperar-senha" className="text-primary hover:underline">
                Recuperar senha
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
