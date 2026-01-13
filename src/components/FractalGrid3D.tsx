import { FractalGenome3D } from '../lib/types3d';
import { FractalCard3D } from './FractalCard3D';

interface FractalGrid3DProps {
  population: FractalGenome3D[];
  onSelect: (id: string) => void;
  onReject: (id: string) => void;
  onViewDetail: (genome: FractalGenome3D) => void;
}

export function FractalGrid3D({ population, onSelect, onReject, onViewDetail }: FractalGrid3DProps) {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 h-full">
      {population.map((genome, index) => (
        <FractalCard3D
          key={genome.id}
          genome={genome}
          index={index}
          onSelect={onSelect}
          onReject={onReject}
          onViewDetail={() => onViewDetail(genome)}
        />
      ))}
    </div>
  );
}
