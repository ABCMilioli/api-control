import { useEffect } from 'react';
import { Key, User, CheckCircle, Activity } from 'lucide-react';
import { Header } from '../components/Layout/Header';
import { MetricCard } from '../components/Dashboard/MetricCard';
import { InstallationChart } from '../components/Dashboard/InstallationChart';
import { useAPIKeyStore } from '../stores/apiKeyStore';
import { useClientStore } from '../stores/clientStore';
import { useInstallationStore } from '../stores/installationStore';

export default function Dashboard() {
  const { apiKeys, fetchAPIKeys } = useAPIKeyStore();
  const { clients, fetchClients } = useClientStore();
  const { installations, fetchInstallations } = useInstallationStore();

  useEffect(() => {
    fetchAPIKeys();
    fetchClients();
    fetchInstallations();
  }, [fetchAPIKeys, fetchClients, fetchInstallations]);

  // Calcular métricas
  const activeKeys = apiKeys.filter(key => key.isActive).length;
  const today = new Date().toDateString();
  const installationsToday = installations.filter(
    inst => new Date(inst.timestamp).toDateString() === today && inst.success
  ).length;
  const activeClients = clients.filter(client => client.status === 'active' || client.status === 'ACTIVE').length;
  const successRate = installations.length > 0 
    ? Math.round((installations.filter(inst => inst.success).length / installations.length) * 100)
    : 0;

  // Dados para o gráfico dos últimos 30 dias
  const chartData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const dayInstallations = installations.filter(inst => 
      new Date(inst.timestamp).toDateString() === date.toDateString() && inst.success
    ).length;
    chartData.push({
      date: dateStr,
      installations: dayInstallations
    });
  }

  return (
    <div className="flex-1 bg-gray-50">
      <Header 
        title="Dashboard" 
        subtitle="Visão geral do sistema de API Keys"
      />
      
      <div className="p-6">
        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Chaves Ativas"
            value={activeKeys}
            change="+12% vs mês anterior"
            changeType="positive"
            icon={Key}
            iconColor="text-primary"
          />
          <MetricCard
            title="Instalações Hoje"
            value={installationsToday}
            change="+5 desde ontem"
            changeType="positive"
            icon={Activity}
            iconColor="text-success"
          />
          <MetricCard
            title="Clientes Ativos"
            value={activeClients}
            change="2 novos este mês"
            changeType="positive"
            icon={User}
            iconColor="text-warning"
          />
          <MetricCard
            title="Taxa de Sucesso"
            value={`${successRate}%`}
            change="+2.1% vs semana anterior"
            changeType="positive"
            icon={CheckCircle}
            iconColor="text-success"
          />
        </div>

        {/* Gráfico */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <InstallationChart data={chartData} />
          </div>
          {/* Alertas (mantidos estáticos por enquanto) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Alertas Recentes</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                <div className="w-2 h-2 bg-warning rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Limite Atingido</p>
                  <p className="text-xs text-gray-600">Digital Dynamics atingiu o limite de instalações</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                <div className="w-2 h-2 bg-destructive rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Tentativa Negada</p>
                  <p className="text-xs text-gray-600">3 tentativas com chave inválida nas últimas 24h</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Expiração Próxima</p>
                  <p className="text-xs text-gray-600">2 chaves expiram nos próximos 7 dias</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
