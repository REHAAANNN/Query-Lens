import { createClient } from '@supabase/supabase-js';
import type { QueryLog, OptimizationSuggestion, QueryAlert, QueryResult } from '../types';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const SLOW_QUERY_THRESHOLD_MS = 1000;
const HIGH_MEMORY_THRESHOLD_MB = 100;

export class QueryAnalyzer {
  private static generateId(): string {
    return crypto.randomUUID();
  }

  static analyzeQuery(queryText: string): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const queryLower = queryText.toLowerCase().trim();
    const queryLogId = this.generateId();

    if (queryLower.includes('select *')) {
      suggestions.push({
        id: this.generateId(),
        query_log_id: queryLogId,
        suggestion_type: 'SELECT_STAR',
        description: 'Avoid SELECT *. Explicitly list columns to: 1) Reduce network transfer, 2) Enable better indexing, 3) Make queries maintainable, 4) Prevent breaking changes when schema evolves.',
        severity: 'medium',
        created_at: new Date().toISOString(),
      });
    }

    if (!queryLower.includes('where') && (queryLower.includes('select') || queryLower.includes('update') || queryLower.includes('delete'))) {
      suggestions.push({
        id: this.generateId(),
        query_log_id: queryLogId,
        suggestion_type: 'MISSING_WHERE',
        description: 'Missing WHERE clause causes full table scan! This reads EVERY row which can: 1) Lock tables for minutes on large datasets, 2) Consume excessive memory, 3) Impact other queries. Add WHERE conditions or use pagination.',
        severity: 'high',
        created_at: new Date().toISOString(),
      });
    }

    if (queryLower.includes('or')) {
      suggestions.push({
        id: this.generateId(),
        query_log_id: queryLogId,
        suggestion_type: 'OR_CONDITION',
        description: 'OR conditions often prevent index usage. Alternative: Use IN clause for same column (WHERE col IN (1,2,3)), or use UNION for different columns. This can improve query speed by 10-100x.',
        severity: 'medium',
        created_at: new Date().toISOString(),
      });
    }

