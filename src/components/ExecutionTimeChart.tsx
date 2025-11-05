import type { QueryLog } from '../types';
import { BarChart3 } from 'lucide-react';

interface ExecutionTimeChartProps {
  logs: QueryLog[];
}

export function ExecutionTimeChart({ logs }: ExecutionTimeChartProps) {
  const successfulLogs = logs.filter(log => log.status === 'success').slice(-10);

  if (successfulLogs.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-cyan-400" />
          Execution Time Trend
        </h2>
        <div className="text-center py-12 text-slate-400">
          <p>Execute some queries to see the execution time trend</p>
        </div>
      </div>
    );
  }

  const maxTime = Math.max(...successfulLogs.map(log => log.execution_time_ms));

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getBarColor = (time: number) => {
    if (time < 500) return 'bg-gradient-to-r from-emerald-500 to-green-500';
    if (time < 1000) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-red-500 to-rose-500';
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 p-6">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <BarChart3 size={20} className="text-cyan-400" />
        Execution Time Trend
      </h2>

      <div className="space-y-3">
        {successfulLogs.map((log, index) => {
          const percentage = (log.execution_time_ms / maxTime) * 100;

          return (
            <div key={log.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-mono">Query #{successfulLogs.length - index}</span>
                <span className="font-semibold">{formatTime(log.execution_time_ms)}</span>
              </div>
              <div className="relative h-8 bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700/30">
                <div
                  className={`absolute inset-y-0 left-0 ${getBarColor(log.execution_time_ms)} transition-all duration-500 rounded-lg flex items-center justify-end pr-3 shadow-lg`}
                  style={{ width: `${Math.max(percentage, 5)}%` }}
                >
                  {percentage > 30 && (
                    <span className="text-white text-xs font-semibold drop-shadow-lg">
                      {formatTime(log.execution_time_ms)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded shadow"></div>
              <span className="text-slate-400">&lt; 500ms</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded shadow"></div>
              <span className="text-slate-400">500ms - 1s</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-rose-500 rounded shadow"></div>
              <span className="text-slate-400">&gt; 1s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
