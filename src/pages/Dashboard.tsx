import { useEffect, useState } from 'react';
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

  // Estado para alertas recentes
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  useEffect(() => {
    fetchAPIKeys();
    fetchClients();
    fetchInstallations();

    // Buscar alertas recentes do backend
    const fetchRecentAlerts = async () => {
      setLoadingAlerts(true);
      try {
        const res = await fetch('/api/notifications/recent');
        if (res.ok) {
          const data = await res.json();
          setRecentAlerts(data);
        } else {
          setRecentAlerts([]);
        }
      } catch (err) {
        setRecentAlerts([]);
      } finally {
        setLoadingAlerts(false);
      }
    };
    fetchRecentAlerts();
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
          {/* Alertas Recentes dinâmicos */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Alertas Recentes</h3>
            <div className="space-y-4">
              {loadingAlerts ? (
                <div className="text-gray-500 text-sm">Carregando alertas...</div>
              ) : recentAlerts.length === 0 ? (
                <div className="text-gray-500 text-sm">Nenhum alerta recente.</div>
              ) : (
                recentAlerts.map((alert, idx) => {
                  let bg = 'bg-primary/10';
                  let dot = 'bg-primary';
                  if (alert.type === 'warning') { bg = 'bg-warning/10'; dot = 'bg-warning'; }
                  if (alert.type === 'error') { bg = 'bg-destructive/10'; dot = 'bg-destructive'; }
                  if (alert.type === 'info') { bg = 'bg-primary/10'; dot = 'bg-primary'; }
                  if (alert.type === 'success') { bg = 'bg-success/10'; dot = 'bg-success'; }
                  return (
                    <div key={alert.id || idx} className={`flex items-start gap-3 p-3 rounded-lg ${bg}`}>
                      <div className={`w-2 h-2 rounded-full mt-2 ${dot}`}></div>
                      <div>
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-gray-600">{alert.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
