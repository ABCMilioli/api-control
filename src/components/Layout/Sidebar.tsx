import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Key, 
  Users, 
  Settings,
  Activity,
  LogOut,
  FileText,
  Bell,
  CreditCard
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Key, label: 'API Keys', path: '/api-keys' },
  { icon: Users, label: 'Clientes', path: '/clients' },
  { icon: Activity, label: 'Instalações', path: '/installations' },
  { icon: Bell, label: 'Notificações', path: '/notifications' },
  { icon: FileText, label: 'Documentação', path: '/documentation' },
  { icon: CreditCard, label: 'Pagamentos', path: '/payment-settings' },
  { icon: Settings, label: 'Configurações', path: '/settings' },
];

export function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuthStore();

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <h1 className="text-xl font-bold text-primary">API Control</h1>
        <p className="text-sm text-secondary">Sistema de Gerenciamento</p>
      </div>

      {/* Navigation with ScrollArea */}
      <ScrollArea className="flex-1 px-4 py-6">
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </ScrollArea>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {user?.nome.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="w-full flex items-center gap-2"
        >
          <LogOut size={16} />
          Sair
        </Button>
      </div>
    </div>
  );
}
