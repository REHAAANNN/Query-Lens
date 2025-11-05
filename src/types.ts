export interface QueryLog {
  id: string;
  query_text: string;
  execution_time_ms: number;
  cpu_usage_percent: number;
  memory_usage_mb: number;
  row_count: number;
  status: 'success' | 'error';
  error_message?: string;
  created_at: string;
}

export interface OptimizationSuggestion {
  id: string;
  query_log_id: string;
  suggestion_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface QueryAlert {
  id: string;
  query_log_id: string;
  alert_type: string;
  threshold_value: number;
  actual_value: number;
  created_at: string;
}

export interface QueryResult {
  log: QueryLog;
  suggestions: OptimizationSuggestion[];
  alerts: QueryAlert[];
}
