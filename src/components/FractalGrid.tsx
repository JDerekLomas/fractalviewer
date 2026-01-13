import { FractalGenome } from '../lib/types';
import { FractalCard } from './FractalCard';

interface FractalGridProps {
  population: FractalGenome[];
  onSelect: (id: string) => void;
  onReject: (id: string) => void;
}

export function FractalGrid({ population, onSelect, onReject }: FractalGridProps) {
  return (
    <div className="grid grid-cols-4 gap-4 p-4">
      {population.map((genome, index) => (
        <FractalCard
          key={genome.id}
          genome={genome}
          index={index}
          onSelect={onSelect}
          onReject={onReject}
        />
      ))}
    </div>
  );
}
