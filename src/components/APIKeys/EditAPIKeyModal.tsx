
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { useAPIKeyStore } from '../../stores/apiKeyStore';
import { useClientStore } from '../../stores/clientStore';
import { useToast } from '../../hooks/use-toast';
import { APIKey } from '../../types';

interface EditAPIKeyModalProps {
  open: boolean;
  onClose: () => void;
  apiKey: APIKey | null;
}

export function EditAPIKeyModal({ open, onClose, apiKey }: EditAPIKeyModalProps) {
  const { updateAPIKey } = useAPIKeyStore();
  const { clients } = useClientStore();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    clientId: '',
    maxInstallations: '',
    expiresAt: '',
    isActive: true
  });

  useEffect(() => {
    if (apiKey) {
      setFormData({
        clientId: apiKey.clientId,
        maxInstallations: apiKey.maxInstallations.toString(),
        expiresAt: apiKey.expiresAt ? apiKey.expiresAt.toISOString().split('T')[0] : '',
        isActive: apiKey.isActive
      });
    }
  }, [apiKey, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey) return;

    const selectedClient = clients.find(c => c.id === formData.clientId);
    if (!selectedClient) {
      toast({
        title: "Erro",
        description: "Selecione um cliente válido",
        variant: "destructive"
      });
      return;
    }

    const updates = {
      clientId: formData.clientId,
      clientName: selectedClient.name,
      clientEmail: selectedClient.email,
      maxInstallations: parseInt(formData.maxInstallations),
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : null,
      isActive: formData.isActive
    };

    updateAPIKey(apiKey.id, updates);
    
    toast({
      title: "Sucesso",
      description: "API Key atualizada com sucesso",
      variant: "default"
    });

    onClose();
  };

  if (!apiKey) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar API Key</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="client">Cliente</Label>
            <Select value={formData.clientId} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, clientId: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} ({client.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="maxInstallations">Limite de Instalações</Label>
            <Input
              id="maxInstallations"
              type="number"
              value={formData.maxInstallations}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                maxInstallations: e.target.value 
              }))}
              placeholder="Ex: 100"
              required
            />
          </div>

          <div>
            <Label htmlFor="expiresAt">Data de Expiração (Opcional)</Label>
            <Input
              id="expiresAt"
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                expiresAt: e.target.value 
              }))}
            />
          </div>

          <div>
            <Label htmlFor="isActive">Status</Label>
            <Select 
              value={formData.isActive ? 'active' : 'inactive'} 
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, isActive: value === 'active' }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="inactive">Inativa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
