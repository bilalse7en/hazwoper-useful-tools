'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Trophy,
  Gamepad2,
  Lightbulb,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';
import {
  DragDropMatchingGame,
  InteractiveQuizCard,
} from '@/components/interactive-blog-game';

// ---------------------------------------------------------------------------
// Shared helpers & styling (match the interactive-blog-game visual language)
// ---------------------------------------------------------------------------
const TYPE_LABELS = {
  'word-match': 'Word Match',
  'multiple-choice': 'Multiple Choice',
  'true-false': 'True / False',
  'correct-order': 'Put in Correct Order',
  'guess-term': 'Guess the Term',
};

function triggerCelebration() {
  try {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
    });
  } catch {
    // Ignore if confetti not supported
  }
}

function GameCard({ game, index }) {
  if (!game || !game.type) return null;

  return (
    <div className="relative">
      <div className="absolute -top-3 left-6 z-10">
        <Badge className="bg-primary text-primary-foreground border-none text-[9px] font-black uppercase tracking-widest px-3 py-1 shadow-lg shadow-primary/30">
          Game {index + 1} — {TYPE_LABELS[game.type] || 'Challenge'}
        </Badge>
      </div>
      <GameBody game={game} />
    </div>
  );
}

function GameBody({ game }) {
  switch (game.type) {
    case 'word-match':
      return <DragDropMatchingGame data={game} />;
    case 'multiple-choice':
      return (
        <InteractiveQuizCard
          data={{
            question: game.question,
            options: game.options,
            answer: game.answer,
            explanation: game.explanation,
          }}
        />
      );
    case 'true-false':
      return <TrueFalseGame data={game} />;
    case 'correct-order':
      return <CorrectOrderGame data={game} />;
    case 'guess-term':
      return <GuessTermGame data={game} />;
    default:
      return null;
  }
}

