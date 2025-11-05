import { useState, useEffect } from 'react';
import { History, Trash2, Play, Clock } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface SavedQuery {
    id: string;
    query_text: string;
    execution_time_ms: number;
    created_at: string;
}

interface QueryHistoryProps {
    onSelectQuery: (query: string) => void;
}

export function QueryHistory({ onSelectQuery }: QueryHistoryProps) {
    const [history, setHistory] = useState<SavedQuery[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('query_logs')
                .select('id, query_text, execution_time_ms, created_at')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setHistory(data || []);
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteQuery = async (id: string) => {
        try {
            await supabase
                .from('query_logs')
                .delete()
                .eq('id', id);

            setHistory(prev => prev.filter(q => q.id !== id));
        } catch (error) {
            console.error('Error deleting query:', error);
        }
    };

    const clearAll = async () => {
        if (!confirm('Are you sure you want to clear all query history?')) return;

        try {
            await supabase
                .from('query_logs')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

            setHistory([]);
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    };

    return (
        <div className="bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <History size={20} className="text-cyan-400" />
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        Query History
                    </h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadHistory}
                        disabled={loading}
                        className="px-3 py-1.5 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-all text-xs disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                    <button
                        onClick={clearAll}
                        disabled={history.length === 0}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-all text-xs border border-red-500/30 disabled:opacity-50"
                    >
                        <Trash2 size={12} />
                        Clear All
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                </div>
            ) : history.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    <History size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No query history yet</p>
                    <p className="text-xs mt-1">Execute queries to build your history</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {history.map((item) => (
                        <div
                            key={item.id}
                            className="group bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 hover:border-cyan-500/30 transition-all"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="font-mono text-sm text-cyan-300 truncate mb-1">
                                        {item.query_text}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {item.execution_time_ms.toFixed(2)}ms
                                        </div>
                                        <div>
                                            {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onSelectQuery(item.query_text)}
                                        className="p-1.5 bg-blue-600/20 text-blue-300 rounded hover:bg-blue-600/30 transition-all"
                                        title="Load query"
                                    >
                                        <Play size={14} />
                                    </button>
                                    <button
                                        onClick={() => deleteQuery(item.id)}
                                        className="p-1.5 bg-red-600/20 text-red-300 rounded hover:bg-red-600/30 transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
