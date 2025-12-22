// src/domain/hanoiParser.ts
// Last Modified: 2025/12/22 12:48:45
//
// Parse & compile "Tower of Hanoi" motion commands.
// - No throw: returns { ok, motions, errors, ... }
// - Keeps line number + raw line for UX.

export type PillarIndex = 0 | 1 | 2;

export type MotionLine = {
  line: number;      // 1-based line number in the textarea
  raw: string;       // original line
  from: PillarIndex;
  to: PillarIndex;
};

export type CompileMotion = {
  discId: number;    // 0..numDiscs-1 (0 = smallest)
  fromPillar: PillarIndex; // 0..2
  toPillar: PillarIndex;   // 0..2
  fromLevel: number; // "height index" on source pillar (0-based; 0 = bottom)
  toLevel: number;   // "height index" on dest pillar (0-based; 0 = bottom)
  line: number;      // originating line number (for errorLine)
};

export type ParseError = {
  line: number;
  raw: string;
  message: string;
};

export type CompileResult = {
  ok: boolean;
  numLines: number;            // textarea lines count (including blanks)
  parsed: MotionLine[];        // successfully parsed moves (blank/comment skipped)
  motions: CompileMotion[];    // compiled motions for animation
  errors: ParseError[];        // parse+semantic errors
  firstErrorLine: number | null; // 1-based
};

const MOVE_RE = /^\s*([ABC123])\s*[, ]\s*([ABC123])\s*(?:#.*)?$/i;

function pillarFromToken(tok: string): PillarIndex | null {
  const t = tok.toUpperCase();
  if (t === "A" || t === "1") return 0;
  if (t === "B" || t === "2") return 1;
  if (t === "C" || t === "3") return 2;
  return null;
}

// Optional: allow comment-only lines
function isIgnorableLine(line: string): boolean {
  const s = line.trim();
  return s === "" || s.startsWith("#") || s.startsWith("//");
}

/**
 * Parse the textarea into MotionLine[] (syntax only).
 */
export function parseMotionCommands(text: string): {
  numLines: number;
  parsed: MotionLine[];
  errors: ParseError[];
  firstErrorLine: number | null;
} {
  const lines = text.split("\n");
  const parsed: MotionLine[] = [];
  const errors: ParseError[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const raw = lines[i];

    if (isIgnorableLine(raw)) continue;

    const m = raw.match(MOVE_RE);
    if (!m) {
      errors.push({ line: lineNo, raw, message: `cannot parse move (expected like "A,B")` });
      continue;
    }

    const from = pillarFromToken(m[1]);
    const to = pillarFromToken(m[2]);
    if (from === null || to === null) {
      errors.push({ line: lineNo, raw, message: `unknown pillar token` });
      continue;
    }

    parsed.push({ line: lineNo, raw, from, to });
  }

  return {
    numLines: lines.length,
    parsed,
    errors,
    firstErrorLine: errors.length ? errors[0].line : null,
  };
}

/**
 * Compile moves into animation motions with rule checking.
 * Rule:
 * - Can't move from empty pillar
 * - Can't move onto smaller disc
 * - frompillar !== topillar
 */
export function compileHanoiMotions(text: string, numDiscs: number): CompileResult {
  const { numLines, parsed, errors: parseErrors, firstErrorLine: parseFirst } = parseMotionCommands(text);

  const errors: ParseError[] = [...parseErrors];
  let firstErrorLine: number | null = parseFirst ?? null;

  // If syntax errors exist, we can still try compiling the parsed subset
  // (handy for "moveIfError" behavior).
  const motions: CompileMotion[] = [];

  // towers: each pillar is a stack of discIds (0 smallest).
  // bottom -> top in array order.
  const towers: number[][] = [[], [], []];
  for (let d = numDiscs - 1; d >= 0; d--) towers[0].push(d);

  for (const mv of parsed) {
    const { from, to, line, raw } = mv;

    if (from === to) {
      if (firstErrorLine === null) firstErrorLine = line;
      errors.push({ line, raw, message: `from and to are the same pillar` });
      // still continue to keep producing what we can
      continue;
    }

    if (towers[from].length === 0) {
      if (firstErrorLine === null) firstErrorLine = line;
      errors.push({ line, raw, message: `pillar ${["A", "B", "C"][from]} is empty at this step` });
      continue;
    }

    const discId = towers[from].pop()!; // exists due to check above

    const destTop = towers[to].length ? towers[to][towers[to].length - 1] : null;
    if (destTop !== null && destTop < discId) {
      // put it back (important: keep simulation consistent)
      towers[from].push(discId);

      if (firstErrorLine === null) firstErrorLine = line;
      errors.push({
        line,
        raw,
        message: `cannot place disc ${discId + 1} on smaller disc ${destTop + 1} at pillar ${["A", "B", "C"][to]}`,
      });
      continue;
    }

    // fromLevel/toLevel:
    // after popping, source height is current length (top index would be length-1)
    // we want "level" as 0-based from bottom. The disc we moved was at level = oldLength-1.
    // Old length is (newLength + 1).
    const fromLevel = towers[from].length; // after pop, this equals oldLength-1
    const toLevel = towers[to].length;     // before push, this is new top level

    towers[to].push(discId);

    motions.push({
      discId,
      fromPillar: from,
      toPillar: to,
      fromLevel,
      toLevel,
      line,
    });
  }

  const ok = errors.length === 0;

  return {
    ok,
    numLines,
    parsed,
    motions,
    errors,
    firstErrorLine,
  };
}
