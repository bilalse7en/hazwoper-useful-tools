'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Trophy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';

/**
 * Deterministic shuffle (seeded by string). Server and client produce the
 * exact same order, preventing hydration mismatches — unlike Math.random().
 */
function seededShuffle(items, seed = 'shuffle') {
  const arr = [...items];
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 1. Interactive Drag-and-Drop & Click-to-Match Word Matching Game
 */
export function DragDropMatchingGame({ data }) {
  const pairs = useMemo(() => {
    if (!data?.pairs || !Array.isArray(data.pairs)) return [];
    return data.pairs;
  }, [data]);

  // Seed with initial shuffled arrays (deterministic → hydration-safe)
  const [terms, setTerms] = useState(() => {
    if (!pairs.length) return [];
    return seededShuffle(
      pairs.map((p) => p.term),
      (data?.title || 'terms') + '-terms'
    );
  });

  const [definitions, setDefinitions] = useState(() => {
    if (!pairs.length) return [];
    return seededShuffle(
      pairs.map((p) => p.match),
      (data?.title || 'terms') + '-defs'
    );
  });

  const [selectedTerm, setSelectedTerm] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState({}); // { term: def }
  const [wrongAttempt, setWrongAttempt] = useState(null); // { term, def }
  const [isCompleted, setIsCompleted] = useState(false);
  const [draggedTerm, setDraggedTerm] = useState(null);

  const handleResetGame = () => {
    if (!pairs.length) return;
    // Reset runs client-side only, so a fresh random seed is safe here
    const seed = `${Date.now()}-${Math.random()}`;
    setTerms(
      seededShuffle(
        pairs.map((p) => p.term),
        seed + '-terms'
      )
    );
    setDefinitions(
      seededShuffle(
        pairs.map((p) => p.match),
        seed + '-defs'
      )
    );
    setSelectedTerm(null);
    setMatchedPairs({});
    setWrongAttempt(null);
    setIsCompleted(false);
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
      });
    } catch {
      // Ignore if confetti not supported
    }
  };

  const verifyMatch = (term, def) => {
    const correctPair = pairs.find((p) => p.term === term && p.match === def);

    if (correctPair) {
      const nextMatched = { ...matchedPairs, [term]: def };
      setMatchedPairs(nextMatched);
      setSelectedTerm(null);
      setWrongAttempt(null);

      if (Object.keys(nextMatched).length === pairs.length) {
        setIsCompleted(true);
        triggerCelebration();
      }
    } else {
      setWrongAttempt({ term, def });
      setTimeout(() => {
        setWrongAttempt(null);
        setSelectedTerm(null);
      }, 900);
    }
  };

  const handleTermClick = (term) => {
    if (matchedPairs[term]) return;
    if (selectedTerm === term) {
      setSelectedTerm(null);
    } else {
      setSelectedTerm(term);
      setWrongAttempt(null);
    }
  };

  const handleDefClick = (def) => {
    const isAlreadyMatched = Object.values(matchedPairs).includes(def);
    if (isAlreadyMatched || !selectedTerm) return;

    verifyMatch(selectedTerm, def);
  };

  // Drag and Drop handlers
  const handleDragStart = (e, term) => {
    setDraggedTerm(term);
    e.dataTransfer.setData('text/plain', term);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, def) => {
    e.preventDefault();
    const term = draggedTerm || e.dataTransfer.getData('text/plain');
    if (!term) return;
    verifyMatch(term, def);
    setDraggedTerm(null);
  };

  if (!pairs.length) return null;

  const progress = Math.round(
    (Object.keys(matchedPairs).length / pairs.length) * 100
  );

  return (
    <div className="my-10 p-6 md:p-8 rounded-[32px] bg-card/60 backdrop-blur-xl border border-primary/20 shadow-2xl relative overflow-hidden not-prose">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest px-3 py-1">
              Interactive Lab
            </Badge>
            <span className="text-xs text-muted-foreground font-semibold">
              Drag or Click to Match
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
            {data?.title || 'Technical Concept Matching Challenge'}
          </h3>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
              Score
            </span>
            <span className="text-lg font-black text-primary">
              {Object.keys(matchedPairs).length} / {pairs.length}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetGame}
            className="rounded-xl h-9 px-3 gap-1.5 text-xs font-bold border-border"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted/60 h-2 rounded-full mt-4 overflow-hidden">
        <motion.div
          className="bg-gradient-to-r from-primary to-emerald-500 h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        {/* Left Column: Terms */}
        <div className="space-y-3">
          <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
            1. Select or Drag a Term
          </span>
          <div className="flex flex-col gap-2.5">
            {terms.map((term) => {
              const isMatched = !!matchedPairs[term];
              const isSelected = selectedTerm === term;
              const isWrong = wrongAttempt?.term === term;

              return (
                <motion.div
                  key={term}
                  draggable={!isMatched}
                  onDragStart={(e) => handleDragStart(e, term)}
                  onClick={() => handleTermClick(term)}
                  whileHover={!isMatched ? { scale: 1.02 } : {}}
                  whileTap={!isMatched ? { scale: 0.98 } : {}}
                  className={`p-4 rounded-2xl border text-sm font-bold transition-all cursor-pointer select-none flex items-center justify-between ${
                    isMatched
                      ? 'bg-emerald-500/10 border-emerald-500/30 tone-success opacity-60 cursor-default'
                      : isWrong
                        ? 'bg-rose-500/20 border-rose-500/50 tone-danger animate-shake'
                        : isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                          : 'bg-muted/40 hover:bg-muted/80 border-border text-foreground'
                  }`}
                >
                  <span className="leading-snug">{term}</span>
                  {isMatched && (
                    <CheckCircle2 className="tone-success w-4 h-4 shrink-0 ml-2" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Definitions */}
        <div className="space-y-3">
          <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
            2. Drop or Click Matching Definition
          </span>
          <div className="flex flex-col gap-2.5">
            {definitions.map((def) => {
              const matchedTerm = Object.keys(matchedPairs).find(
                (k) => matchedPairs[k] === def
              );
              const isMatched = !!matchedTerm;
              const isWrong = wrongAttempt?.def === def;

              return (
                <motion.div
                  key={def}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, def)}
                  onClick={() => handleDefClick(def)}
                  whileHover={!isMatched && selectedTerm ? { scale: 1.02 } : {}}
                  className={`p-4 rounded-2xl border text-xs leading-relaxed transition-all cursor-pointer select-none flex flex-col justify-between ${
                    isMatched
                      ? 'bg-emerald-500/10 border-emerald-500/30 tone-success opacity-60 cursor-default'
                      : isWrong
                        ? 'bg-rose-500/20 border-rose-500/50 tone-danger animate-shake'
                        : selectedTerm
                          ? 'bg-primary/5 hover:bg-primary/15 border-primary/30 text-foreground cursor-pointer hover:border-primary'
                          : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div>{def}</div>
                  {isMatched && (
                    <div className="mt-2 pt-2 border-t border-emerald-500/20 text-[10px] font-bold tone-success flex items-center gap-1.5">
                      <Check className="w-3 h-3" /> Matched with: {matchedTerm}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Completion Banner */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-primary/20 to-emerald-500/20 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-black shrink-0 shadow-lg shadow-emerald-500/30">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-foreground">
                  Perfect Score! Challenge Mastered
                </h4>
                <p className="text-xs text-muted-foreground">
                  You successfully connected all technical terminology
                  definitions.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleResetGame}
              className="rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-5"
            >
              Play Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * 2. Interactive Knowledge Check / Quick Quiz Card
 */
export function InteractiveQuizCard({ data }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  if (!data?.question || !Array.isArray(data.options)) return null;

  const isCorrect = selectedOption === data.answer;

  const handleSelect = (idx) => {
    if (hasSubmitted) return;
    setSelectedOption(idx);
    setHasSubmitted(true);
    if (idx === data.answer) {
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch {}
    }
  };

  const handleReset = () => {
    setSelectedOption(null);
    setHasSubmitted(false);
  };

  return (
    <div className="my-8 p-6 md:p-8 rounded-[32px] bg-card/60 backdrop-blur-xl border border-primary/20 shadow-xl not-prose">
      <div className="flex items-center justify-between gap-4 mb-4">
        <Badge className="bg-amber-500/10 tone-warning border-amber-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">
          Knowledge Check
        </Badge>
        {hasSubmitted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        )}
      </div>

      <h4 className="text-lg md:text-xl font-black text-foreground mb-6 leading-snug">
        {data.question}
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.options.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          const isThisCorrect = idx === data.answer;

          let btnStyle =
            'bg-muted/40 border-border text-foreground hover:bg-muted/80';
          if (hasSubmitted) {
            if (isThisCorrect) {
              btnStyle =
                'bg-emerald-500/20 border-emerald-500 tone-success font-bold';
            } else if (isSelected) {
              btnStyle = 'bg-rose-500/20 border-rose-500 tone-danger';
            } else {
              btnStyle =
                'bg-muted/20 border-border/40 text-muted-foreground opacity-50';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={hasSubmitted}
              onClick={() => handleSelect(idx)}
              className={`p-4 rounded-2xl border text-left text-xs md:text-sm font-medium transition-all flex items-center justify-between gap-3 select-none ${btnStyle}`}
            >
              <span>{opt}</span>
              {hasSubmitted && isThisCorrect && (
                <CheckCircle2 className="tone-success w-4 h-4 shrink-0" />
              )}
              {hasSubmitted && isSelected && !isThisCorrect && (
                <AlertCircle className="tone-danger w-4 h-4 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {hasSubmitted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-6 p-4 rounded-2xl border text-xs leading-relaxed ${
            isCorrect
              ? 'tone-bg-success tone-success'
              : 'tone-bg-warning tone-warning'
          }`}
        >
          <div className="font-bold mb-1 flex items-center gap-1.5">
            {isCorrect
              ? '✅ Correct Explanation:'
              : '💡 Key Concept Explanation:'}
          </div>
          <p>
            {data.explanation ||
              'Review the article sections above to solidify this operational rule.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}

/**
 * 3. Master HTML Content & Interactive Game Embedder
 * Parses raw HTML string, detects embedded `<div class="interactive-matching-game" data-game="...">`
 * and `<div class="interactive-quiz-card" data-quiz="...">` tags, and mounts React components in place!
 */
export function InteractiveBlogRenderer({ content }) {
  // Split HTML by interactive game embed tags
  const segments = useMemo(() => {
    if (!content) return [];
    const list = [];
    const regex =
      /<div\s+class="(interactive-matching-game|interactive-quiz-card)"\s+data-(?:game|quiz)='([^']+)'><\/div>/gi;

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        list.push({
          type: 'html',
          content: content.substring(lastIndex, match.index),
        });
      }

      const componentType = match[1];
      const rawData = match[2];

      try {
        const parsedData = JSON.parse(rawData);
        list.push({
          type: componentType === 'interactive-matching-game' ? 'game' : 'quiz',
          data: parsedData,
        });
      } catch (err) {
        console.warn('Failed to parse interactive data attribute:', err);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      list.push({
        type: 'html',
        content: content.substring(lastIndex),
      });
    }

    return list;
  }, [content]);

  if (!content) return null;

  return (
    <div className="blog-content-container">
      {segments.map((seg, i) => {
        if (seg.type === 'game') {
          return <DragDropMatchingGame key={`game-${i}`} data={seg.data} />;
        }
        if (seg.type === 'quiz') {
          return <InteractiveQuizCard key={`quiz-${i}`} data={seg.data} />;
        }
        return (
          <div
            key={`html-${i}`}
            dangerouslySetInnerHTML={{ __html: seg.content }}
          />
        );
      })}
    </div>
  );
}
