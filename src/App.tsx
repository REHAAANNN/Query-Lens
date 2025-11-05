import { useState } from 'react';
import { Database } from 'lucide-react';
import { QueryEditor } from './components/QueryEditor';
import { QueryLogTable } from './components/QueryLogTable';
import { PerformanceMetrics } from './components/PerformanceMetrics';
import { OptimizationPanel } from './components/OptimizationPanel';
import { ExecutionTimeChart } from './components/ExecutionTimeChart';
import { DatabaseViewer } from './components/DatabaseViewer';
import { QueryHistory } from './components/QueryHistory';
import { QueryResults } from './components/QueryResults';
import { QueryAnalyzer } from './services/QueryAnalyzer';
import { supabase } from './services/supabaseClient';
import SupabaseTest from './components/SupabaseTest';
import type { QueryLog, OptimizationSuggestion, QueryAlert } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'database'>('analyzer');
  const [logs, setLogs] = useState<QueryLog[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<QueryLog | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [alerts, setAlerts] = useState<QueryAlert[]>([]);
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [lastQuery, setLastQuery] = useState<string>('');
  const [lastExecutionTime, setLastExecutionTime] = useState<number>(0);

  const handleExecuteQuery = async (query: string) => {
    setIsExecuting(true);
    setQueryResults([]); // Clear previous results

    try {
      const result = await QueryAnalyzer.executeQuery(query);

      setLogs(prev => [result.log, ...prev]);

      setSelectedLog(result.log);
      setSuggestions(result.suggestions);
      setAlerts(result.alerts);
      setLastQuery(query);
      setLastExecutionTime(result.log.execution_time_ms);

      // Fetch actual query results if successful
      if (result.log.status === 'success') {
        const { data, error } = await supabase.rpc('execute_dynamic_query', { query_sql: query });

        if (!error && data && data.rows) {
          setQueryResults(data.rows);
        } else {
          setQueryResults([]);
        }
      } else {
        setQueryResults([]);
      }
    } catch (error) {
      console.error('Error executing query:', error);
      setQueryResults([]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSelectLog = (log: QueryLog) => {
    setSelectedLog(log);

    const logSuggestions = QueryAnalyzer.analyzeQuery(log.query_text).map(s => ({
      ...s,
      query_log_id: log.id,
    }));
    setSuggestions(logSuggestions);

    const logAlerts: QueryAlert[] = [];
    if (log.execution_time_ms > 1000) {
      logAlerts.push({
        id: Math.random().toString(36).substr(2, 9),
        query_log_id: log.id,
        alert_type: 'SLOW_QUERY',
        threshold_value: 1000,
        actual_value: log.execution_time_ms,
        created_at: log.created_at,
      });
    }
    if (log.memory_usage_mb > 100) {
      logAlerts.push({
        id: Math.random().toString(36).substr(2, 9),
        query_log_id: log.id,
        alert_type: 'HIGH_MEMORY',
        threshold_value: 100,
        actual_value: log.memory_usage_mb,
        created_at: log.created_at,
      });
    }
    setAlerts(logAlerts);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>

      <header className="relative bg-slate-900/70 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur-lg opacity-50 animate-pulse"></div>
                <div className="relative p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <Database className="text-white" size={28} />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  SQL Query Analyzer
                </h1>
                <p className="text-sm text-slate-400">AI-Powered Performance Monitoring & Optimization</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Real-time Analysis</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span>AI Suggestions</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 flex gap-2 border-b border-slate-700/50">
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`px-4 py-2 text-sm font-medium transition-all relative ${activeTab === 'analyzer'
                ? 'text-cyan-400'
                : 'text-slate-400 hover:text-slate-300'
                }`}
            >
              Query Analyzer
              {activeTab === 'analyzer' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`px-4 py-2 text-sm font-medium transition-all relative ${activeTab === 'database'
                ? 'text-cyan-400'
                : 'text-slate-400 hover:text-slate-300'
                }`}
            >
              Database Viewer
              {activeTab === 'database' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Query Analyzer Tab */}
        {activeTab === 'analyzer' && (
          <div className="space-y-6">
            {/* Connection check - styled better */}
            <div className="animate-fade-in">
              <SupabaseTest />
            </div>

            <div className="animate-fade-in-up [animation-delay:0.1s]">
              <QueryEditor onExecute={handleExecuteQuery} isExecuting={isExecuting} />
            </div>

            <div className="animate-fade-in-up [animation-delay:0.2s]">
              <PerformanceMetrics logs={logs} />
            </div>

            {/* Query Results Section - Shows after execution */}
            {queryResults.length > 0 && (
              <div className="animate-fade-in-up [animation-delay:0.25s]">
                <QueryResults
                  results={queryResults}
                  executionTime={lastExecutionTime}
                  query={lastQuery}
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up [animation-delay:0.3s]">
              <ExecutionTimeChart logs={logs} />
              <QueryHistory onSelectQuery={(query) => {
                // Load selected query from history into editor
                const editor = document.querySelector('textarea');
                if (editor) {
                  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                  nativeInputValueSetter?.call(editor, query);
                  editor.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up [animation-delay:0.35s]">
              <OptimizationPanel
                selectedLog={selectedLog}
                suggestions={suggestions}
                alerts={alerts}
              />
              <QueryLogTable
                logs={logs}
                onSelectLog={handleSelectLog}
                selectedLogId={selectedLog?.id}
              />
            </div>
          </div>
        )}

        {/* Database Viewer Tab */}
        {activeTab === 'database' && (
          <div className="animate-fade-in">
            <DatabaseViewer />
          </div>
        )}
      </main>

      <footer className="relative mt-12 py-6 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          Powered by PostgreSQL · Supabase · Google Gemini AI
        </div>
      </footer>
    </div>
  );
}

export default App;
