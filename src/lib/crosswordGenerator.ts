// Crossword grid generation algorithm
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

export interface CrosswordGrid {
  cells: (string | null)[][];
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

function canPlace(
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  direction: "across" | "down",
  width: number,
  height: number
): boolean {
  const len = word.length;
  const dr = direction === "down" ? 1 : 0;
  const dc = direction === "across" ? 1 : 0;

  // Check bounds
  if (row + dr * (len - 1) >= height || col + dc * (len - 1) >= width) return false;
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
      // Check adjacent cells perpendicular to direction
      if (direction === "across") {
        if (r > 0 && grid[r - 1][c] !== null) return false;
        if (r < height - 1 && grid[r + 1][c] !== null) return false;
      } else {
        if (c > 0 && grid[r][c - 1] !== null) return false;
        if (c < width - 1 && grid[r][c + 1] !== null) return false;
      }
    }
  }

  // Check cell before word start
  const beforeR = row - dr;
  const beforeC = col - dc;
  if (beforeR >= 0 && beforeC >= 0 && grid[beforeR][beforeC] !== null) return false;

  // Check cell after word end
  const afterR = row + dr * len;
  const afterC = col + dc * len;
  if (afterR < height && afterC < width && grid[afterR][afterC] !== null) return false;

  return grid[row][col] === null ? false : hasIntersection; // Must intersect unless first word
}

export function generateCrossword(
  terms: { id: string; term: string; clue: string; category: string }[],
  targetCount: number = 10
): CrosswordGrid {
  const WIDTH = 20;
  const HEIGHT = 20;
  const grid: (string | null)[][] = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(null));

  // Clean and sort terms
  const cleaned = terms
    .map((t) => ({
      ...t,
      word: t.term.toUpperCase().replace(/[^A-Z]/g, ""),
    }))
    .filter((t) => t.word.length >= 3 && t.word.length <= 15)
    .sort((a, b) => b.word.length - a.word.length);

  if (cleaned.length === 0) {
    return { cells: grid, words: [], width: WIDTH, height: HEIGHT };
  }

  const placed: PlacedWord[] = [];

  // Place first word horizontally in center
  const first = cleaned[0];
  const startCol = Math.floor((WIDTH - first.word.length) / 2);
  const startRow = Math.floor(HEIGHT / 2);

  for (let i = 0; i < first.word.length; i++) {
    grid[startRow][startCol + i] = first.word[i];
  }
  placed.push({
    ...first,
    row: startRow,
    col: startCol,
    direction: "across",
  });

  // Try to place remaining words
  for (let idx = 1; idx < cleaned.length && placed.length < targetCount; idx++) {
    const term = cleaned[idx];
    let bestPlacement: { row: number; col: number; direction: "across" | "down"; intersections: number } | null = null;

    // Try to find intersections with placed words
    for (const pw of placed) {
      for (let pi = 0; pi < pw.word.length; pi++) {
        for (let ti = 0; ti < term.word.length; ti++) {
          if (pw.word[pi] !== term.word[ti]) continue;

          // Try perpendicular placement
          const newDir: "across" | "down" = pw.direction === "across" ? "down" : "across";
          let newRow: number, newCol: number;

          if (newDir === "down") {
            newRow = pw.row - ti;
            newCol = pw.col + pi;
          } else {
            newRow = pw.row + pi;
            newCol = pw.col - ti;
          }

          // Temporarily allow first word check
          const origCell = grid[pw.row + (pw.direction === "down" ? pi : 0)]?.[pw.col + (pw.direction === "across" ? pi : 0)];

          if (
            newRow >= 0 &&
            newCol >= 0 &&
            newRow + (newDir === "down" ? term.word.length - 1 : 0) < HEIGHT &&
            newCol + (newDir === "across" ? term.word.length - 1 : 0) < WIDTH
          ) {
            // Validate placement
            let valid = true;
            let intersections = 0;

            for (let i = 0; i < term.word.length; i++) {
              const r = newRow + (newDir === "down" ? i : 0);
              const c = newCol + (newDir === "across" ? i : 0);
              const existing = grid[r][c];

              if (existing !== null) {
                if (existing !== term.word[i]) {
                  valid = false;
                  break;
                }
                intersections++;
              } else {
                // Check perpendicular adjacency
                if (newDir === "across") {
                  if (r > 0 && grid[r - 1][c] !== null) { valid = false; break; }
                  if (r < HEIGHT - 1 && grid[r + 1][c] !== null) { valid = false; break; }
                } else {
                  if (c > 0 && grid[r][c - 1] !== null) { valid = false; break; }
                  if (c < WIDTH - 1 && grid[r][c + 1] !== null) { valid = false; break; }
                }
              }
            }

            // Check before/after
            if (valid) {
              const dr = newDir === "down" ? 1 : 0;
              const dc = newDir === "across" ? 1 : 0;
              const bR = newRow - dr, bC = newCol - dc;
              if (bR >= 0 && bC >= 0 && grid[bR][bC] !== null) valid = false;
              const aR = newRow + dr * term.word.length, aC = newCol + dc * term.word.length;
              if (aR < HEIGHT && aC < WIDTH && grid[aR][aC] !== null) valid = false;
            }

            if (valid && intersections > 0) {
              if (!bestPlacement || intersections > bestPlacement.intersections) {
                bestPlacement = { row: newRow, col: newCol, direction: newDir, intersections };
              }
            }
          }
        }
      }
    }

    if (bestPlacement) {
      for (let i = 0; i < term.word.length; i++) {
        const r = bestPlacement.row + (bestPlacement.direction === "down" ? i : 0);
        const c = bestPlacement.col + (bestPlacement.direction === "across" ? i : 0);
        grid[r][c] = term.word[i];
      }
      placed.push({
        ...term,
        row: bestPlacement.row,
        col: bestPlacement.col,
        direction: bestPlacement.direction,
      });
    }
  }

  // Crop grid to content
  let minR = HEIGHT, maxR = 0, minC = WIDTH, maxC = 0;
  for (let r = 0; r < HEIGHT; r++) {
    for (let c = 0; c < WIDTH; c++) {
      if (grid[r][c] !== null) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }

  const pad = 1;
  const cropMinR = Math.max(0, minR - pad);
  const cropMaxR = Math.min(HEIGHT - 1, maxR + pad);
  const cropMinC = Math.max(0, minC - pad);
  const cropMaxC = Math.min(WIDTH - 1, maxC + pad);

  const croppedWidth = cropMaxC - cropMinC + 1;
  const croppedHeight = cropMaxR - cropMinR + 1;
  const croppedCells: (string | null)[][] = [];

  for (let r = cropMinR; r <= cropMaxR; r++) {
    croppedCells.push(grid[r].slice(cropMinC, cropMaxC + 1));
  }

  // Adjust word positions and assign numbers
  const adjustedPlaced = placed.map((p) => ({
    ...p,
    row: p.row - cropMinR,
    col: p.col - cropMinC,
  }));

  // Sort by position for numbering
  const sorted = [...adjustedPlaced].sort((a, b) => {
    const posA = a.row * croppedWidth + a.col;
    const posB = b.row * croppedWidth + b.col;
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

  return { cells: croppedCells, words, width: croppedWidth, height: croppedHeight };
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
