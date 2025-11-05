import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function SupabaseTest() {
    const [status, setStatus] = useState<string>('Testing connection…');
    const [rows, setRows] = useState<any[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const { data, error } = await supabase.from('students').select('*').limit(5);
                if (error) {
                    setStatus(`❌ ${error.message}`);
                    return;
                }
                setRows(data ?? []);
                setStatus(`✅ Connected. ${data?.length ?? 0} students found`);
            } catch (e: any) {
                setStatus(`❌ ${e.message}`);
            }
        })();
    }, []);

    return (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
            <div className="text-sm text-gray-200 mb-2">🔌 Supabase Connection Test</div>
            <div className="text-sm text-gray-300 mb-3">{status}</div>
            {rows.length > 0 && (
                <div className="space-y-1 text-xs text-gray-400 font-mono">
                    {rows.map((r) => (
                        <div key={r.id}>
                            {r.student_id} - {r.first_name} {r.last_name} | {r.major} | GPA: {r.gpa}
                        </div>
                    ))}
                </div>
            )}
            <div className="text-[11px] text-gray-500 mt-3">
                URL: {import.meta.env.VITE_SUPABASE_URL}
            </div>
        </div>
    );
}
