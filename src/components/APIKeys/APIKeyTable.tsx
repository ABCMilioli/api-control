import { useState, useEffect } from 'react';
import { Eye, EyeOff, Copy, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { useAPIKeyStore } from '../../stores/apiKeyStore';
import { useToast } from '../../hooks/use-toast';
import { EditAPIKeyModal } from './EditAPIKeyModal';
import { APIKey } from '../../types';
import { APIKeyModal } from './APIKeyModal';

export function APIKeyTable() {
  const { apiKeys, revokeAPIKey, deleteAPIKey, fetchAPIKeys } = useAPIKeyStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAPIKey, setEditingAPIKey] = useState<APIKey | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchAPIKeys();
  }, [fetchAPIKeys]);

  const filteredKeys = apiKeys.filter(key =>
    key.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "API Key copiada para a área de transferência",
    });
  };

  const handleRevoke = (keyId: string, clientName: string) => {
    if (confirm(`Tem certeza que deseja revogar a API Key do cliente ${clientName}?`)) {
      revokeAPIKey(keyId);
      toast({
        title: "API Key Revogada",
        description: `A chave do cliente ${clientName} foi revogada`,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (apiKey: APIKey) => {
    setEditingAPIKey(apiKey);
    setEditModalOpen(true);
  };

  const handleDelete = (keyId: string, clientName: string) => {
    if (confirm(`Tem certeza que deseja excluir permanentemente a API Key do cliente ${clientName}?`)) {
      deleteAPIKey(keyId);
      toast({
        title: "API Key Excluída",
        description: `A chave do cliente ${clientName} foi excluída permanentemente`,
        variant: "destructive"
      });
    }
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingAPIKey(null);
  };

  const maskKey = (key: string) => {
    return key.substring(0, 6) + '•'.repeat(20) + key.slice(-6);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista de API Keys</CardTitle>
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={() => setCreateModalOpen(true)}>Nova API Key</Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">API Key</th>
                  <th className="text-left py-3 px-4">Cliente</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Instalações</th>
                  <th className="text-left py-3 px-4">Criada em</th>
                  <th className="text-left py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeys.map((apiKey) => (
                  <tr key={apiKey.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                        >
                          {visibleKeys.has(apiKey.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey.key)}
                        >
                          <Copy size={16} />
                        </Button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{apiKey.clientName}</p>
                        <p className="text-sm text-gray-500">{apiKey.clientEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                        {apiKey.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span>{apiKey.currentInstallations}/{apiKey.maxInstallations}</span>
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-primary rounded-full"
                            style={{ 
                              width: `${(apiKey.currentInstallations / apiKey.maxInstallations) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {new Date(apiKey.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(apiKey)}
                          title="Editar API Key"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(apiKey.id, apiKey.clientName)}
                          title="Excluir API Key"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <EditAPIKeyModal 
        open={editModalOpen}
        onClose={handleCloseEditModal}
        apiKey={editingAPIKey}
      />

      <APIKeyModal 
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </>
  );
}
