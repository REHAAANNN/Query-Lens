import type { QueryLog } from '../types';
import { CheckCircle, XCircle, Clock, Cpu, HardDrive } from 'lucide-react';

interface QueryLogTableProps {
  logs: QueryLog[];
  onSelectLog: (log: QueryLog) => void;
  selectedLogId?: string;
}

export function QueryLogTable({ logs, onSelectLog, selectedLogId }: QueryLogTableProps) {
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700/50">
        <h2 className="text-lg font-semibold text-white">Query History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/50 border-b border-slate-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Query
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                Execution
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                CPU
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                Memory
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                Rows
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                  No queries executed yet. Try running a query above.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => onSelectLog(log)}
                  className={`cursor-pointer hover:bg-slate-700/30 transition-colors ${
                    selectedLogId === log.id ? 'bg-cyan-900/30 border-l-4 border-cyan-500' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    <div className="text-sm font-mono text-slate-200 truncate">
                      {log.query_text}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.status === 'success'
                          ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/50'
                          : 'bg-red-900/40 text-red-300 border border-red-500/50'
                      }`}
                    >
                      {log.status === 'success' ? (
                        <CheckCircle size={12} />
                      ) : (
                        <XCircle size={12} />
                      )}
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="inline-flex items-center gap-1 text-sm text-slate-200">
                      <Clock size={14} className="text-cyan-400" />
                      {formatTime(log.execution_time_ms)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="inline-flex items-center gap-1 text-sm text-slate-200">
                      <Cpu size={14} className="text-blue-400" />
                      {log.cpu_usage_percent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="inline-flex items-center gap-1 text-sm text-slate-200">
                      <HardDrive size={14} className="text-purple-400" />
                      {log.memory_usage_mb.toFixed(1)}MB
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-200">
                    {log.row_count.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
