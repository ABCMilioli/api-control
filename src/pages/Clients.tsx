import { useState } from 'react';
import { Plus, Building, Mail, Phone, Edit2, Loader2, Trash2 } from 'lucide-react';
import { Header } from '../components/Layout/Header';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ClientModal } from '../components/Clients/ClientModal';
import { useClients, useSearchClients, useDeleteClient } from '../hooks/useClients';
import { Client } from '../types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Use different queries based on whether we're searching or not
  const { data: allClients, isLoading: isLoadingAll, error: errorAll } = useClients();
  const { data: searchResults, isLoading: isSearching } = useSearchClients(searchTerm);
  const deleteClientMutation = useDeleteClient();

  const clients = searchTerm ? searchResults : allClients;
  const isLoading = searchTerm ? isSearching : isLoadingAll;

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: { variant: "default" as const, label: "Ativo" },
      SUSPENDED: { variant: "secondary" as const, label: "Suspenso" },
      BLOCKED: { variant: "destructive" as const, label: "Bloqueado" }
    };
    
    return variants[status as keyof typeof variants] || variants.ACTIVE;
  };

  const handleNewClient = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (client: Client) => {
    setClientToDelete(client);
  };

  const confirmDelete = async () => {
    if (clientToDelete) {
      await deleteClientMutation.mutateAsync(clientToDelete.id);
      setClientToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  if (errorAll) {
    return (
      <div className="flex-1 bg-gray-50">
        <Header 
          title="Clientes" 
          subtitle="Gerencie os clientes e suas informações"
        />
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-red-600">Erro ao carregar clientes. Verifique a conexão com o banco de dados.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      <Header 
        title="Clientes" 
        subtitle="Gerencie os clientes e suas informações"
      />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Lista de Clientes</h2>
            <p className="text-gray-600">Visualize e gerencie seus clientes</p>
          </div>
          
          <Button 
            className="flex items-center gap-2"
            onClick={handleNewClient}
          >
            <Plus size={16} />
            Novo Cliente
          </Button>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando clientes...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients && clients.length > 0 ? (
              clients.map((client: Client) => {
                const statusInfo = getStatusBadge(client.status);
                
                return (
                  <Card key={client.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{client.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClient(client)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClient(client)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={16} />
                        <span>{client.email}</span>
                      </div>
                      
                      {client.company && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building size={16} />
                          <span>{client.company}</span>
                        </div>
                      )}
                      
                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={16} />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      
                      {client.notes && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {client.notes}
                        </p>
                      )}
                      
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500">
                          Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">
                  {searchTerm ? 'Nenhum cliente encontrado para a busca.' : 'Nenhum cliente cadastrado ainda.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <ClientModal 
        open={isModalOpen} 
        onClose={handleCloseModal}
        client={editingClient}
      />

      <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cliente {clientToDelete?.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
