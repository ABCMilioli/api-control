import { useState, useEffect } from 'react';
import { Header } from '../components/Layout/Header';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuthStore } from '../stores/authStore';
import { toast } from '../hooks/use-toast';
import { AuthTest } from '../components/AuthTest';
import { api } from '../lib/api';

interface WebhookTestResult {
  webhookId: string;
  webhookName: string;
  webhookUrl: string;
  events: Array<{
    event: string;
    success: boolean;
    statusCode?: number;
    response?: string;
    error?: string;
    retryCount: number;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

interface SystemConfig {
  defaultLimit: number;
  defaultExpiry: number;
  notifyKeyLimit: boolean;
  notifyAccessDenied: boolean;
  notifyWeeklyReport: boolean;
}

export default function Settings() {
  const { user, updateProfile, changePassword } = useAuthStore();
  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: '587',
    username: '',
    password: '',
    encryption: 'tls',
    fromEmail: '',
    fromName: ''
  });

  const [webhookConfig, setWebhookConfig] = useState({
    id: '',
    name: '',
    url: '',
    secret: '',
    events: {
      'key.created': false,
      'key.updated': false,
      'key.deleted': false,
      'key.activated': false,
      'key.deactivated': false,
      'installation.success': false,
      'installation.failed': false,
      'installation.limit_reached': false,
      'client.created': false,
      'client.updated': false,
      'client.suspended': false,
      'client.blocked': false,
      'auth.login': false,
      'auth.logout': false,
      'system.maintenance': false
    }
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    defaultLimit: 100,
    defaultExpiry: 365,
    notifyKeyLimit: true,
    notifyAccessDenied: true,
    notifyWeeklyReport: false
  });

  const [webhooks, setWebhooks] = useState([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResults, setTestResults] = useState<WebhookTestResult | null>(null);
  const [loadingSystemConfig, setLoadingSystemConfig] = useState(false);
  const [savingSystemConfig, setSavingSystemConfig] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  useEffect(() => {
    async function fetchSmtpConfig() {
      try {
        const response = await api.get('/users/smtp-config');
        if (response.ok) {
          const data = await response.json();
          if (data && data.host) {
            setSmtpConfig({
              host: data.host || '',
              port: String(data.port || '587'),
              username: data.username || '',
              password: '', // nunca preencher senha por segurança
              encryption: (data.encryption || 'TLS').toLowerCase(),
              fromEmail: data.fromEmail || '',
              fromName: data.fromName || ''
            });
          }
        }
      } catch (error) {
        // Ignorar erro silenciosamente
      }
    }

    async function fetchWebhooks() {
      setLoadingWebhooks(true);
      try {
        const response = await api.get('/webhooks');
        if (response.ok) {
          const data = await response.json();
          setWebhooks(data);
          // Se há webhooks, carregar o primeiro
          if (data.length > 0) {
            const firstWebhook = data[0];
            setWebhookConfig({
              id: firstWebhook.id,
              name: firstWebhook.name,
              url: firstWebhook.url || '',
              secret: firstWebhook.secret || '', // Carregar a chave secreta se existir
              events: firstWebhook.events.reduce((acc: any, event: string) => {
                acc[event] = true;
                return acc;
              }, {})
            });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar webhooks:', error);
      } finally {
        setLoadingWebhooks(false);
      }
    }

    async function fetchSystemConfig() {
      setLoadingSystemConfig(true);
      try {
        const response = await api.get('/system-config');
        if (response.ok) {
          const data = await response.json();
          setSystemConfig({
            defaultLimit: data.defaultLimit || 100,
            defaultExpiry: data.defaultExpiry || 365,
            notifyKeyLimit: data.notifyKeyLimit ?? true,
            notifyAccessDenied: data.notifyAccessDenied ?? true,
            notifyWeeklyReport: data.notifyWeeklyReport ?? false
          });
        }
      } catch (error) {
        console.error('Erro ao carregar configurações do sistema:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar configurações do sistema",
          variant: "destructive"
        });
      } finally {
        setLoadingSystemConfig(false);
      }
    }

    fetchSmtpConfig();
    fetchWebhooks();
    fetchSystemConfig();
  }, []);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateProfile({
      nome: formData.nome,
      email: formData.email
    });
    
    toast({
      title: "Perfil Atualizado",
      description: "Suas informações foram atualizadas com sucesso",
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }
    if (formData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }
    const result = await changePassword(formData.currentPassword, formData.newPassword);
    if (result.success) {
      toast({
        title: "Senha Alterada",
        description: result.message,
      });
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } else {
      toast({
        title: "Erro",
        description: result.message,
        variant: "destructive"
      });
    }
  };

  const handleSmtpSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validação básica
    if (!smtpConfig.host || !smtpConfig.username || !smtpConfig.password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios do SMTP",
        variant: "destructive"
      });
      return;
    }
    try {
      const response = await api.post('/users/smtp-config', {
        host: smtpConfig.host,
        port: Number(smtpConfig.port),
        username: smtpConfig.username,
        password: smtpConfig.password,
        encryption: smtpConfig.encryption.toUpperCase(),
        fromEmail: smtpConfig.fromEmail,
        fromName: smtpConfig.fromName
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar configurações SMTP');
      }
      toast({
        title: "Configurações SMTP Salvas",
        description: "As configurações de email foram atualizadas com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || 'Erro ao salvar configurações SMTP',
        variant: "destructive"
      });
    }
  };

