import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from '../hooks/use-toast';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');

  useEffect(() => {
    // Se há um token na URL, redireciona para a página de redefinição
    if (token) {
      navigate(`/redefinir-senha?token=${token}`);
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao enviar email de recuperação');
      }
      setEnviado(true);
      toast({
        title: 'Solicitação enviada',
        description: 'Se o email existir, você receberá instruções para redefinir sua senha.',
        variant: 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar email de recuperação',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Recuperar Senha</CardTitle>
          <p className="text-gray-600">Informe seu email para receber instruções de recuperação</p>
        </CardHeader>
        <CardContent>
          {enviado ? (
            <div className="text-center py-8">
              <p className="text-green-600 font-medium mb-4">Se o email existir, você receberá as instruções em instantes.</p>
              <Link to="/login" className="text-primary hover:underline">Voltar para login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar instruções'}
              </Button>
              <div className="text-center mt-4">
                <Link to="/login" className="text-primary hover:underline">Voltar para login</Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 