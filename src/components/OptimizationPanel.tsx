import type { OptimizationSuggestion, QueryAlert, QueryLog } from '../types';
import { Lightbulb, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface OptimizationPanelProps {
  selectedLog: QueryLog | null;
  suggestions: OptimizationSuggestion[];
  alerts: QueryAlert[];
}

export function OptimizationPanel({ selectedLog, suggestions, alerts }: OptimizationPanelProps) {
  if (!selectedLog) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Optimization Insights</h2>
        <div className="text-center py-12 text-slate-400">
          <Lightbulb size={48} className="mx-auto mb-4 text-slate-600" />
          <p>Select a query from the history to see optimization suggestions</p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-900/30 border-red-500/50 text-red-200';
      case 'medium':
        return 'bg-yellow-900/30 border-yellow-500/50 text-yellow-200';
      case 'low':
        return 'bg-blue-900/30 border-blue-500/50 text-blue-200';
      default:
        return 'bg-slate-700/30 border-slate-500/50 text-slate-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertCircle size={18} />;
      case 'medium':
        return <AlertTriangle size={18} />;
      case 'low':
        return <Info size={18} />;
      default:
        return <Lightbulb size={18} />;
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Optimization Insights</h2>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-300 mb-2">Query</h3>
        <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-600/50">
          <code className="text-sm font-mono text-cyan-300 whitespace-pre-wrap break-all">
            {selectedLog.query_text}
          </code>
        </div>
      </div>

      {selectedLog.status === 'error' && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="font-medium text-red-200">Query Error</h4>
              <p className="text-sm text-red-300 mt-1">{selectedLog.error_message}</p>
            </div>
          </div>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-400" />
            Performance Alerts
          </h3>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 bg-orange-900/30 border border-orange-500/50 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-orange-200 text-sm">
                      {alert.alert_type === 'SLOW_QUERY' && 'Slow Query Detected'}
                      {alert.alert_type === 'HIGH_MEMORY' && 'High Memory Usage'}
                    </p>
                    <p className="text-xs text-orange-300 mt-1">
                      Threshold: {alert.threshold_value} | Actual: {alert.actual_value.toFixed(2)}
                      {alert.alert_type === 'SLOW_QUERY' ? 'ms' : 'MB'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <Lightbulb size={16} className="text-yellow-400" />
            Optimization Suggestions
          </h3>
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-4 rounded-lg border ${getSeverityColor(suggestion.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getSeverityIcon(suggestion.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm capitalize">
                        {suggestion.suggestion_type.replace(/_/g, ' ')}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900/60 uppercase font-semibold">
                        {suggestion.severity}
                      </span>
                    </div>
                    <p className="text-sm opacity-95">{suggestion.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        selectedLog.status === 'success' && (
          <div className="text-center py-8 text-slate-400">
            <Lightbulb size={40} className="mx-auto mb-3 text-emerald-400" />
            <p className="font-medium text-emerald-300">Query looks good!</p>
            <p className="text-sm mt-1">No optimization suggestions at this time.</p>
          </div>
        )
      )}
    </div>
  );
}
