import { useState, useEffect } from 'react';
import { Database, RefreshCw, Search, Table2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface TableColumn {
    name: string;
    type: string;
}

interface TableData {
    columns: TableColumn[];
    rows: any[];
    totalCount: number;
}

export function DatabaseViewer() {
    const [selectedTable, setSelectedTable] = useState('students');
    const [tableData, setTableData] = useState<TableData | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 50;

    const availableTables = [
        { name: 'students', icon: '👥', description: '5000 student records' },
        { name: 'courses', icon: '📚', description: '50 course offerings' },
        { name: 'enrollments', icon: '📝', description: 'Student enrollments' }
    ]; useEffect(() => {
        fetchTableData();
    }, [selectedTable, currentPage]);

    const fetchTableData = async () => {
        setLoading(true);
        try {
            // Calculate offset
            const offset = (currentPage - 1) * rowsPerPage;

            // Fetch data with pagination
            const { data, error, count } = await supabase
                .from(selectedTable)
                .select('*', { count: 'exact' })
                .range(offset, offset + rowsPerPage - 1)
                .order('id', { ascending: true });

            if (error) throw error;

            // Get column information from the first row
            const columns = data && data.length > 0
                ? Object.keys(data[0]).map(key => ({
                    name: key,
                    type: typeof data[0][key]
                }))
                : [];

            setTableData({
                columns,
                rows: data || [],
                totalCount: count || 0
            });
        } catch (error) {
            console.error('Error fetching table data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRows = tableData?.rows.filter(row => {
        if (!searchTerm) return true;
        return Object.values(row).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }) || [];

    const totalPages = tableData ? Math.ceil(tableData.totalCount / rowsPerPage) : 0;

    return (
        <div className="bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6 hover:border-cyan-500/30 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
                        <Database size={24} className="text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            Database Viewer
                        </h2>
                        <p className="text-xs text-slate-400">
                            Browse your database tables and data
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchTableData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-all text-sm border border-slate-600/50 disabled:opacity-50"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Table Selector */}
            <div className="grid grid-cols-1 gap-3 mb-4">
                {availableTables.map(table => (
                    <button
                        key={table.name}
                        onClick={() => {
                            setSelectedTable(table.name);
                            setCurrentPage(1);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${selectedTable === table.name
                            ? 'bg-cyan-900/30 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                            : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                            }`}
                    >
                        <span className="text-2xl">{table.icon}</span>
                        <div className="flex-1">
                            <div className="font-semibold text-slate-200">{table.name}</div>
                            <div className="text-xs text-slate-400">{table.description}</div>
                        </div>
                        <Table2 size={16} className="text-slate-400" />
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search in table..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/50 text-slate-100 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm placeholder-slate-500"
                />
            </div>

            {/* Data Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                </div>
            ) : tableData && filteredRows.length > 0 ? (
                <>
                    <div className="overflow-x-auto rounded-lg border border-slate-700/50">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-900/50 border-b border-slate-700/50">
                                <tr>
                                    {tableData.columns.map(col => (
                                        <th
                                            key={col.name}
                                            className="px-4 py-3 text-left text-xs font-semibold text-cyan-400 uppercase tracking-wider"
                                        >
                                            {col.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {filteredRows.map((row, rowIndex) => (
                                    <tr
                                        key={rowIndex}
                                        className="hover:bg-slate-800/50 transition-colors"
                                    >
                                        {tableData.columns.map(col => (
                                            <td
                                                key={col.name}
                                                className="px-4 py-3 text-slate-300 max-w-xs truncate"
                                                title={String(row[col.name])}
                                            >
                                                {row[col.name] === null ? (
                                                    <span className="text-slate-500 italic">null</span>
                                                ) : typeof row[col.name] === 'boolean' ? (
                                                    <span className={row[col.name] ? 'text-green-400' : 'text-red-400'}>
                                                        {String(row[col.name])}
                                                    </span>
                                                ) : (
                                                    String(row[col.name])
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-xs text-slate-400">
                            Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
                            {Math.min(currentPage * rowsPerPage, tableData.totalCount)} of{' '}
                            {tableData.totalCount} rows
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded text-xs hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`px-3 py-1 rounded text-xs transition-all ${currentPage === pageNum
                                                ? 'bg-cyan-600 text-white'
                                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                {totalPages > 5 && <span className="text-slate-400 px-2">...</span>}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded text-xs hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-12 text-slate-400">
                    No data found
                </div>
            )}
        </div>
    );
}
