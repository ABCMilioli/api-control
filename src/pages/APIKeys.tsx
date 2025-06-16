
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Header } from '../components/Layout/Header';
import { Button } from '../components/ui/button';
import { APIKeyModal } from '../components/APIKeys/APIKeyModal';
import { APIKeyTable } from '../components/APIKeys/APIKeyTable';

export default function APIKeys() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex-1 bg-gray-50">
      <Header 
        title="API Keys" 
        subtitle="Gerencie as chaves de acesso do sistema"
      />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Chaves de API</h2>
            <p className="text-gray-600">Controle o acesso às suas aplicações</p>
          </div>
          
          <Button onClick={() => setModalOpen(true)} className="flex items-center gap-2">
            <Plus size={16} />
            Nova Chave
          </Button>
        </div>

        <APIKeyTable />
        
        <APIKeyModal 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
        />
      </div>
    </div>
  );
}
