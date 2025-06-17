import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  LayoutDashboard, 
  Key, 
  Users, 
  Activity, 
  Bell, 
  Settings,
  Shield,
  Database,
  Globe,
  Search,
  Code
} from 'lucide-react';

const features = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Visão geral do sistema com métricas principais',
    functionalities: [
      'Visualização de estatísticas em tempo real',
      'Gráficos de instalações por período',
      'Cards com métricas importantes',
      'Status de sistema e alertas'
    ]
  },
  {
    title: 'Gerenciamento de API Keys',
    icon: Key,
    description: 'Controle completo das chaves de API do sistema',
    functionalities: [
      'Criação de novas API Keys',
      'Edição de permissões e configurações',
      'Definição de datas de expiração',
      'Monitoramento de uso e limitações',
      'Revogação e renovação de chaves'
    ]
  },
  {
    title: 'Gestão de Clientes',
    icon: Users,
    description: 'Administração completa da base de clientes',
    functionalities: [
      'Cadastro de novos clientes',
      'Edição de informações de contato',
      'Histórico de atividades do cliente',
      'Gerenciamento de permissões',
      'Associação com API Keys'
    ]
  },
  {
    title: 'Controle de Instalações',
    icon: Activity,
    description: 'Monitoramento de todas as instalações ativas',
    functionalities: [
      'Visualização de instalações por cliente',
      'Status de cada instalação',
      'Logs de atividade e uso',
      'Configurações específicas por instalação',
      'Métricas de performance'
    ]
  },
  {
    title: 'Sistema de Notificações',
    icon: Bell,
    description: 'Central de comunicação e alertas do sistema',
    functionalities: [
      'Notificações de expiração de API Keys',
      'Alertas de limite de uso atingido',
      'Notificações de novas instalações',
      'Atualizações do sistema',
      'Filtros por tipo e status',
      'Marcação como lida/não lida',
      'Remoção de notificações'
    ]
  },
  {
    title: 'Configurações',
    icon: Settings,
    description: 'Personalização e configuração do sistema',
    functionalities: [
      'Configurações de perfil do usuário',
      'Preferências de notificação',
      'Configurações de segurança',
      'Backup e restauração',
      'Logs do sistema'
    ]
  }
];

const systemSpecs = [
  {
    category: 'Tecnologias',
    items: [
      'React 18 com TypeScript',
      'Tailwind CSS para estilização',
      'Shadcn/UI para componentes',
      'React Router para navegação',
      'Zustand para gerenciamento de estado',
      'React Query para cache e sincronização'
    ]
  },
  {
    category: 'Segurança',
    items: [
      'Autenticação baseada em JWT',
      'Controle de acesso por rotas',
      'Validação de permissões',
      'Criptografia de dados sensíveis',
      'Logs de auditoria'
    ]
  },
  {
    category: 'Performance',
    items: [
      'Lazy loading de componentes',
      'Cache inteligente de dados',
      'Otimização de re-renderizações',
      'Compressão de assets',
      'CDN para recursos estáticos'
    ]
  }
];

