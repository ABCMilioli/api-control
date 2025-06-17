import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { useAPIKeyStore } from '../../stores/apiKeyStore';
import { useClientStore } from '../../stores/clientStore';
import { toast } from '../../hooks/use-toast';

interface APIKeyModalProps {
  open: boolean;
  onClose: () => void;
}

export function APIKeyModal({ open, onClose }: APIKeyModalProps) {
  const { addAPIKey, generateKey } = useAPIKeyStore();
  const { clients, fetchClients } = useClientStore();
  const [formData, setFormData] = useState({
    clientId: '',
    maxInstallations: '',
    expiresAt: ''
  });

  useEffect(() => {
    if (open) {
      fetchClients();
    }
  }, [open, fetchClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedClient = clients.find(c => c.id === formData.clientId);
    if (!selectedClient) {
      toast({
        title: "Erro",
        description: "Selecione um cliente válido",
        variant: "destructive"
      });
      return;
    }

    try {
      const newKey = {
        key: generateKey(),
        clientId: formData.clientId,
        clientName: selectedClient.name,
        clientEmail: selectedClient.email,
        maxInstallations: parseInt(formData.maxInstallations),
        isActive: true,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : null
      };

      await addAPIKey(newKey);
      
      toast({
        title: "Sucesso",
        description: "API Key criada com sucesso",
        variant: "default"
      });

      setFormData({ clientId: '', maxInstallations: '', expiresAt: '' });
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar API Key",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova API Key</DialogTitle>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar API Key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