  const handleWebhookSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webhookConfig.url) {
      toast({
        title: "Erro",
        description: "Por favor, informe a URL do webhook",
        variant: "destructive"
      });
      return;
    }

    const selectedEvents = Object.entries(webhookConfig.events)
      .filter(([_, enabled]) => enabled)
      .map(([event, _]) => event);

    if (selectedEvents.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um evento para o webhook",
        variant: "destructive"
      });
      return;
    }

    try {
      const webhookData = {
        name: webhookConfig.name || 'Webhook Principal',
        url: webhookConfig.url,
        secret: webhookConfig.secret || undefined,
        events: selectedEvents,
        isActive: true,
        retryCount: 3,
        timeout: 30000
      };

      let response;
      if (webhookConfig.id) {
        // Atualizar webhook existente
        response = await api.put(`/webhooks/${webhookConfig.id}`, webhookData);
      } else {
        // Criar novo webhook
        response = await api.post('/webhooks', webhookData);
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar configurações de webhook');
      }

      const savedWebhook = await response.json();
      
      toast({
        title: "Configurações de Webhook Salvas",
        description: `Webhook configurado para ${selectedEvents.length} eventos`,
      });

      // Atualizar o estado com o webhook salvo
      setWebhookConfig(prev => ({
        ...prev,
        id: savedWebhook.id,
        name: savedWebhook.name
      }));

      // Recarregar lista de webhooks
      const webhooksResponse = await api.get('/webhooks');
      if (webhooksResponse.ok) {
        setWebhooks(await webhooksResponse.json());
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || 'Erro ao salvar configurações de webhook',
        variant: "destructive"
      });
    }
  };

  const handleWebhookEventChange = (event: string, checked: boolean) => {
    setWebhookConfig(prev => ({
      ...prev,
      events: {
        ...prev.events,
        [event]: checked
      }
    }));
  };

  const handleTestWebhook = async () => {
    if (!webhookConfig.id) {
      toast({
        title: "Erro",
        description: "Salve o webhook primeiro antes de testar",
        variant: "destructive"
      });
      return;
    }

    const selectedEvents = Object.entries(webhookConfig.events)
      .filter(([_, enabled]) => enabled)
      .map(([event, _]) => event);

    if (selectedEvents.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um evento para testar",
        variant: "destructive"
      });
      return;
    }

    setTestingWebhook(true);
    setTestResults(null);

    try {
      const response = await api.post(`/webhooks/${webhookConfig.id}/test-events`, {
        events: selectedEvents
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao testar webhook');
      }

      const results = await response.json();
      setTestResults(results);

      const successfulEvents = results.summary.successful;
      const totalEvents = results.summary.total;

      if (successfulEvents === totalEvents) {
        toast({
          title: "Teste Concluído",
          description: `Todos os ${totalEvents} eventos foram enviados com sucesso!`,
        });
      } else {
        toast({
          title: "Teste Concluído",
          description: `${successfulEvents} de ${totalEvents} eventos foram enviados com sucesso`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no Teste",
        description: error.message || 'Erro ao testar webhook',
        variant: "destructive"
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleSystemConfigSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSystemConfig(true);
    try {
      const response = await api.put('/system-config', systemConfig);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar configurações do sistema');
      }
      toast({
        title: "Configurações do Sistema Salvas",
        description: "As configurações do sistema foram atualizadas com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || 'Erro ao salvar configurações do sistema',
        variant: "destructive"
      });
    } finally {
      setSavingSystemConfig(false);
    }
  };

  const handleNotificationsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotifications(true);
    try {
      const response = await api.put('/system-config', {
        notifyKeyLimit: systemConfig.notifyKeyLimit,
        notifyAccessDenied: systemConfig.notifyAccessDenied,
        notifyWeeklyReport: systemConfig.notifyWeeklyReport
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar configurações de notificações');
      }
      toast({
        title: "Configurações de Notificação Salvas",
        description: "As configurações de notificação foram atualizadas com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || 'Erro ao salvar configurações de notificações',
        variant: "destructive"
      });
    } finally {
      setSavingNotifications(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      <Header 
        title="Configurações" 
        subtitle="Gerencie suas configurações e perfil"
      />
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Perfil do Usuário */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      nome: e.target.value 
                    }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      email: e.target.value 
                    }))}
                    required
                  />
                </div>

                <Button type="submit">
                  Atualizar Perfil
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Alteração de Senha */}
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      currentPassword: e.target.value 
                    }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      newPassword: e.target.value 
                    }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      confirmPassword: e.target.value 
                    }))}
                    required
                  />
                </div>

                <Button type="submit">
                  Alterar Senha
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Configurações SMTP */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Configurações SMTP</CardTitle>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSmtpSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpHost">Servidor SMTP *</Label>
                    <Input
                      id="smtpHost"
                      placeholder="smtp.gmail.com"
                      value={smtpConfig.host}
                      onChange={(e) => setSmtpConfig(prev => ({ 
                        ...prev, 
                        host: e.target.value 
                      }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="smtpPort">Porta</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      placeholder="587"
                      value={smtpConfig.port}
                      onChange={(e) => setSmtpConfig(prev => ({ 
                        ...prev, 
                        port: e.target.value 
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="smtpUsername">Usuário *</Label>
                    <Input
                      id="smtpUsername"
                      type="email"
                      placeholder="seu-email@exemplo.com"
                      value={smtpConfig.username}
                      onChange={(e) => setSmtpConfig(prev => ({ 
                        ...prev, 
                        username: e.target.value 
                      }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="smtpPassword">Senha *</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      placeholder="sua-senha-de-app"
                      value={smtpConfig.password}
                      onChange={(e) => setSmtpConfig(prev => ({ 
                        ...prev, 
                        password: e.target.value 
                      }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="smtpEncryption">Criptografia</Label>
                    <Select 
                      value={smtpConfig.encryption} 
                      onValueChange={(value) => setSmtpConfig(prev => ({ 
                        ...prev, 
                        encryption: value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                        <SelectItem value="none">Nenhuma</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="smtpFromEmail">Email Remetente</Label>
                    <Input
                      id="smtpFromEmail"
                      type="email"
                      placeholder="noreply@seudominio.com"
                      value={smtpConfig.fromEmail}
                      onChange={(e) => setSmtpConfig(prev => ({ 
                        ...prev, 
                        fromEmail: e.target.value 
                      }))}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="smtpFromName">Nome do Remetente</Label>
                    <Input
                      id="smtpFromName"
                      placeholder="Sistema API Keys"
                      value={smtpConfig.fromName}
                      onChange={(e) => setSmtpConfig(prev => ({ 
                        ...prev, 
                        fromName: e.target.value 
                      }))}
                    />
                  </div>
                </div>

                <Button type="submit">
                  Salvar Configurações SMTP
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Configurações de Webhook */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Configurações de Webhook</CardTitle>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleWebhookSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="webhookName">Nome do Webhook *</Label>
                    <Input
                      id="webhookName"
                      placeholder="Webhook Principal"
                      value={webhookConfig.name}
                      onChange={(e) => setWebhookConfig(prev => ({ 
                        ...prev, 
                        name: e.target.value 
                      }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="webhookUrl">URL do Webhook *</Label>
                    <Input
                      id="webhookUrl"
                      type="url"
                      placeholder="https://seu-dominio.com/webhook"
                      value={webhookConfig.url}
                      onChange={(e) => setWebhookConfig(prev => ({ 
                        ...prev, 
                        url: e.target.value 
                      }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="webhookSecret">Chave Secreta (Opcional)</Label>
                    <Input
                      id="webhookSecret"
                      type="password"
                      placeholder="sua-chave-secreta"
                      value={webhookConfig.secret}
                      onChange={(e) => setWebhookConfig(prev => ({ 
                        ...prev, 
                        secret: e.target.value 
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Eventos para Notificar</Label>
                  <div className="mt-3 space-y-4">
                    
                    {/* Eventos de API Keys */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Chaves de API</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries({
                          'key.created': 'Chave criada',
                          'key.updated': 'Chave atualizada',
                          'key.deleted': 'Chave removida',
                          'key.activated': 'Chave ativada',
                          'key.deactivated': 'Chave desativada'
                        }).map(([event, label]) => (
                          <div key={event} className="flex items-center space-x-2">
                            <Checkbox
                              id={event}
                              checked={webhookConfig.events[event as keyof typeof webhookConfig.events]}
                              onCheckedChange={(checked) => handleWebhookEventChange(event, checked as boolean)}
                            />
                            <Label htmlFor={event} className="text-sm">{label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Eventos de Instalação */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Instalações</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries({
                          'installation.success': 'Instalação bem-sucedida',
                          'installation.failed': 'Instalação falhada',
                          'installation.limit_reached': 'Limite de instalações atingido'
                        }).map(([event, label]) => (
                          <div key={event} className="flex items-center space-x-2">
                            <Checkbox
                              id={event}
                              checked={webhookConfig.events[event as keyof typeof webhookConfig.events]}
                              onCheckedChange={(checked) => handleWebhookEventChange(event, checked as boolean)}
                            />
                            <Label htmlFor={event} className="text-sm">{label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Eventos de Cliente */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Clientes</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries({
                          'client.created': 'Cliente criado',
                          'client.updated': 'Cliente atualizado',
                          'client.suspended': 'Cliente suspenso',
                          'client.blocked': 'Cliente bloqueado'
                        }).map(([event, label]) => (
                          <div key={event} className="flex items-center space-x-2">
                            <Checkbox
                              id={event}
                              checked={webhookConfig.events[event as keyof typeof webhookConfig.events]}
                              onCheckedChange={(checked) => handleWebhookEventChange(event, checked as boolean)}
                            />
                            <Label htmlFor={event} className="text-sm">{label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Eventos de Autenticação */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Autenticação</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries({
                          'auth.login': 'Login realizado',
                          'auth.logout': 'Logout realizado'
                        }).map(([event, label]) => (
                          <div key={event} className="flex items-center space-x-2">
                            <Checkbox
                              id={event}
                              checked={webhookConfig.events[event as keyof typeof webhookConfig.events]}
                              onCheckedChange={(checked) => handleWebhookEventChange(event, checked as boolean)}
                            />
                            <Label htmlFor={event} className="text-sm">{label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Eventos do Sistema */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Sistema</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="system.maintenance"
                            checked={webhookConfig.events['system.maintenance']}
                            onCheckedChange={(checked) => handleWebhookEventChange('system.maintenance', checked as boolean)}
                          />
                          <Label htmlFor="system.maintenance" className="text-sm">Manutenção programada</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button type="submit">
                  Salvar Configurações de Webhook
                </Button>

                {webhookConfig.id && (
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleTestWebhook}
                      disabled={testingWebhook}
                    >
                      {testingWebhook ? 'Testando...' : 'Testar Webhook'}
                    </Button>
                  </div>
                )}
              </form>

              {/* Resultados do Teste */}
              {testResults && (
                <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium text-sm text-gray-700 mb-3">Resultados do Teste</h4>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Webhook:</span>
                      <span className="font-mono text-xs">{testResults.webhookName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>URL:</span>
                      <span className="font-mono text-xs">{testResults.webhookUrl}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total de Eventos:</span>
                      <span>{testResults.summary.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Sucessos:</span>
                      <span className="text-green-600">{testResults.summary.successful}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Falhas:</span>
                      <span className="text-red-600">{testResults.summary.failed}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium text-xs text-gray-600">Detalhes por Evento:</h5>
                    {testResults.events.map((event: any, index: number) => (
                      <div key={index} className="flex justify-between items-center text-xs p-2 bg-white rounded border">
                        <span className="font-mono">{event.event}</span>
                        <div className="flex items-center gap-2">
                          {event.success ? (
                            <span className="text-green-600">✓ Sucesso</span>
                          ) : (
                            <span className="text-red-600">✗ Falha</span>
                          )}
                          {event.statusCode && (
                            <span className="text-gray-500">({event.statusCode})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configurações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <form onSubmit={handleSystemConfigSave}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="defaultLimit">Limite Padrão de Instalações</Label>
                    <Input
                      id="defaultLimit"
                      type="number"
                      value={systemConfig.defaultLimit}
                      placeholder="100"
                      onChange={(e) => setSystemConfig(prev => ({ 
                        ...prev, 
                        defaultLimit: Number(e.target.value) 
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="defaultExpiry">Expiração Padrão (dias)</Label>
                    <Input
                      id="defaultExpiry"
                      type="number"
                      value={systemConfig.defaultExpiry}
                      placeholder="365"
                      onChange={(e) => setSystemConfig(prev => ({ 
                        ...prev, 
                        defaultExpiry: Number(e.target.value) 
                      }))}
                    />
                  </div>

                  <Button 
                    type="submit"
                    disabled={loadingSystemConfig || savingSystemConfig}
                  >
                    {savingSystemConfig ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificação</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <form onSubmit={handleNotificationsSave}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Notificar sobre chaves próximas do limite</span>
                    <input
                      type="checkbox"
                      checked={systemConfig.notifyKeyLimit}
                      onChange={(e) => setSystemConfig(prev => ({ 
                        ...prev, 
                        notifyKeyLimit: e.target.checked 
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Alertas de tentativas de acesso negadas</span>
                    <input
                      type="checkbox"
                      checked={systemConfig.notifyAccessDenied}
                      onChange={(e) => setSystemConfig(prev => ({ 
                        ...prev, 
                        notifyAccessDenied: e.target.checked 
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Relatório semanal por email</span>
                    <input
                      type="checkbox"
                      checked={systemConfig.notifyWeeklyReport}
                      onChange={(e) => setSystemConfig(prev => ({ 
                        ...prev, 
                        notifyWeeklyReport: e.target.checked 
                      }))}
                    />
                  </div>

                  <Button 
                    type="submit"
                    disabled={savingNotifications}
                  >
                    {savingNotifications ? 'Salvando...' : 'Salvar Preferências'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Teste de Autenticação JWT */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Status da Autenticação JWT</CardTitle>
            </CardHeader>
            <CardContent>
              <AuthTest />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
