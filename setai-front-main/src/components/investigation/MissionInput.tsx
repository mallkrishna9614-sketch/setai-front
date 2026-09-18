import React from 'react';

interface MissionInputProps {
  query: string;
  onChangeQuery: (query: string) => void;
  onInvestigate: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

const EXAMPLE_QUERIES = [
  "Describe the land-cover and major objects visible in this image.",
  "Highlight the water body referred to in the query.",
  "What changed between these two dates, and where did the change occur?",
  "Use the optical and SAR images together to identify built-up and water-covered regions.",
  "Has the built-up area increased, decreased, or remained unchanged?"
];

export const MissionInput: React.FC<MissionInputProps> = ({
  query,
  onChangeQuery,
  onInvestigate,
  isLoading,
  disabled = false
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (query.trim() && !isLoading && !disabled) {
        onInvestigate();
      }
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-neutral-300">
          Mission query
        </label>
        {query && (
          <button
            onClick={() => onChangeQuery('')}
            disabled={isLoading}
            className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Query Textarea */}
      <div className="relative">
        <textarea
          value={query}
          onChange={(e) => onChangeQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={3}
          placeholder="State your Earth observation query (e.g., 'Describe the land-cover and major objects visible in this image.')..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-md p-3 text-xs text-neutral-100 placeholder-neutral-500 font-sans focus:outline-none focus:border-neutral-600 transition-colors resize-none disabled:opacity-50"
        />
        <div className="absolute bottom-2.5 right-2.5 text-[11px] text-neutral-500 font-mono">
          Ctrl + Enter to run
        </div>
      </div>

      {/* Example Queries */}
      <div className="space-y-1.5 pt-1">
        <span className="text-xs text-neutral-400 block">
          Suggested queries:
        </span>
        <div className="flex flex-col gap-1">
          {EXAMPLE_QUERIES.map((example, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChangeQuery(example)}
              disabled={isLoading}
              className="text-left text-xs text-neutral-400 hover:text-neutral-200 hover:underline transition-colors py-0.5"
            >
              • {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
