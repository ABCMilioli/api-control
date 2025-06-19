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
    fetchSmtpConfig();
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

  const handleWebhookSave = (e: React.FormEvent) => {
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

    // Aqui seria feita a integração com a API para salvar as configurações do webhook
    toast({
      title: "Configurações de Webhook Salvas",
      description: `Webhook configurado para ${selectedEvents.length} eventos`,
    });
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
              </form>
            </CardContent>
          </Card>

          {/* Configurações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="defaultLimit">Limite Padrão de Instalações</Label>
                <Input
                  id="defaultLimit"
                  type="number"
                  defaultValue="100"
                  placeholder="100"
                />
              </div>
              
              <div>
                <Label htmlFor="defaultExpiry">Expiração Padrão (dias)</Label>
                <Input
                  id="defaultExpiry"
                  type="number"
                  defaultValue="365"
                  placeholder="365"
                />
              </div>

              <Button>
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificação</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Notificar sobre chaves próximas do limite</span>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              
              <div className="flex items-center justify-between">
                <span>Alertas de tentativas de acesso negadas</span>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              
              <div className="flex items-center justify-between">
                <span>Relatório semanal por email</span>
                <input type="checkbox" className="toggle" />
              </div>

              <Button>
                Salvar Preferências
              </Button>
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
