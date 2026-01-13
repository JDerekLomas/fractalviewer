import { useState, useMemo } from 'react';
import { FractalGenome3D } from '../lib/types3d';

interface FeedbackPanel3DProps {
  population: FractalGenome3D[];
  generation: number;
  comment: string;
  onCommentChange: (comment: string) => void;
}

export function FeedbackPanel3D({ population, generation, comment, onCommentChange }: FeedbackPanel3DProps) {
  const [copied, setCopied] = useState(false);

  const selected = population.filter(g => g.rating === 'up');
  const rejected = population.filter(g => g.rating === 'down');

  const exportData = useMemo(() => {
    const lines: string[] = [];
    lines.push(`## Generation ${generation} Feedback (3D)`);
    lines.push('');

    if (selected.length > 0) {
      lines.push(`### Selected (${selected.length}):`);
      selected.forEach((g) => {
        const idx = population.findIndex(p => p.id === g.id) + 1;
        lines.push(`- #${idx}: ${g.id}`);
      });
      lines.push('');
    }

    if (rejected.length > 0) {
      lines.push(`### Rejected (${rejected.length}):`);
      rejected.forEach((g) => {
        const idx = population.findIndex(p => p.id === g.id) + 1;
        lines.push(`- #${idx}: ${g.id}`);
      });
      lines.push('');
    }

    if (comment?.trim()) {
      lines.push('### Comments:');
      lines.push(comment);
      lines.push('');
    }

    if (selected.length > 0) {
      lines.push('### Selected Genome Data (3D):');
      lines.push('```json');
      lines.push(JSON.stringify(selected.map(g => ({
        id: g.id,
        transforms: g.transforms,
        generation: g.generation,
        parentIds: g.parentIds,
      })), null, 2));
      lines.push('```');
    }

    return lines.join('\n');
  }, [population, generation, comment, selected, rejected]);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-2">
            General comments about this generation:
          </label>
          <textarea
            value={comment}
            onChange={e => onCommentChange(e.target.value)}
            placeholder="What 3D patterns do you like? Any feedback..."
            className="w-full h-24 p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-zinc-400">Feedback export:</span>
              <span className="text-xs text-zinc-600">
                {selected.length} selected, {rejected.length} rejected
              </span>
            </div>
            <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-400 overflow-auto max-h-48 font-mono">
              {exportData}
            </pre>
          </div>
          <button
            onClick={handleCopy}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all mt-6
              ${copied
                ? 'bg-green-600 text-white'
                : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}
            `}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
