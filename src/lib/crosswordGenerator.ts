// Crossword grid generation with embedded clue cells

export interface CrosswordWord {
  id: string;
  word: string;
  clue: string;
  category: string;
  direction: "across" | "down";
  row: number;
  col: number;
  number: number;
}

export interface DisplayCell {
  type: "empty" | "letter" | "clue";
  letter?: string;
  clueText?: string;
  arrows?: ("right" | "down")[];
  number?: number;
  wordIds?: string[];
  category?: string;
}

export interface CrosswordGrid {
  displayCells: DisplayCell[][];
  words: CrosswordWord[];
  width: number;
  height: number;
}

interface PlacedWord {
  word: string;
  id: string;
  clue: string;
  category: string;
  row: number;
  col: number;
  direction: "across" | "down";
}

export function generateCrossword(
  terms: { id: string; term: string; clue: string; category: string }[],
  targetCount: number = 10
): CrosswordGrid {
  const GRID = 22;
  const grid: (string | null)[][] = Array.from({ length: GRID }, () => Array(GRID).fill(null));

  const cleaned = terms
    .map((t) => ({
      ...t,
      word: t.term.toUpperCase().replace(/[^A-Z]/g, ""),
    }))
    .filter((t) => t.word.length >= 3 && t.word.length <= 12)
    .sort((a, b) => b.word.length - a.word.length);

  if (cleaned.length === 0) {
    return { displayCells: [[]], words: [], width: 0, height: 0 };
  }

  const placed: PlacedWord[] = [];

  // Place first word horizontally, leaving col 0 free for its clue cell
  const first = cleaned[0];
  const startCol = 2; // leave room for clue cell
  const startRow = Math.floor(GRID / 2);
  for (let i = 0; i < first.word.length; i++) {
    grid[startRow][startCol + i] = first.word[i];
  }
  placed.push({ ...first, row: startRow, col: startCol, direction: "across" });

  // Place remaining words via intersection
  for (let idx = 1; idx < cleaned.length && placed.length < targetCount; idx++) {
    const term = cleaned[idx];
    let best: { row: number; col: number; direction: "across" | "down"; score: number } | null = null;

    for (const pw of placed) {
      for (let pi = 0; pi < pw.word.length; pi++) {
        for (let ti = 0; ti < term.word.length; ti++) {
          if (pw.word[pi] !== term.word[ti]) continue;

          const newDir: "across" | "down" = pw.direction === "across" ? "down" : "across";
          let nr: number, nc: number;
          if (newDir === "down") {
            nr = pw.row - ti;
            nc = pw.col + pi;
          } else {
            nr = pw.row + pi;
            nc = pw.col - ti;
          }

          if (!isValidPlacement(grid, term.word, nr, nc, newDir, GRID)) continue;

          // Ensure space for clue cell before word start
          const clueR = newDir === "down" ? nr - 1 : nr;
          const clueC = newDir === "across" ? nc - 1 : nc;
          if (clueR < 0 || clueC < 0 || clueR >= GRID || clueC >= GRID) continue;
          if (grid[clueR][clueC] !== null) continue; // clue cell blocked

          const score = 1;
          if (!best || score > best.score) {
            best = { row: nr, col: nc, direction: newDir, score };
          }
        }
      }
    }

    if (best) {
      for (let i = 0; i < term.word.length; i++) {
        const r = best.row + (best.direction === "down" ? i : 0);
        const c = best.col + (best.direction === "across" ? i : 0);
        grid[r][c] = term.word[i];
      }
      placed.push({ ...term, row: best.row, col: best.col, direction: best.direction });
    }
  }

  // Build display grid with clue cells
  return buildDisplayGrid(grid, placed, GRID);
}

function isValidPlacement(
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  direction: "across" | "down",
  size: number
): boolean {
  const len = word.length;
  const dr = direction === "down" ? 1 : 0;
  const dc = direction === "across" ? 1 : 0;

  if (row + dr * (len - 1) >= size || col + dc * (len - 1) >= size) return false;
  if (row < 0 || col < 0) return false;

  let hasIntersection = false;

  for (let i = 0; i < len; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    const existing = grid[r][c];

    if (existing !== null) {
      if (existing !== word[i]) return false;
      hasIntersection = true;
    } else {
      if (direction === "across") {
        if (r > 0 && grid[r - 1][c] !== null) return false;
        if (r < size - 1 && grid[r + 1][c] !== null) return false;
      } else {
        if (c > 0 && grid[r][c - 1] !== null) return false;
        if (c < size - 1 && grid[r][c + 1] !== null) return false;
      }
    }
  }

  // Before/after checks
  const bR = row - dr, bC = col - dc;
  if (bR >= 0 && bC >= 0 && grid[bR][bC] !== null) return false;
  const aR = row + dr * len, aC = col + dc * len;
  if (aR < size && aC < size && grid[aR][aC] !== null) return false;

  return hasIntersection;
}

