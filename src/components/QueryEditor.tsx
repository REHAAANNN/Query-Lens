import { useState, useEffect, useRef } from 'react';
import { Play, Sparkles, Lightbulb } from 'lucide-react';
import { AIQueryHelper } from '../services/AIQueryHelper';

interface QuerySuggestion {
  query: string;
  description: string;
  category: 'completion' | 'optimization' | 'template';
}

interface QueryEditorProps {
  onExecute: (query: string) => void;
  isExecuting: boolean;
}

export function QueryEditor({ onExecute, isExecuting }: QueryEditorProps) {
  const [query, setQuery] = useState('SELECT * FROM students WHERE gpa > 3.5 LIMIT 100');
  const [suggestions, setSuggestions] = useState<QuerySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch AI suggestions when query changes (auto-show while typing)
  useEffect(() => {
    const debounce = setTimeout(async () => {
      if (query.trim().length > 3) {
        // First show instant suggestions
        const instant = AIQueryHelper.getInstantSuggestions(query);
        if (instant.length > 0) {
          setSuggestions(instant);
          setShowSuggestions(true);
        }

        // Then fetch AI suggestions (async)
        setIsLoadingAI(true);
        try {
          const aiSuggestions = await AIQueryHelper.getCompletions(query);
          if (aiSuggestions.length > 0) {
            setSuggestions(aiSuggestions);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.warn('AI suggestions unavailable');
        } finally {
          setIsLoadingAI(false);
        }
      } else {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    }, 800);

    return () => clearTimeout(debounce);
  }, [query]);

  const handleExecute = () => {
    if (query.trim()) {
      onExecute(query);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: QuerySuggestion) => {
    setQuery(suggestion.query);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Execute query
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
      return;
    }

    // Navigate suggestions
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        if (e.key === 'Tab') e.preventDefault();
        handleSuggestionClick(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }

    // Ctrl+Space to show suggestions
    if ((e.metaKey || e.ctrlKey) && e.key === ' ') {
      e.preventDefault();
      const instant = AIQueryHelper.getInstantSuggestions(query);
      if (instant.length > 0) {
        setSuggestions(instant);
        setShowSuggestions(true);
      }
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6 hover:border-cyan-500/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Query Editor
          </h2>
          {isLoadingAI && (
            <Sparkles size={16} className="text-cyan-400 animate-pulse" />
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const templates = AIQueryHelper.getInstantSuggestions('');
              setSuggestions(templates);
              setShowSuggestions(true);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-all text-sm border border-slate-600/50"
            title="Show query templates"
          >
            <Lightbulb size={14} />
            Templates
          </button>
          <button
            onClick={handleExecute}
            disabled={isExecuting || !query.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105"
          >
            <Play size={16} />
            {isExecuting ? 'Executing...' : 'Execute'}
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Start typing SQL..."
          className="w-full h-40 p-4 font-mono text-sm bg-slate-950/50 text-slate-100 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none placeholder-slate-500 shadow-inner"
          disabled={isExecuting}
        />

        {/* AI Suggestions Dropdown - Below textarea with smooth expand/collapse */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${showSuggestions && suggestions.length > 0 ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="bg-slate-800/95 backdrop-blur-xl border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 overflow-hidden">
            <div className="sticky top-0 p-2 border-b border-slate-700 flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm">
              <Sparkles size={14} className="text-cyan-400 animate-pulse" />
              <span className="text-xs text-slate-300 font-medium">
                AI Suggestions {isLoadingAI && '(updating...)'}
              </span>
              <button
                onClick={() => setShowSuggestions(false)}
                className="ml-auto text-slate-400 hover:text-slate-200 transition-colors text-sm"
                title="Close suggestions (Esc)"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-80">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full text-left p-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/30 last:border-b-0 ${index === selectedIndex ? 'bg-cyan-900/30 border-l-2 border-l-cyan-400' : ''
                    }`}
                >
                  <div className="font-mono text-sm text-cyan-300 mb-1 line-clamp-1">
                    {suggestion.query}
                  </div>
                  <div className="text-xs text-slate-400">{suggestion.description}</div>
                  <div className="mt-1">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded ${suggestion.category === 'completion'
                        ? 'bg-blue-500/20 text-blue-300'
                        : suggestion.category === 'optimization'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-purple-500/20 text-purple-300'
                        }`}
                    >
                      {suggestion.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3">
        <p className="text-xs text-slate-400">
          <kbd className="px-2 py-1 bg-slate-700/50 rounded text-[10px]">Ctrl+Enter</kbd> Execute ·{' '}
          <kbd className="px-2 py-1 bg-slate-700/50 rounded text-[10px]">Ctrl+Space</kbd> Suggestions ·{' '}
          <kbd className="px-2 py-1 bg-slate-700/50 rounded text-[10px]">↑↓</kbd> Navigate
        </p>
        {isLoadingAI && (
          <span className="text-xs text-cyan-400 animate-pulse">✨ Loading AI suggestions...</span>
        )}
      </div>
    </div>
  );
}