    if (queryLower.includes('like') && queryLower.match(/like\s+['"]%/)) {
      suggestions.push({
        id: this.generateId(),
        query_log_id: queryLogId,
        suggestion_type: 'LEADING_WILDCARD',
        description: 'Leading wildcard LIKE \'%text%\' forces full table scan! Alternatives: 1) Use full-text search (PostgreSQL: to_tsvector), 2) Use trigram indexes (pg_trgm), 3) Consider ElasticSearch for complex searches.',
        severity: 'high',
        created_at: new Date().toISOString(),
      });
    }

    if (!queryLower.includes('limit') && queryLower.includes('select')) {
      suggestions.push({
        id: this.generateId(),
        query_log_id: queryLogId,
        suggestion_type: 'MISSING_LIMIT',
        description: 'Add LIMIT to prevent accidentally loading millions of rows. Best practices: Use LIMIT 100-1000 for UI, implement cursor-based pagination for large datasets, consider OFFSET alternatives.',
        severity: 'medium',
        created_at: new Date().toISOString(),
      });
    }

    const joinCount = (queryLower.match(/join/g) || []).length;
    if (joinCount > 3) {
      suggestions.push({
        id: this.generateId(),
        query_log_id: queryLogId,
        suggestion_type: 'MULTIPLE_JOINS',
        description: `${joinCount} JOINs detected! Solutions: 1) Create materialized views for read-heavy queries, 2) Denormalize frequently accessed data, 3) Add covering indexes, 4) Split into multiple queries with application-level joins.`,
        severity: 'high',
        created_at: new Date().toISOString(),
      });
    }

    if (queryLower.includes('order by') && !queryLower.includes('limit')) {
      suggestions.push({
        id: this.generateId(),
        query_log_id: queryLogId,
        suggestion_type: 'ORDER_WITHOUT_LIMIT',
        description: 'ORDER BY without LIMIT sorts ALL rows in memory! Solutions: 1) Add LIMIT if you only need top N results, 2) Create index on ORDER BY columns, 3) Use OFFSET-LIMIT for pagination (or better: cursor-based).',
        severity: 'high',
        created_at: new Date().toISOString(),
      });
    }

    if (queryLower.includes('distinct')) {
      suggestions.push({
        id: this.generateId(),
        query_log_id: queryLogId,
        suggestion_type: 'DISTINCT_USAGE',
        description: 'DISTINCT can be expensive on large datasets. Alternatives: 1) Use GROUP BY if aggregating, 2) Fix data model to prevent duplicates, 3) Add unique constraints, 4) Use window functions for complex cases.',
        severity: 'low',
        created_at: new Date().toISOString(),
      });
    }

    if (queryLower.includes('!=') || queryLower.includes('<>')) {
      suggestions.push({
        id: this.generateId(),
        query_log_id: queryLogId,
        suggestion_type: 'NOT_EQUAL_OPERATOR',
        description: 'NOT EQUAL (!=, <>) often prevents index usage. Better: Use positive conditions (= IN) combined with NOT EXISTS subquery for complex exclusions, or add partial indexes for specific values.',
        severity: 'low',
        created_at: new Date().toISOString(),
      });
    }

    if (queryLower.includes('offset')) {
      suggestions.push({
        id: this.generateId(),
        query_log_id: queryLogId,
        suggestion_type: 'OFFSET_PAGINATION',
        description: 'OFFSET pagination becomes slower on deep pages! For page 1000, database still scans 1000*limit rows. Solution: Use cursor-based pagination with WHERE id > last_id LIMIT N for consistent performance.',
        severity: 'medium',
        created_at: new Date().toISOString(),
      });
    }

    if (queryLower.match(/where.*\([^)]*select/)) {
      suggestions.push({
        id: this.generateId(),
        query_log_id: queryLogId,
        suggestion_type: 'SUBQUERY_IN_WHERE',
        description: 'Subquery in WHERE can execute for each row! Optimizations: 1) Convert to JOIN when possible, 2) Use EXISTS instead of IN for large subqueries, 3) Create temporary table for complex subqueries, 4) Add indexes on subquery columns.',
        severity: 'high',
        created_at: new Date().toISOString(),
      });
    }

    return suggestions;
  }

  static async executeQuery(queryText: string): Promise<QueryResult> {
    const startTime = performance.now();

    try {
      // Get EXPLAIN ANALYZE with real PostgreSQL metrics
      const { data: explainData, error: explainError } = await supabase.rpc('execute_explain_analyze', { query_sql: queryText });

      // Execute the actual query
      const { data: queryData, error: queryError } = await supabase.rpc('execute_dynamic_query', { query_sql: queryText });

      const endTime = performance.now();
      const clientExecutionTime = endTime - startTime;

      const isError = !!queryError || !!explainError || (queryData as any)?.error;
      const errorMessage = queryError?.message || explainError?.message || (queryData as any)?.error;

      // Extract real metrics from EXPLAIN ANALYZE
      let executionTime = clientExecutionTime;
      let rowCount = 0;
      let cpuUsage = 0;
      let memoryUsage = 0;

      if (!isError && explainData) {
        // Use actual PostgreSQL execution time from EXPLAIN
        executionTime = explainData.execution_time_ms || clientExecutionTime;
        rowCount = explainData.actual_rows || (queryData?.row_count || 0);

        // Estimate CPU usage based on actual query cost and execution time
        // Higher cost and longer time = more CPU usage
        const totalCost = explainData.total_cost || 0;

        // CPU estimation: based on execution time relative to threshold
        // Fast queries (<100ms) = 10-30%, Medium (100-500ms) = 30-60%, Slow (>500ms) = 60-90%
        if (executionTime < 100) {
          cpuUsage = 10 + (executionTime / 100) * 20; // 10-30%
        } else if (executionTime < 500) {
          cpuUsage = 30 + ((executionTime - 100) / 400) * 30; // 30-60%
        } else {
          cpuUsage = 60 + Math.min(((executionTime - 500) / 1000) * 30, 30); // 60-90%
        }

        // Memory estimation: based on rows processed and buffer statistics
        // Each row ~1KB estimate, plus buffer usage
        const sharedHitBlocks = explainData.shared_hit_blocks || 0;
        const sharedReadBlocks = explainData.shared_read_blocks || 0;
        const bufferMB = ((sharedHitBlocks + sharedReadBlocks) * 8) / 1024; // 8KB blocks to MB

        memoryUsage = (rowCount * 0.001) + bufferMB + (totalCost / 1000);
      } else if (!isError && queryData) {
        // Fallback if EXPLAIN fails but query succeeds
        rowCount = queryData.row_count || 0;
        cpuUsage = executionTime > 500 ? 45 : 25;
        memoryUsage = rowCount * 0.001 + 5;
      } const log: QueryLog = {
        id: this.generateId(),
        query_text: queryText,
        execution_time_ms: Math.round(executionTime * 100) / 100,
        cpu_usage_percent: Math.round(cpuUsage * 100) / 100,
        memory_usage_mb: Math.round(memoryUsage * 100) / 100,
        row_count: rowCount,
        status: isError ? 'error' : 'success',
        error_message: isError ? errorMessage : undefined,
        created_at: new Date().toISOString(),
      };

      const { data: savedLog } = await supabase.from('query_logs').insert({
        query_text: log.query_text,
        execution_time_ms: log.execution_time_ms,
        cpu_usage_percent: log.cpu_usage_percent,
        memory_usage_mb: log.memory_usage_mb,
        row_count: log.row_count,
        status: log.status,
        error_message: log.error_message,
        execution_plan: explainData,
      }).select().single();

      const logId = savedLog?.id || log.id;
      const suggestions = isError ? [] : this.analyzeQuery(queryText);
      suggestions.forEach(s => { s.query_log_id = logId; });

      if (suggestions.length > 0) {
        await supabase.from('optimization_suggestions').insert(
          suggestions.map(s => ({
            query_log_id: s.query_log_id,
            suggestion_type: s.suggestion_type,
            description: s.description,
            severity: s.severity,
            ai_generated: false,
          }))
        );
      }

      const alerts: QueryAlert[] = [];
      if (!isError && executionTime > SLOW_QUERY_THRESHOLD_MS) {
        alerts.push({
          id: this.generateId(),
          query_log_id: logId,
          alert_type: 'SLOW_QUERY',
          threshold_value: SLOW_QUERY_THRESHOLD_MS,
          actual_value: Math.round(executionTime * 100) / 100,
          created_at: new Date().toISOString(),
        });
      }

      if (!isError && memoryUsage > HIGH_MEMORY_THRESHOLD_MB) {
        alerts.push({
          id: this.generateId(),
          query_log_id: logId,
          alert_type: 'HIGH_MEMORY',
          threshold_value: HIGH_MEMORY_THRESHOLD_MB,
          actual_value: Math.round(memoryUsage * 100) / 100,
          created_at: new Date().toISOString(),
        });
      }

      if (alerts.length > 0) {
        await supabase.from('query_alerts').insert(alerts.map(a => ({
          query_log_id: a.query_log_id,
          alert_type: a.alert_type,
          threshold_value: a.threshold_value,
          actual_value: a.actual_value,
        })));
      }

      return { log: savedLog || log, suggestions, alerts };
    } catch (error: any) {
      const log: QueryLog = {
        id: this.generateId(),
        query_text: queryText,
        execution_time_ms: 0,
        cpu_usage_percent: 0,
        memory_usage_mb: 0,
        row_count: 0,
        status: 'error',
        error_message: error.message,
        created_at: new Date().toISOString(),
      };
      await supabase.from('query_logs').insert(log);
      return { log, suggestions: [], alerts: [] };
    }
  }
}