import type { QueryLog } from '../types';
import { TrendingUp, Clock, Zap } from 'lucide-react';

interface PerformanceMetricsProps {
  logs: QueryLog[];
}

export function PerformanceMetrics({ logs }: PerformanceMetricsProps) {
  const successfulLogs = logs.filter(log => log.status === 'success');

  const avgExecutionTime = successfulLogs.length > 0
    ? successfulLogs.reduce((sum, log) => sum + log.execution_time_ms, 0) / successfulLogs.length
    : 0;

  const totalQueries = logs.length;
  const successRate = totalQueries > 0
    ? (successfulLogs.length / totalQueries) * 100
    : 0;

  const metrics = [
    {
      label: 'Total Queries',
      value: totalQueries.toString(),
      icon: TrendingUp,
      bgColor: 'from-blue-500 to-cyan-500',
      iconBg: 'bg-blue-500/20',
      textColor: 'text-blue-400',
    },
    {
      label: 'Avg Execution Time',
      value: avgExecutionTime < 1000
        ? `${avgExecutionTime.toFixed(0)}ms`
        : `${(avgExecutionTime / 1000).toFixed(2)}s`,
      icon: Clock,
      bgColor: 'from-emerald-500 to-teal-500',
      iconBg: 'bg-emerald-500/20',
      textColor: 'text-emerald-400',
    },
    {
      label: 'Success Rate',
      value: `${successRate.toFixed(1)}%`,
      icon: Zap,
      bgColor: 'from-orange-500 to-amber-500',
      iconBg: 'bg-orange-500/20',
      textColor: 'text-orange-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">{metric.label}</p>
                <p className="text-3xl font-bold text-white mt-2">{metric.value}</p>
              </div>
              <div className={`p-3 ${metric.iconBg} rounded-xl`}>
                <Icon className={metric.textColor} size={28} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