function buildDisplayGrid(
  letterGrid: (string | null)[][],
  placed: PlacedWord[],
  gridSize: number
): CrosswordGrid {
  // Find bounds of letter content
  let minR = gridSize, maxR = 0, minC = gridSize, maxC = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (letterGrid[r][c] !== null) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }

  // Expand bounds to include clue cells (1 cell before each word)
  for (const w of placed) {
    const clueR = w.direction === "down" ? w.row - 1 : w.row;
    const clueC = w.direction === "across" ? w.col - 1 : w.col;
    minR = Math.min(minR, clueR);
    maxR = Math.max(maxR, clueR);
    minC = Math.min(minC, clueC);
    maxC = Math.max(maxC, clueC);
  }

  // Ensure bounds are valid
  minR = Math.max(0, minR);
  minC = Math.max(0, minC);

  const width = maxC - minC + 1;
  const height = maxR - minR + 1;

  // Build display cells
  const displayCells: DisplayCell[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ type: "empty" as const }))
  );

  // Place letter cells
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (letterGrid[r]?.[c] !== null && letterGrid[r]?.[c] !== undefined) {
        displayCells[r - minR][c - minC] = {
          type: "letter",
          letter: letterGrid[r][c]!,
        };
      }
    }
  }

  // Assign numbers and place clue cells
  const adjustedPlaced = placed.map((p) => ({
    ...p,
    row: p.row - minR,
    col: p.col - minC,
  }));

  // Sort for numbering
  const sorted = [...adjustedPlaced].sort((a, b) => {
    const posA = a.row * width + a.col;
    const posB = b.row * width + b.col;
    return posA - posB;
  });

  const numberMap = new Map<string, number>();
  let num = 1;

  const words: CrosswordWord[] = sorted.map((p) => {
    const key = `${p.row}-${p.col}`;
    if (!numberMap.has(key)) {
      numberMap.set(key, num++);
    }
    return {
      id: p.id,
      word: p.word,
      clue: p.clue,
      category: p.category,
      direction: p.direction,
      row: p.row,
      col: p.col,
      number: numberMap.get(key)!,
    };
  });

  // Place clue cells
  for (const w of words) {
    const clueR = w.direction === "down" ? w.row - 1 : w.row;
    const clueC = w.direction === "across" ? w.col - 1 : w.col;

    if (clueR >= 0 && clueC >= 0 && clueR < height && clueC < width) {
      const existing = displayCells[clueR][clueC];
      if (existing.type === "clue") {
        // Merge: add direction
        existing.arrows = [...(existing.arrows || []), w.direction === "across" ? "right" : "down"];
        existing.wordIds = [...(existing.wordIds || []), w.id];
        // Keep first clue short, add separator
        existing.clueText = (existing.clueText || "") + " ▪ " + truncateClue(w.clue);
      } else if (existing.type === "empty") {
        displayCells[clueR][clueC] = {
          type: "clue",
          clueText: truncateClue(w.clue),
          arrows: [w.direction === "across" ? "right" : "down"],
          number: w.number,
          wordIds: [w.id],
        };
      }
      // If it's a letter cell, the clue can't go there - number on letter cell will suffice
    }
  }

  return { displayCells, words, width, height };
}

function truncateClue(clue: string): string {
  if (clue.length <= 40) return clue;
  return clue.slice(0, 37) + "…";
}

export function getLevelConfig(level: number) {
  switch (level) {
    case 1: return { name: "Foundation", wordCount: 8, clueStyle: "definition", timed: false, hints: true, color: "hsl(200 70% 50%)" };
    case 2: return { name: "Understanding", wordCount: 10, clueStyle: "detailed", timed: false, hints: true, color: "hsl(160 60% 45%)" };
    case 3: return { name: "Application", wordCount: 12, clueStyle: "scenario", timed: false, hints: true, color: "hsl(40 80% 50%)" };
    case 4: return { name: "State Board", wordCount: 13, clueStyle: "exam", timed: true, hints: false, color: "hsl(0 65% 50%)" };
    case 5: return { name: "Mastery", wordCount: 15, clueStyle: "mixed", timed: true, hints: false, color: "hsl(280 60% 50%)" };
    default: return { name: "Foundation", wordCount: 8, clueStyle: "definition", timed: false, hints: true, color: "hsl(200 70% 50%)" };
  }
}
