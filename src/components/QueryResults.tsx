import { FileJson, FileSpreadsheet } from 'lucide-react';

interface QueryResultsProps {
    results: any[];
    executionTime: number;
    query: string;
}

export function QueryResults({ results, executionTime, query }: QueryResultsProps) {
    const exportToCSV = () => {
        if (results.length === 0) return;

        const headers = Object.keys(results[0]);
        const csvContent = [
            headers.join(','),
            ...results.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Escape commas and quotes
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `query-results-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportToJSON = () => {
        if (results.length === 0) return;

        const jsonContent = JSON.stringify({
            query,
            executionTime,
            rowCount: results.length,
            timestamp: new Date().toISOString(),
            data: results
        }, null, 2);

        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `query-results-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (results.length === 0) {
        return (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8 text-center">
                <p className="text-slate-400">No results to display. Run a query to see results.</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        Query Results
                    </h3>
                    <p className="text-xs text-slate-400">
                        {results.length} rows · {executionTime.toFixed(2)}ms
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600/20 text-green-300 rounded-lg hover:bg-green-600/30 transition-all text-sm border border-green-500/30"
                        title="Export as CSV"
                    >
                        <FileSpreadsheet size={14} />
                        CSV
                    </button>
                    <button
                        onClick={exportToJSON}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-all text-sm border border-blue-500/30"
                        title="Export as JSON"
                    >
                        <FileJson size={14} />
                        JSON
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-700/50 max-h-96">
                <table className="w-full text-sm">
                    <thead className="bg-slate-900/50 border-b border-slate-700/50 sticky top-0">
                        <tr>
                            {Object.keys(results[0]).map(key => (
                                <th
                                    key={key}
                                    className="px-4 py-3 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider"
                                >
                                    {key}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                        {results.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-slate-800/50 transition-colors">
                                {Object.keys(results[0]).map(key => (
                                    <td
                                        key={key}
                                        className="px-4 py-3 text-slate-300 max-w-xs truncate"
                                        title={String(row[key])}
                                    >
                                        {row[key] === null ? (
                                            <span className="text-slate-500 italic">null</span>
                                        ) : typeof row[key] === 'boolean' ? (
                                            <span className={row[key] ? 'text-green-400' : 'text-red-400'}>
                                                {String(row[key])}
                                            </span>
                                        ) : (
                                            String(row[key])
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
