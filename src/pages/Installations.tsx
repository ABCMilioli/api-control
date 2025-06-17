import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';
import { Header } from '../components/Layout/Header';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useInstallationStore } from '../stores/installationStore';
import { useAPIKeyStore } from '../stores/apiKeyStore';

export default function Installations() {
  const { installations, fetchInstallations, loading, error } = useInstallationStore();
  const { apiKeys, fetchAPIKeys } = useAPIKeyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchInstallations();
    fetchAPIKeys();
  }, [fetchInstallations, fetchAPIKeys]);

  const filteredInstallations = installations.filter(installation => {
    const apiKey = apiKeys.find(key => key.id === installation.apiKeyId);
    const clientName = apiKey?.clientName || '';
    
    const matchesSearch = 
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      installation.ipAddress.includes(searchTerm) ||
      installation.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'success' && installation.success) ||
      (statusFilter === 'failure' && !installation.success);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-success" />
    ) : (
      <XCircle className="w-4 h-4 text-destructive" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge variant="default" className="bg-success">Sucesso</Badge>
    ) : (
      <Badge variant="destructive">Falha</Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50">
        <Header 
          title="Instalações" 
          subtitle="Monitore tentativas de validação e instalações"
        />
        <div className="p-6">
          <div className="text-center py-8">
            Carregando instalações...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-gray-50">
        <Header 
          title="Instalações" 
          subtitle="Monitore tentativas de validação e instalações"
        />
        <div className="p-6">
          <div className="text-center py-8 text-destructive">
            Erro ao carregar instalações: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      <Header 
        title="Instalações" 
        subtitle="Monitore tentativas de validação e instalações"
      />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Log de Instalações</h2>
            <p className="text-gray-600">Histórico de tentativas de validação</p>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Buscar por cliente, IP ou localização..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
              <SelectItem value="failure">Falha</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tentativas de Instalação</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {filteredInstallations.map((installation) => {
                const apiKey = apiKeys.find(key => key.id === installation.apiKeyId);
                
                return (
                  <div 
                    key={installation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(installation.success)}
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {apiKey?.clientName || 'Cliente Desconhecido'}
                          </span>
                          {getStatusBadge(installation.success)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>IP: {installation.ipAddress}</span>
                          
                          {installation.location && (
                            <div className="flex items-center gap-1">
                              <MapPin size={14} />
                              <span>{installation.location}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>
                              {new Date(installation.timestamp).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {apiKey?.clientEmail || 'Email desconhecido'}
                      </p>
                      {installation.userAgent && (
                        <p className="text-xs text-gray-500 mt-1">
                          {installation.userAgent}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {filteredInstallations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma instalação encontrada com os filtros aplicados.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
