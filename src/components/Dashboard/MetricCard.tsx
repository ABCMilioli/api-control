
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon,
  iconColor = 'text-primary'
}: MetricCardProps) {
  const changeColorClass = {
    positive: 'text-success',
    negative: 'text-destructive',
    neutral: 'text-secondary'
  }[changeType];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {change && (
              <p className={`text-sm mt-1 ${changeColorClass}`}>
                {change}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-gray-50 ${iconColor}`}>
            <Icon size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
