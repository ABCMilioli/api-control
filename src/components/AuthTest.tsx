import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from '../hooks/use-toast';

export function AuthTest() {
  const { user, token, isAuthenticated, logout } = useAuthStore();
  const [showToken, setShowToken] = useState(false);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });
  };

  return (
    <Card className="w-full h-full shadow-lg border border-gray-200">
      <CardHeader>
        <CardTitle>Status da Autenticação JWT</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-medium mb-2">Status da Autenticação</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Autenticado:</span>
                <span className={isAuthenticated ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {isAuthenticated ? '✅ Sim' : '❌ Não'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Token:</span>
                <span className={token ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {token ? '✅ Presente' : '❌ Ausente'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Usuário:</span>
                <span className={user ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {user ? user.nome : '❌ Não carregado'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Informações do Token</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Comprimento:</span>
                <span>{token ? `${token.length} caracteres` : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span>{user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Role:</span>
                <span>{user?.role || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>ID:</span>
                <span>{user?.id || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <Button 
            onClick={() => setShowToken(!showToken)}
            variant="outline"
            className="flex-1"
          >
            {showToken ? 'Ocultar Token' : 'Mostrar Token'}
          </Button>
          
          <Button 
            onClick={handleLogout}
            variant="destructive"
            className="flex-1"
          >
            Logout
          </Button>
        </div>

        {showToken && token && (
          <div className="p-4 bg-blue-50 rounded-lg overflow-x-auto">
            <h4 className="font-medium mb-2">Token JWT Completo:</h4>
            <code className="text-xs break-all bg-white p-2 rounded border block">
              {token}
            </code>
          </div>
        )}

        {!isAuthenticated && (
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium mb-2">Como Testar:</h4>
            <ol className="text-sm space-y-1">
              <li>1. Faça login com as credenciais: <code>admin@apicontrol.com</code> / <code>123456</code></li>
              <li>2. Verifique se o status mostra "✅ Autenticado: Sim"</li>
              <li>3. Verifique se o token está presente</li>
              <li>4. Clique em "Mostrar Token" para ver o JWT completo</li>
            </ol>
          </div>
        )}

        {isAuthenticated && (
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium mb-2 text-green-800">✅ Autenticação JWT Ativa!</h4>
            <p className="text-sm text-green-700">
              A autenticação JWT está funcionando corretamente. O token está sendo gerado e armazenado.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 