const apiExamples = [
  {
    title: 'Autenticação',
    description: 'Login no sistema',
    method: 'POST',
    endpoint: '/api/auth/login',
    curl: `curl -X POST https://api.control.com/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'`,
    response: `{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "nome": "João Silva",
    "email": "usuario@exemplo.com",
    "role": "admin"
  }
}`
  },
  {
    title: 'Listar API Keys',
    description: 'Obter todas as chaves de API',
    method: 'GET',
    endpoint: '/api/keys',
    curl: `curl -X GET https://api.control.com/keys \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\
  -H "Content-Type: application/json"`,
    response: `{
  "success": true,
  "data": [
    {
      "id": "key-123",
      "key": "sk_test_abc123...",
      "clientId": "client-456",
      "clientName": "Empresa ABC",
      "maxInstallations": 10,
      "currentInstallations": 3,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "expiresAt": "2024-12-31T23:59:59Z"
    }
  ]
}`
  },
  {
    title: 'Criar API Key',
    description: 'Criar nova chave de API',
    method: 'POST',
    endpoint: '/api/keys',
    curl: `curl -X POST https://api.control.com/keys \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "clientId": "client-456",
    "maxInstallations": 5,
    "expiresAt": "2024-12-31T23:59:59Z"
  }'`,
    response: `{
  "success": true,
  "data": {
    "id": "key-789",
    "key": "sk_live_xyz789...",
    "clientId": "client-456",
    "maxInstallations": 5,
    "isActive": true,
    "createdAt": "2024-06-15T14:20:00Z",
    "expiresAt": "2024-12-31T23:59:59Z"
  }
}`
  },
  {
    title: 'Criar Cliente',
    description: 'Cadastrar novo cliente',
    method: 'POST',
    endpoint: '/api/clients',
    curl: `curl -X POST https://api.control.com/clients \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Empresa XYZ",
    "email": "contato@empresaxyz.com",
    "company": "XYZ Tecnologia Ltda",
    "phone": "+55 11 99999-9999"
  }'`,
    response: `{
  "success": true,
  "data": {
    "id": "client-101",
    "name": "Empresa XYZ",
    "email": "contato@empresaxyz.com",
    "company": "XYZ Tecnologia Ltda",
    "phone": "+55 11 99999-9999",
    "status": "active",
    "createdAt": "2024-06-15T14:30:00Z"
  }
}`
  },
  {
    title: 'Validar Instalação',
    description: 'Verificar se uma instalação é válida e registrar tentativa',
    method: 'POST',
    endpoint: '/api/validate',
    curl: `curl -X POST https://api-control.iacas.top/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "SUA_CHAVE_API_AQUI",
    "ipAddress": "192.168.1.100",
    "userAgent": "MeuApp/1.0"
  }'`,
    response: `{
  "success": true,
  "valid": true,
  "data": {
    "clientName": "Empresa XYZ",
    "installationId": "inst-456",
    "replacedInstallationId": "inst-123" // se houve substituição
  }
}`
  },
  {
    title: 'Verificar Status da Instalação',
    description: 'Consulta se uma instalação está ativa ou foi revogada',
    method: 'GET',
    endpoint: '/api/installations/status/:installationId',
    curl: `curl -X GET https://api-control.iacas.top/api/installations/status/inst-456`,
    response: `{
  "active": true,
  "message": "Instalação ativa"
}`
  },
  {
    title: 'Obter Métricas',
    description: 'Dashboard com estatísticas do sistema',
    method: 'GET',
    endpoint: '/api/metrics',
    curl: `curl -X GET https://api.control.com/metrics \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \\
  -H "Content-Type: application/json"`,
    response: `{
  "success": true,
  "data": {
    "totalActiveKeys": 45,
    "installationsToday": 23,
    "activeClients": 12,
    "successRate": 98.5
  }
}`
  }
];

export default function Documentation() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ScrollArea className="h-screen">
        <div className="container mx-auto py-10 space-y-8 px-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">Documentação do Sistema</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Guia completo de funcionalidades e recursos do sistema de gerenciamento de API Control
            </p>
          </div>

          <Separator />

          {/* Visão Geral */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-6 h-6" />
                Visão Geral do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                O API Control é um sistema de gerenciamento completo para administração de chaves de API, 
                controle de clientes e monitoramento de instalações. Desenvolvido com tecnologias modernas, 
                oferece uma interface intuitiva e recursos avançados para controle total do seu ecossistema de APIs.
              </p>
            </CardContent>
          </Card>

          {/* Funcionalidades Principais */}
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-gray-900 flex items-center gap-2">
              <Search className="w-8 h-8" />
              Funcionalidades Principais
            </h2>
            
            <div className="grid gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Icon className="w-6 h-6 text-primary" />
                        {feature.title}
                      </CardTitle>
                      <p className="text-gray-600">{feature.description}</p>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-medium mb-3">Funcionalidades incluídas:</h4>
                      <ul className="space-y-2">
                        {feature.functionalities.map((func, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <span className="text-gray-700">{func}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* API Reference com cURL */}
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-gray-900 flex items-center gap-2">
              <Code className="w-8 h-8" />
              Referência da API
            </h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Base URL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <code className="text-sm">https://api.control.com</code>
                </div>
                <p className="mt-2 text-gray-600">
                  Todas as requisições devem incluir o cabeçalho de autorização (exceto login).
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-6">
              {apiExamples.map((example, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{example.title}</CardTitle>
                      <Badge variant={example.method === 'GET' ? 'secondary' : 'default'}>
                        {example.method}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm">{example.description}</p>
                    <div className="bg-blue-50 p-2 rounded">
                      <code className="text-sm text-blue-800">{example.endpoint}</code>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h5 className="font-medium mb-2">cURL</h5>
                      <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm whitespace-pre-wrap">
                          <code>{example.curl}</code>
                        </pre>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Resposta</h5>
                      <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm">
                          <code>{example.response}</code>
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Especificações Técnicas */}
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-gray-900 flex items-center gap-2">
              <Database className="w-8 h-8" />
              Especificações Técnicas
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {systemSpecs.map((spec, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{spec.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {spec.items.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="mr-2 mb-2">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Guia de Uso Rápido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Guia de Uso Rápido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Primeiros Passos</h4>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    <li>Faça login no sistema</li>
                    <li>Configure seu perfil nas Configurações</li>
                    <li>Cadastre seus primeiros clientes</li>
                    <li>Crie API Keys para os clientes</li>
                    <li>Monitore as instalações no Dashboard</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Melhores Práticas</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Defina sempre datas de expiração para API Keys</li>
                    <li>• Monitore regularmente o uso das APIs</li>
                    <li>• Mantenha as informações dos clientes atualizadas</li>
                    <li>• Configure notificações para alertas importantes</li>
                    <li>• Faça backups regulares das configurações</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
