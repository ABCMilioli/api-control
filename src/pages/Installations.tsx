import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';
import { Header } from '../components/Layout/Header';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '../components/ui/pagination';
import { useInstallationStore } from '../stores/installationStore';
import { useAPIKeyStore } from '../stores/apiKeyStore';

export default function Installations() {
  const { 
    installations, 
    fetchInstallations, 
    loading, 
    error, 
    pagination,
    setPage,
    setLimit
  } = useInstallationStore();
  const { apiKeys, fetchAPIKeys } = useAPIKeyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchAPIKeys();
  }, [fetchAPIKeys]);

  useEffect(() => {
    const filters: any = {};
    if (statusFilter !== 'all') {
      filters.status = statusFilter;
    }
    if (debouncedSearchTerm) {
      filters.search = debouncedSearchTerm;
    }
    
    fetchInstallations(pagination.page, pagination.limit, filters);
  }, [fetchInstallations, pagination.page, pagination.limit, statusFilter, debouncedSearchTerm]);

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handleLimitChange = (limit: number) => {
    setLimit(limit);
  };

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
            <p className="text-gray-600">
              Histórico de tentativas de validação • 
              Total: {pagination.total} instalações
            </p>
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

          <Select 
            value={pagination.limit.toString()} 
            onValueChange={(value) => handleLimitChange(parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="20">20 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
              <SelectItem value="100">100 por página</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tentativas de Instalação</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {installations.map((installation) => {
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
              
              {installations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma instalação encontrada com os filtros aplicados.
                </div>
              )}
            </div>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.page > 1) {
                            handlePageChange(pagination.page - 1);
                          }
                        }}
                        className={pagination.page <= 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    
                    {/* Páginas */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNumber;
                      if (pagination.totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNumber = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNumber = pagination.totalPages - 4 + i;
                      } else {
                        pageNumber = pagination.page - 2 + i;
                      }
                      
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(pageNumber);
                            }}
                            isActive={pageNumber === pagination.page}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (pagination.page < pagination.totalPages) {
                            handlePageChange(pagination.page + 1);
                          }
                        }}
                        className={pagination.page >= pagination.totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            {/* Informações da paginação */}
            <div className="mt-4 text-center text-sm text-gray-600">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
              {pagination.total} instalações
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
