// src/domain/hanoiParser.ts
// Last Modified: 2025/12/22 17:42:50
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
  numLines: number;
  parsed: MotionLine[];
  motions: CompileMotion[];
  errors: ParseError[];
  stopAfterMotions: number;   // ★追加（firstErrorLineの代わり）
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
    const { numLines, parsed, errors: parseErrors } = parseMotionCommands(text);

    const errors: ParseError[] = [...parseErrors];
    const motions: CompileMotion[] = [];

    
    // ★ parse error がある場合、最初のエラー行より後は「実行しない」ための境界を決める
    const firstParseErrorLine = parseErrors.length > 0 ? parseErrors[0].line : null;

    let stopAfterMotions = Infinity;

    const towers: number[][] = [[], [], []];
    for (let d = numDiscs - 1; d >= 0; d--) towers[0].push(d);

    for (const mv of parsed) {
        // ★ parse error の行以降は、たとえ parse に成功した行でも実行しない
        if (firstParseErrorLine !== null && mv.line >= firstParseErrorLine) {
            stopAfterMotions = motions.length; // ここまで再生したら止める
            break;
        }
        
        const { from, to, line, raw } = mv;

        if (from === to) {
            const e = { line, raw, message: `from and to are the same pillar` };
            errors.push(e);
            stopAfterMotions = motions.length;
            break; // ★ここで止める
        }

        if (towers[from].length === 0) {
            const e = {
                line, raw,
                message: `pillar ${["A", "B", "C"][from]} is empty at this step`
            };
            errors.push(e);
            stopAfterMotions = motions.length;
            break;
        }

        const discId = towers[from].pop()!;
        const destTop = towers[to].length ? towers[to][towers[to].length - 1] : null;

        if (destTop !== null && destTop < discId) {
            const fromLevel = towers[from].length;
            const toLevel = towers[to].length;

            motions.push({
                discId,
                fromPillar: from,
                toPillar: to,
                fromLevel,
                toLevel,
                line,
            });

            errors.push({
                line,
                raw,
                message: `cannot place disc ${discId + 1} on smaller disc ${destTop + 1} at pillar ${["A","B","C"][to]}`,
            });
            stopAfterMotions = motions.length; // ★「見せた後」で止める
            break;
        }

        motions.push({
            discId,
            fromPillar: from,
            toPillar: to,
            fromLevel: towers[from].length,
            toLevel: towers[to].length,
            line,
        });
        towers[to].push(discId);
    }

    // parse error がある場合に「parseの時点で止めたい」なら stop を parse にして上書きする選択肢もある
    // 例: parseErrors[0] が存在し、かつ motions が 0 の場合など


    const ok = errors.length === 0;
    if (stopAfterMotions === Infinity) {
        stopAfterMotions = motions.length;
    }

    return { ok, numLines, parsed, motions, errors, stopAfterMotions };
}
