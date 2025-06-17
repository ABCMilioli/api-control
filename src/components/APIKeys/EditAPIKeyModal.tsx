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
import { Badge } from '../ui/badge';

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
    maxInstallations: '',
    expiresAt: '',
    isActive: true
  });

  useEffect(() => {
    if (apiKey) {
      // Converte a data de expiração para o formato do input date (YYYY-MM-DD)
      let expiresAt = '';
      if (apiKey.expiresAt) {
        const date = new Date(apiKey.expiresAt);
        if (!isNaN(date.getTime())) {
          expiresAt = date.toISOString().split('T')[0];
        }
      }

      setFormData({
        maxInstallations: apiKey.maxInstallations.toString(),
        expiresAt,
        isActive: apiKey.isActive
      });
    }
  }, [apiKey, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey) return;

    try {
    const updates = {
      maxInstallations: parseInt(formData.maxInstallations),
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : null,
      isActive: formData.isActive
    };

      await updateAPIKey(apiKey.id, updates);
    
    toast({
      title: "Sucesso",
      description: "API Key atualizada com sucesso",
      variant: "default"
    });

    onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar API Key",
        variant: "destructive"
      });
    }
  };

  if (!apiKey) return null;

  const selectedClient = clients.find(c => c.id === apiKey.clientId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar API Key</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="client">Cliente</Label>
            <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
              <div>
                <p className="font-medium">{apiKey.clientName}</p>
                <p className="text-sm text-gray-500">{apiKey.clientEmail}</p>
              </div>
            </div>
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
            <div className="flex items-center gap-2">
              <Badge variant={formData.isActive ? "default" : "secondary"}>
                {formData.isActive ? 'Ativa' : 'Inativa'}
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
            >
                {formData.isActive ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
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
