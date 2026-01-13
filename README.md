# Fractal Evolver 3D

An evolutionary 3D fractal art tool using Iterated Function Systems (IFS) with human-in-the-loop selection. Breed beautiful fractals by selecting your favorites and watching them evolve.

**Live Demo:** https://fractalviewer-dereklomas-projects.vercel.app

## How It Works

1. **View** - 6 procedurally generated 3D fractals displayed in a grid
2. **Select** - Click fractals you like (green border = selected)
3. **Breed** - Click "Breed Selected" to create offspring from your favorites
4. **Evolve** - Repeat to guide evolution toward aesthetically pleasing forms

## Features

- **35 seed fractals** including botanical forms (ferns, trees, coral, flowers) and geometric patterns
- **Genetic algorithms** with crossover and mutation operators
- **3D rendering** with Three.js point clouds
- **Detail view** - Click magnifier or double-click to see larger
- **Reproducible seeds** - Share seed numbers to recreate populations
- **Configurable evolution** - Adjust mutation rates, crossover types, and more

## Tech Stack

- React + TypeScript
- Three.js for 3D rendering
- Vite for build tooling
- Tailwind CSS for styling
- Vercel for deployment

## IFS Fractals

Each fractal is defined by 2-8 affine transformations. The chaos game algorithm iteratively applies random transformations to generate point clouds that form self-similar patterns.

Breeding combines transforms from parent fractals through:
- **Blend crossover** - Interpolate between parent transforms
- **Single-point crossover** - Swap transform sequences
- **Mutation** - Perturb rotation, scale, translation, and color

## Local Development

```bash
npm install
npm run dev
```

## Credits

Built with Claude Code (Anthropic)
