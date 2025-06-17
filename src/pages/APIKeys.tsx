import { useState } from 'react';
import { Header } from '../components/Layout/Header';
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