function ExplanationPanel({ isCorrect, explanation }) {
  return (
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
        {isCorrect ? '✅ Correct Explanation:' : '💡 Key Concept Explanation:'}
      </div>
      <p>{explanation || 'Review the article above for the full context.'}</p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// True / False Game
// ---------------------------------------------------------------------------
export function TrueFalseGame({ data }) {
  const [selected, setSelected] = useState(null); // true | false
  const [hasSubmitted, setHasSubmitted] = useState(false);

  if (!data?.question || typeof data.answer !== 'boolean') return null;

  const isCorrect = selected === data.answer;

  const handleSelect = (value) => {
    if (hasSubmitted) return;
    setSelected(value);
    setHasSubmitted(true);
    if (value === data.answer) triggerCelebration();
  };

  const handleReset = () => {
    setSelected(null);
    setHasSubmitted(false);
  };

  const options = [
    { value: true, label: 'True' },
    { value: false, label: 'False' },
  ];

  return (
    <div className="my-8 p-6 md:p-8 rounded-[32px] bg-card/60 backdrop-blur-xl border border-primary/20 shadow-xl not-prose">
      <div className="flex items-center justify-between gap-4 mb-4">
        <Badge className="bg-sky-500/10 tone-info border-sky-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">
          True or False
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

      {data.title && (
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
          {data.title}
        </p>
      )}
      <h4 className="text-lg md:text-xl font-black text-foreground mb-6 leading-snug">
        {data.question}
      </h4>

      <div className="grid grid-cols-2 gap-3 max-w-md">
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          const isThisCorrect = data.answer === opt.value;

          let style =
            'bg-muted/40 border-border text-foreground hover:bg-muted/80';
          if (hasSubmitted) {
            if (isThisCorrect) {
              style =
                'bg-emerald-500/20 border-emerald-500 tone-success font-bold';
            } else if (isSelected) {
              style = 'bg-rose-500/20 border-rose-500 tone-danger';
            } else {
              style =
                'bg-muted/20 border-border/40 text-muted-foreground opacity-50';
            }
          }

          return (
            <button
              key={opt.label}
              type="button"
              disabled={hasSubmitted}
              onClick={() => handleSelect(opt.value)}
              className={`p-5 rounded-2xl border text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 select-none ${style}`}
            >
              {opt.label}
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
        <ExplanationPanel
          isCorrect={isCorrect}
          explanation={data.explanation}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Put in Correct Order Game (click-to-sequence, mobile friendly)
// ---------------------------------------------------------------------------
export function CorrectOrderGame({ data }) {
  const items = useMemo(() => {
    if (!Array.isArray(data?.items)) return [];
    return data.items.map((item) => String(item));
  }, [data]);

  const [shuffled, setShuffled] = useState(() => {
    if (!items.length) return [];
    const arr = [...items];
    // Deterministic-enough shuffle that is never the correct order for >1 items
    do {
      arr.sort(() => Math.random() - 0.5);
    } while (items.length > 1 && arr.every((v, i) => v === items[i]));
    return arr;
  });

  const [sequence, setSequence] = useState([]);
  const [wrongPick, setWrongPick] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!items.length) return null;

  const handlePick = (item) => {
    if (isCompleted || sequence.includes(item)) return;
    const expected = items[sequence.length];
    if (item === expected) {
      const next = [...sequence, item];
      setSequence(next);
      setWrongPick(null);
      if (next.length === items.length) {
        setIsCompleted(true);
        triggerCelebration();
      }
    } else {
      setWrongPick(item);
      setTimeout(() => setWrongPick(null), 900);
    }
  };

  const handleReset = () => {
    setSequence([]);
    setWrongPick(null);
    setIsCompleted(false);
  };

  return (
    <div className="my-8 p-6 md:p-8 rounded-[32px] bg-card/60 backdrop-blur-xl border border-primary/20 shadow-xl not-prose">
      <div className="flex items-center justify-between gap-4 mb-4">
        <Badge className="bg-violet-500/10 tone-accent border-violet-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">
          Sequence Challenge
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
        </Button>
      </div>

      {data.title && (
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
          {data.title}
        </p>
      )}
      <h4 className="text-lg md:text-xl font-black text-foreground mb-2 leading-snug">
        Put the steps in the correct order
      </h4>
      <p className="text-xs text-muted-foreground font-medium mb-6">
        Click the items below in the correct sequence ({sequence.length}/
        {items.length} placed)
      </p>

      {/* Progress */}
      <div className="w-full bg-muted/60 h-2 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="bg-gradient-to-r from-primary to-violet-500 h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(sequence.length / items.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* User sequence */}
      <div className="space-y-2.5 mb-6">
        {sequence.map((item, i) => (
          <motion.div
            key={`${item}-${i}`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-sm font-bold tone-success flex items-center gap-3"
          >
            <span className="w-7 h-7 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-xs shrink-0">
              {i + 1}
            </span>
            <span className="leading-snug">{item}</span>
          </motion.div>
        ))}
      </div>

      {/* Available items */}
      <div className="space-y-2.5">
        {shuffled
          .filter((item) => !sequence.includes(item))
          .map((item) => (
            <motion.button
              key={item}
              type="button"
              onClick={() => handlePick(item)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`w-full p-4 rounded-2xl border text-left text-sm font-medium transition-all select-none ${
                wrongPick === item
                  ? 'bg-rose-500/20 border-rose-500/50 tone-danger animate-shake'
                  : 'bg-muted/40 hover:bg-muted/80 border-border text-foreground hover:border-primary/40'
              }`}
            >
              <span className="leading-snug">{item}</span>
            </motion.button>
          ))}
      </div>

      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-primary/20 to-emerald-500/20 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white font-black shrink-0 shadow-lg shadow-emerald-500/30">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-foreground">
                  Perfect Sequence!
                </h4>
                <p className="text-xs text-muted-foreground">
                  {data.explanation ||
                    'You reconstructed the correct procedure order.'}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleReset}
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

// ---------------------------------------------------------------------------
// Guess the Term Game
// ---------------------------------------------------------------------------
export function GuessTermGame({ data }) {
  const term = data?.term || '';
  const [guess, setGuess] = useState('');
  const [revealed, setRevealed] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [shake, setShake] = useState(false);

  if (!term) return null;

  const normalized = term.toLowerCase().replace(/[^a-z0-9]/g, '');
  const isCorrect =
    guess.toLowerCase().replace(/[^a-z0-9]/g, '') === normalized;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasSubmitted) return;
    if (isCorrect) {
      setWasCorrect(true);
      setHasSubmitted(true);
      triggerCelebration();
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const revealLetter = () => {
    const hidden = term
      .split('')
      .map((_, i) => i)
      .filter((i) => /[a-z0-9]/i.test(term[i]) && !revealed.includes(i));
    if (!hidden.length) return;
    const pick = hidden[Math.floor(Math.random() * hidden.length)];
    setRevealed((prev) => [...prev, pick]);
  };

  const mask = term
    .split('')
    .map((char, i) =>
      !/[a-z0-9]/i.test(char) || revealed.includes(i) ? char : '_'
    )
    .join('');

  const handleReset = () => {
    setGuess('');
    setRevealed([]);
    setHasSubmitted(false);
    setWasCorrect(false);
  };

  return (
    <div className="my-8 p-6 md:p-8 rounded-[32px] bg-card/60 backdrop-blur-xl border border-primary/20 shadow-xl not-prose">
      <div className="flex items-center justify-between gap-4 mb-4">
        <Badge className="bg-amber-500/10 tone-warning border-amber-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">
          Guess the Term
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

      {data.title && (
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
          {data.title}
        </p>
      )}

      <div className="p-5 rounded-2xl bg-muted/40 border border-border mb-4 text-center font-mono text-xl md:text-2xl font-black tracking-[0.3em] text-foreground select-none">
        {mask}
      </div>

      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground leading-relaxed mb-4 flex items-start gap-2">
        <Lightbulb className="tone-warning w-4 h-4 shrink-0 mt-0.5" />
        <span className="font-medium">{data.hint}</span>
      </div>

      {!hasSubmitted && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Type the term..."
            className={`flex-1 h-12 px-5 rounded-2xl bg-muted/30 border border-border/50 outline-none text-sm font-bold focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all ${
              shake ? 'animate-shake' : ''
            }`}
          />
          <Button
            type="submit"
            disabled={!guess.trim()}
            className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-2"
          >
            Submit Guess
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={revealLetter}
            className="h-12 px-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest gap-1.5 border-border"
          >
            <Eye className="w-3.5 h-3.5" /> Hint Letter
          </Button>
        </form>
      )}

      {hasSubmitted && wasCorrect && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-2xl tone-bg-success tone-success text-xs leading-relaxed"
        >
          <div className="font-bold mb-1 flex items-center gap-1.5">
            <Trophy className="w-4 h-4" /> Correct — it&apos;s &quot;{term}
            &quot;!
          </div>
          <p>
            {data.explanation || 'Great recall of the article terminology.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section container — renders the blog's exactly-3 games
// ---------------------------------------------------------------------------
export function BlogGamesSection({ games }) {
  if (!Array.isArray(games) || games.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center space-y-3 pt-4">
        <Badge className="bg-primary/10 text-primary border border-primary/20 font-black uppercase tracking-[0.2em] text-[10px] px-4 py-1.5 rounded-full shadow-xs">
          Interactive Knowledge Lab
        </Badge>
        <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground flex items-center gap-3">
          <Gamepad2 className="w-7 h-7 text-primary" />
          Test Your Knowledge
        </h2>
        <p className="text-muted-foreground font-medium text-sm max-w-xl">
          {games.length} interactive challenges generated from this article —
          drag, click and guess your way to mastery.
        </p>
      </div>

      {games.map((game, i) => (
        <GameCard key={i} game={game} index={i} />
      ))}
    </div>
  );
}
