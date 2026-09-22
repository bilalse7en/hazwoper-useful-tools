'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Shield,
  AlertTriangle,
  Flame,
  Award,
  CheckCircle,
  Info,
  Lightbulb,
  Zap,
  Wrench,
  Clock,
  FileCheck,
  HelpCircle,
  HardHat,
  Eye,
  BookOpen,
  Activity,
  Layers,
  Sparkles,
  Quote,
  Columns,
  Check,
  Maximize,
  X,
} from 'lucide-react';
import { parseTopicContentToComponents } from '@/lib/component-registry';

const ICON_MAP = {
  Shield,
  AlertTriangle,
  Flame,
  Award,
  CheckCircle,
  Info,
  Lightbulb,
  Zap,
  Wrench,
  Clock,
  FileCheck,
  HelpCircle,
  HardHat,
  Eye,
  BookOpen,
  Activity,
  Layers,
};

export function getThemeStyles(theme = 'dark') {
  if (theme === 'light') {
    return {
      isLight: true,
      cardBg: 'bg-white border-slate-200/90 shadow-sm text-slate-900',
      innerCardBg:
        'bg-slate-50 border-slate-200/90 text-slate-800 hover:border-slate-300',
      titleColor: 'text-slate-900',
      subtextColor: 'text-slate-600',
      mutedText: 'text-slate-500',
      borderColor: 'border-slate-200',
      badgeBg: 'bg-amber-100/80 border-amber-300 text-amber-900 font-bold',
      proseClass: 'prose prose-slate max-w-none text-slate-700 leading-relaxed',
      accordionOpen:
        'border-amber-400 bg-amber-50/60 shadow-xs ring-1 ring-amber-400/30 text-slate-900',
      accordionClosed:
        'border-slate-200 bg-white hover:bg-slate-50 text-slate-800',
      accordionContent: 'text-slate-700 bg-white border-slate-100',
      cardFront: 'bg-white border-slate-200 text-slate-900 shadow-xs',
      cardBack:
        'bg-gradient-to-br from-amber-50 via-white to-orange-50/40 border-amber-400 text-slate-900 shadow-md',
      tabNavBg: 'bg-slate-100 border-slate-200',
      tabActive: 'bg-amber-500 text-slate-950 font-black shadow-xs',
      tabInactive: 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70',
      tabContent: 'bg-white border-slate-200 text-slate-800',
      stepItem:
        'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300',
      stepNumBg: 'bg-amber-500 text-slate-950 font-black shadow-xs',
      quoteBg: 'bg-slate-50/80 border-slate-200 text-slate-800',
      tableHeaderBg: 'bg-slate-100 border-slate-200 text-slate-700',
      tableBodyBg: 'bg-white divide-slate-100',
      tableText: 'text-slate-700',
    };
  }
  if (theme === 'nebula') {
    return {
      isLight: false,
      cardBg: 'bg-[#150e2d]/90 border-purple-800/40 shadow-xl text-purple-100',
      innerCardBg:
        'bg-[#1e1442]/80 border-purple-800/30 text-purple-100 hover:border-purple-700',
      titleColor: 'text-purple-100',
      subtextColor: 'text-purple-200/80',
      mutedText: 'text-purple-300/60',
      borderColor: 'border-purple-900/50',
      badgeBg: 'bg-purple-950/80 border-purple-700/60 text-purple-300',
      proseClass:
        'prose prose-invert max-w-none text-purple-200 leading-relaxed',
      accordionOpen:
        'border-purple-400/60 bg-purple-900/40 shadow-md ring-1 ring-purple-500/30 text-purple-100',
      accordionClosed:
        'border-purple-900/50 bg-[#120a28]/80 hover:border-purple-800 text-purple-200',
      accordionContent: 'text-purple-200 bg-[#120a28]/60 border-purple-900/40',
      cardFront: 'bg-[#120a28] border-purple-800/60 text-purple-100',
      cardBack:
        'bg-gradient-to-br from-[#1e113f] to-[#2d1254] border-purple-400 text-purple-100',
      tabNavBg: 'bg-black/50 border-purple-900/60',
      tabActive: 'bg-purple-500 text-slate-950 font-black shadow-md',
      tabInactive: 'text-purple-300 hover:text-white hover:bg-purple-900/40',
      tabContent: 'bg-[#120a28] border-purple-900/50 text-purple-100',
      stepItem:
        'bg-[#1e1442]/80 border-purple-800/30 text-purple-100 hover:border-purple-700',
      stepNumBg: 'bg-purple-500 text-slate-950 font-black',
      quoteBg: 'bg-[#150e2d] border-purple-900/50 text-purple-100',
      tableHeaderBg: 'bg-[#1c113b] border-purple-900/60 text-purple-200',
      tableBodyBg: 'bg-[#120a28] divide-purple-900/40',
      tableText: 'text-purple-200',
    };
  }
  // Dark (default)
  return {
    isLight: false,
    cardBg: 'bg-[#0f172a] border-slate-800 shadow-xl text-slate-100',
    innerCardBg:
      'bg-[#0b1120] border-slate-800/80 text-slate-100 hover:border-slate-700',
    titleColor: 'text-white',
    subtextColor: 'text-slate-300',
    mutedText: 'text-slate-400',
    borderColor: 'border-slate-800',
    badgeBg: 'bg-slate-900 border-slate-800 text-amber-400',
    proseClass: 'prose prose-invert max-w-none text-slate-200 leading-relaxed',
    accordionOpen:
      'border-amber-500/50 bg-slate-900/90 shadow-md ring-1 ring-amber-500/20 text-white',
    accordionClosed:
      'border-slate-800/80 bg-slate-950/60 hover:border-slate-700 text-slate-200',
    accordionContent: 'text-slate-200 bg-slate-950/40 border-slate-800/60',
    cardFront: 'bg-[#0b1120] border-slate-800/80 text-slate-100',
    cardBack:
      'bg-gradient-to-br from-slate-900 via-[#0b1120] to-slate-950 border-amber-500/60 text-slate-100',
    tabNavBg: 'bg-black/40 border-slate-800',
    tabActive: 'bg-amber-500 text-slate-950 font-black shadow-md',
    tabInactive: 'text-slate-400 hover:text-white hover:bg-slate-800/60',
    tabContent: 'bg-[#0b1120] border-slate-800 text-slate-200',
    stepItem:
      'bg-[#0b1120] border-slate-800 hover:border-slate-700 text-slate-100',
    stepNumBg: 'bg-amber-500 text-slate-950 font-black',
    quoteBg: 'bg-[#0f172a] border-slate-800 text-slate-100',
    tableHeaderBg: 'bg-slate-950 border-slate-800 text-slate-300',
    tableBodyBg: 'bg-[#0b1120] divide-slate-800/80',
    tableText: 'text-slate-200',
  };
}

export default function PlayerComponentRenderer({
  content,
  title = 'Topic Content',
  textSize = 'M',
  isSpeaking = false,
  activeWord = '',
  activeSentence = '',
  onImageClick,
  theme = 'dark',
}) {
  const [expandedAccordions, setExpandedAccordions] = useState({});
  const [flippedCards, setFlippedCards] = useState({});
  const [activeTabs, setActiveTabs] = useState({});

  const structure = parseTopicContentToComponents(content, title);
  const components = structure.components || [];
  const tStyle = getThemeStyles(theme);

  // Auto-expand Accordion item & Tabs dynamically as TTS Narrator speaks slide text
  React.useEffect(() => {
    if (!isSpeaking || !activeSentence || typeof activeSentence !== 'string')
      return;
    const cleanSentence = activeSentence.toLowerCase().trim();
    if (!cleanSentence) return;

    components.forEach((comp) => {
      if (comp.type === 'accordion' && Array.isArray(comp.props?.items)) {
        comp.props.items.forEach((item, idx) => {
          const itemTitle = (item.title || '').toLowerCase().trim();
          const itemText = (item.content || item.description || '')
            .replace(/<[^>]*>?/gm, ' ')
            .toLowerCase()
            .trim();

          const matchesTitle =
            itemTitle &&
            (cleanSentence.includes(itemTitle) ||
              itemTitle.includes(cleanSentence.slice(0, 15)));
          const matchesContent =
            itemText &&
            (cleanSentence.includes(itemText.slice(0, 25)) ||
              itemText.includes(cleanSentence.slice(0, 20)));

          if (matchesTitle || matchesContent) {
            setExpandedAccordions((prev) => {
              const key = `${comp.id}_${idx}`;
              if (prev[key]) return prev;
              return { ...prev, [key]: true };
            });
          }
        });
      }

      if (comp.type === 'tabs' && Array.isArray(comp.props?.tabs)) {
        comp.props.tabs.forEach((tab, idx) => {
          const tabLabel = (tab.label || tab.title || '').toLowerCase().trim();
          const tabContent = (tab.content || '')
            .replace(/<[^>]*>?/gm, ' ')
            .toLowerCase()
            .trim();

          const matchesLabel = tabLabel && cleanSentence.includes(tabLabel);
          const matchesContent =
            tabContent &&
            (cleanSentence.includes(tabContent.slice(0, 25)) ||
              tabContent.includes(cleanSentence.slice(0, 20)));

          if (matchesLabel || matchesContent) {
            setActiveTabs((prev) => {
              if (prev[comp.id] === idx) return prev;
              return { ...prev, [comp.id]: idx };
            });
          }
        });
      }
    });
  }, [isSpeaking, activeSentence, components]);

  const getTextSizeClass = () => {
    switch (textSize) {
      case 'S':
        return 'text-xs md:text-sm';
      case 'L':
        return 'text-base md:text-lg';
      case 'XL':
        return 'text-lg md:text-xl';
      default:
        return 'text-sm md:text-base';
    }
  };

  return (
    <div className={`space-y-6 ${getTextSizeClass()}`}>
      {components.map((comp, idx) => (
        <div key={comp.id || idx} className="animate-in fade-in duration-200">
          {renderPlayerComponent(comp, {
            expandedAccordions,
            setExpandedAccordions,
            flippedCards,
            setFlippedCards,
            activeTabs,
            setActiveTabs,
            isSpeaking,
            activeWord,
            activeSentence,
            onImageClick,
            theme,
            tStyle,
          })}
        </div>
      ))}
    </div>
  );
}

function renderPlayerComponent(comp, state) {
  const {
    expandedAccordions,
    setExpandedAccordions,
    flippedCards,
    setFlippedCards,
    activeTabs,
    setActiveTabs,
    isSpeaking,
    activeWord,
    activeSentence,
    onImageClick,
    theme,
    tStyle,
  } = state;

  switch (comp.type) {
    /* ───────────────────────────────────────────────────────────── */
    /* 1. ACCORDION                                                 */
    /* ───────────────────────────────────────────────────────────── */
    case 'accordion': {
      const items = comp.props.items || [];
      return (
        <div
          className={`space-y-3 p-5 md:p-6 rounded-3xl border ${tStyle.cardBg}`}
        >
          {comp.props.title && (
            <div className={`border-b ${tStyle.borderColor} pb-3`}>
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-500">
                Interactive Checklist & Guidelines
              </span>
              <h3
                className={`text-sm md:text-base font-bold ${tStyle.titleColor} mt-0.5`}
              >
                {comp.props.title}
              </h3>
              {comp.props.description && (
                <p className={`text-xs ${tStyle.subtextColor} mt-1`}>
                  {comp.props.description}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2 pt-1">
            {items.map((item, idx) => {
              const isOpen =
                expandedAccordions[`${comp.id}_${idx}`] ?? idx === 0;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isOpen ? tStyle.accordionOpen : tStyle.accordionClosed
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedAccordions((prev) => ({
                        ...prev,
                        [`${comp.id}_${idx}`]: !isOpen,
                      }))
                    }
                    className={`w-full p-4 text-left flex items-center justify-between gap-3 text-xs md:text-sm font-bold transition-colors`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-black uppercase shrink-0 ${tStyle.badgeBg}`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <span className="truncate">{item.title}</span>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                        tStyle.isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-600'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-amber-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      className={`p-4 pt-2 text-xs md:text-sm border-t leading-relaxed ${tStyle.proseClass} ${tStyle.accordionContent}`}
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    /* ───────────────────────────────────────────────────────────── */
    /* 2. 3D FLIP CARDS GRID                                        */
    /* ───────────────────────────────────────────────────────────── */
    case 'flip-cards': {
      const cards = comp.props.cards || [];
      const colsClass =
        comp.props.columns === 2
          ? 'grid-cols-1 sm:grid-cols-2'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

      return (
        <div
          className={`space-y-4 p-5 md:p-6 rounded-3xl border ${tStyle.cardBg}`}
        >
          <div
            className={`flex flex-wrap items-center justify-between gap-2 pb-3 border-b ${tStyle.borderColor}`}
          >
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-500">
                Interactive Flashcards
              </span>
              <h3
                className={`text-sm md:text-base font-bold ${tStyle.titleColor} mt-0.5`}
              >
                {comp.props.title || 'Core Safety Directives'}
              </h3>
            </div>
            <span
              className={`text-[10px] px-2.5 py-1 rounded-lg border ${
                tStyle.isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-600'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              Click to Flip ↻
            </span>
          </div>

          <div className={`grid ${colsClass} gap-4 pt-1`}>
            {cards.map((card, cIdx) => {
              const isFlipped = !!flippedCards[`${comp.id}_${cIdx}`];
              const IconComp = ICON_MAP[card.icon] || Shield;

              return (
                <div
                  key={cIdx}
                  onClick={() =>
                    setFlippedCards((prev) => ({
                      ...prev,
                      [`${comp.id}_${cIdx}`]: !isFlipped,
                    }))
                  }
                  className="min-h-[220px] cursor-pointer select-none group"
                  style={{ perspective: '1000px' }}
                >
                  <div
                    className={`relative w-full h-full min-h-[220px] rounded-2xl border transition-all duration-500 shadow-md ${
                      isFlipped
                        ? 'border-amber-500/60 shadow-xl shadow-amber-500/10'
                        : `${tStyle.borderColor} hover:border-amber-400`
                    }`}
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isFlipped
                        ? 'rotateY(180deg)'
                        : 'rotateY(0deg)',
                      transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {/* Front */}
                    <div
                      className={`absolute inset-0 w-full h-full rounded-2xl p-5 flex flex-col justify-between border ${tStyle.cardFront}`}
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                      }}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md border font-mono text-[9px] font-bold ${
                              tStyle.isLight
                                ? 'bg-slate-100 border-slate-200 text-slate-600'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            {card.category || `Card #${cIdx + 1}`}
                          </span>
                        </div>
                        <h4
                          className={`text-xs md:text-sm font-bold ${tStyle.titleColor} leading-snug`}
                        >
                          {card.title}
                        </h4>
                        <p
                          className={`text-xs ${tStyle.subtextColor} leading-relaxed line-clamp-3`}
                        >
                          {card.frontText}
                        </p>
                      </div>

                      <div
                        className={`flex items-center justify-between pt-3 border-t ${tStyle.borderColor} text-[10px] text-amber-500 font-bold`}
                      >
                        <span className="flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" /> Click to Inspect ↻
                        </span>
                      </div>
                    </div>

                    {/* Back */}
                    <div
                      className={`absolute inset-0 w-full h-full rounded-2xl p-5 flex flex-col justify-between border ${tStyle.cardBack}`}
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase ${tStyle.badgeBg}`}
                          >
                            COMPLIANCE STANDARD
                          </span>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <h4 className="text-xs md:text-sm font-bold text-amber-600 dark:text-amber-300">
                          {card.backTitle || card.title}
                        </h4>
                        <p
                          className={`text-xs ${tStyle.isLight ? 'text-slate-800' : 'text-slate-200'} leading-relaxed max-h-24 overflow-y-auto custom-scrollbar`}
                        >
                          {card.backText}
                        </p>
                      </div>

                      <div
                        className={`flex items-center justify-between pt-2 border-t ${tStyle.borderColor} text-[10px] font-bold`}
                      >
                        <span className="flex items-center gap-1 text-amber-500">
                          <RotateCcw className="w-3 h-3" /> Flip Front ↺
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    /* ───────────────────────────────────────────────────────────── */
    /* 3. ICON FEATURE CARDS                                        */
    /* ───────────────────────────────────────────────────────────── */
    case 'icon-cards': {
      const cards = comp.props.cards || [];
      return (
        <div
          className={`space-y-3 p-5 md:p-6 rounded-3xl border ${tStyle.cardBg}`}
        >
          {comp.props.title && (
            <h3
              className={`text-sm md:text-base font-bold ${tStyle.titleColor} pb-3 border-b ${tStyle.borderColor}`}
            >
              {comp.props.title}
            </h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {cards.map((card, cIdx) => {
              const IconComp = ICON_MAP[card.icon] || Shield;
              return (
                <div
                  key={cIdx}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 ${tStyle.innerCardBg}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                      <IconComp className="w-4 h-4" />
                    </div>
                    {card.badge && (
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${tStyle.badgeBg}`}
                      >
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <h4
                    className={`text-xs md:text-sm font-bold ${tStyle.titleColor}`}
                  >
                    {card.title}
                  </h4>
                  <p
                    className={`text-xs ${tStyle.subtextColor} leading-relaxed`}
                  >
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    /* ───────────────────────────────────────────────────────────── */
    /* 4. CALLOUT ALERT BANNER                                      */
    /* ───────────────────────────────────────────────────────────── */
    case 'callout': {
      const variant = comp.props.variant || 'warning';
      const styles =
        {
          warning: tStyle.isLight
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-amber-500/10 border-amber-500/50 text-amber-200',
          danger: tStyle.isLight
            ? 'bg-rose-50 border-rose-300 text-rose-950'
            : 'bg-rose-500/10 border-rose-500/50 text-rose-200',
          info: tStyle.isLight
            ? 'bg-sky-50 border-sky-300 text-sky-950'
            : 'bg-sky-500/10 border-sky-500/50 text-sky-200',
          success: tStyle.isLight
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-200',
        }[variant] ||
        (tStyle.isLight
          ? 'bg-amber-50 border-amber-300 text-amber-950'
          : 'bg-amber-500/10 border-amber-500/50 text-amber-200');

      const icon = {
        warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
        danger: <Flame className="w-5 h-5 text-rose-500 shrink-0" />,
        info: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
        success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
      }[variant];

      return (
        <div
          className={`p-5 rounded-2xl border ${styles} shadow-md space-y-2`}
          data-tts-active={isSpeaking}
        >
          <div className="flex items-center gap-2.5 font-bold text-xs md:text-sm">
            {icon}
            <span
              className={
                tStyle.isLight
                  ? 'text-slate-900 font-black'
                  : 'text-white font-bold'
              }
            >
              {comp.props.title || 'Safety Directive'}
            </span>
          </div>
          <div
            className="text-xs md:text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: comp.props.content }}
          />
          {comp.props.bullets && comp.props.bullets.length > 0 && (
            <ul className="space-y-1 pt-1 text-xs list-disc list-inside opacity-90">
              {comp.props.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    /* ───────────────────────────────────────────────────────────── */
    /* 5. TABS COMPONENT                                            */
    /* ───────────────────────────────────────────────────────────── */
    case 'tabs': {
      const tabs = comp.props.tabs || [];
      const activeIdx = activeTabs[comp.id] ?? 0;
      const activeTab = tabs[activeIdx] || tabs[0];

      return (
        <div
          className={`p-5 md:p-6 rounded-3xl border ${tStyle.cardBg} space-y-4`}
        >
          {comp.props.title && (
            <h3
              className={`text-sm md:text-base font-bold ${tStyle.titleColor}`}
            >
              {comp.props.title}
            </h3>
          )}

          {/* Tab Navigation Buttons */}
          <div
            className={`flex gap-1.5 p-1 rounded-2xl border overflow-x-auto custom-scrollbar ${tStyle.tabNavBg}`}
          >
            {tabs.map((t, idx) => {
              const isSelected = activeIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    setActiveTabs((prev) => ({ ...prev, [comp.id]: idx }))
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    isSelected ? tStyle.tabActive : tStyle.tabInactive
                  }`}
                >
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel */}
          {activeTab && (
            <div
              className={`p-4 rounded-2xl border space-y-2 animate-in fade-in ${tStyle.tabContent}`}
            >
              <h4 className="text-xs md:text-sm font-bold text-amber-600 dark:text-amber-400">
                {activeTab.title}
              </h4>
              <div
                className={`text-xs md:text-sm leading-relaxed ${tStyle.proseClass}`}
                dangerouslySetInnerHTML={{ __html: activeTab.content }}
              />
            </div>
          )}
        </div>
      );
    }

    /* ───────────────────────────────────────────────────────────── */
    /* 6. STATS & KEY BENCHMARKS                                    */
    /* ───────────────────────────────────────────────────────────── */
    case 'stats': {
      const stats = comp.props.stats || [];
      return (
        <div
          className={`p-5 md:p-6 rounded-3xl border ${tStyle.cardBg} space-y-4`}
        >
          {comp.props.title && (
            <h3
              className={`text-sm md:text-base font-bold ${tStyle.titleColor}`}
            >
              {comp.props.title}
            </h3>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((s, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border text-center space-y-1 transition-all ${tStyle.innerCardBg}`}
              >
                <span className="text-xl md:text-2xl font-black text-amber-500 font-mono tracking-tight block">
                  {s.value}
                </span>
                <span
                  className={`text-xs font-bold ${tStyle.titleColor} block`}
                >
                  {s.label}
                </span>
                {s.subtitle && (
                  <span className={`text-[10px] ${tStyle.mutedText} block`}>
                    {s.subtitle}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    /* ───────────────────────────────────────────────────────────── */
    /* 7. PROCESS & STEPS TIMELINE                                  */
    /* ───────────────────────────────────────────────────────────── */
    case 'steps': {
      const steps = comp.props.steps || [];
      return (
        <div
          className={`p-5 md:p-6 rounded-3xl border ${tStyle.cardBg} space-y-4`}
        >
          {comp.props.title && (
            <div className={`pb-3 border-b ${tStyle.borderColor}`}>
              <h3
                className={`text-sm md:text-base font-bold ${tStyle.titleColor}`}
              >
                {comp.props.title}
              </h3>
              {comp.props.subtitle && (
                <p className={`text-xs ${tStyle.subtextColor} mt-0.5`}>
                  {comp.props.subtitle}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all ${tStyle.stepItem}`}
              >
                <span
                  className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 shadow-xs ${tStyle.stepNumBg}`}
                >
                  {step.number || String(idx + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 space-y-0.5">
                  <h4
                    className={`text-xs md:text-sm font-bold ${tStyle.titleColor}`}
                  >
                    {step.title}
                  </h4>
                  <p
                    className={`text-xs ${tStyle.subtextColor} leading-relaxed`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    /* ───────────────────────────────────────────────────────────── */
    /* 8. COMPARISON TABLE                                          */
    /* ───────────────────────────────────────────────────────────── */
    case 'comparison': {
      const rows = comp.props.rows || [];
      return (
        <div
          className={`p-5 md:p-6 rounded-3xl border ${tStyle.cardBg} space-y-4`}
        >
          {comp.props.title && (
            <h3
              className={`text-sm md:text-base font-bold ${tStyle.titleColor}`}
            >
              {comp.props.title}
            </h3>
          )}
          <div
            className={`rounded-2xl border ${tStyle.borderColor} overflow-hidden`}
          >
            <div
              className={`grid grid-cols-2 p-3 text-xs font-bold uppercase tracking-wider border-b ${tStyle.tableHeaderBg}`}
            >
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                {comp.props.leftHeader || 'Compliant Practice'}
              </span>
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {comp.props.rightHeader || 'Critical Violation'}
              </span>
            </div>
            <div className={`divide-y ${tStyle.tableBodyBg}`}>
              {rows.map((row, rIdx) => (
                <div
                  key={rIdx}
                  className="grid grid-cols-2 p-3.5 text-xs gap-3"
                >
                  <div
                    className={`${tStyle.tableText} leading-relaxed font-medium`}
                  >
                    <strong className="block text-emerald-600 dark:text-emerald-300 font-bold mb-0.5">
                      {row.criteria}
                    </strong>
                    {row.compliant}
                  </div>
                  <div className={`${tStyle.tableText} leading-relaxed`}>
                    <strong className="block text-rose-600 dark:text-rose-300 font-bold mb-0.5">
                      {row.criteria}
                    </strong>
                    {row.violation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    /* ───────────────────────────────────────────────────────────── */
    /* 9. KEY TAKEAWAYS CARD                                        */
    /* ───────────────────────────────────────────────────────────── */
    case 'key-takeaways': {
      const bullets = comp.props.bullets || [];
      return (
        <div
          className={`p-5 md:p-6 rounded-3xl border ${
            tStyle.isLight
              ? 'border-emerald-300 bg-emerald-50/80 text-emerald-950'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
          } shadow-md space-y-3`}
          data-tts-active={isSpeaking}
        >
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
            <Lightbulb className="w-5 h-5" />
            <h3 className="text-sm md:text-base font-black">
              {comp.props.title || 'Key Takeaways'}
            </h3>
          </div>
          <ul className="space-y-2 pt-1">
            {bullets.map((bullet, idx) => (
              <li
                key={idx}
                className={`flex items-start gap-2.5 text-xs md:text-sm ${tStyle.isLight ? 'text-slate-800' : 'text-slate-200'}`}
              >
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    /* ───────────────────────────────────────────────────────────── */
    /* 10. REGULATION QUOTE / CITATION                              */
    /* ───────────────────────────────────────────────────────────── */
    case 'quote': {
      return (
        <blockquote
          className={`p-5 md:p-6 rounded-3xl border-l-4 border-amber-500 shadow-md space-y-2 ${tStyle.quoteBg}`}
          data-tts-active={isSpeaking}
        >
          <Quote className="w-6 h-6 text-amber-500 opacity-60" />
          <p
            className={`text-xs md:text-sm italic leading-relaxed ${tStyle.titleColor}`}
          >
            &quot;{comp.props.quote}&quot;
          </p>
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 pt-1">
            <span>{comp.props.citation}</span>
            {comp.props.author && (
              <span className={`${tStyle.mutedText} ml-1.5`}>
                • {comp.props.author}
              </span>
            )}
          </div>
        </blockquote>
      );
    }

    /* ───────────────────────────────────────────────────────────── */
    /* 11. FEATURED MEDIA CARD                                      */
    /* ───────────────────────────────────────────────────────────── */
    case 'image-card': {
      return (
        <div
          className={`p-5 md:p-6 rounded-3xl border ${tStyle.cardBg} space-y-3`}
        >
          {comp.props.imageUrl &&
            typeof comp.props.imageUrl === 'string' &&
            comp.props.imageUrl.trim() !== '' && (
              <div
                className="relative rounded-2xl overflow-hidden aspect-16/9 bg-slate-950 cursor-pointer group"
                onClick={() =>
                  onImageClick && onImageClick(comp.props.imageUrl)
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={comp.props.imageUrl}
                  alt={comp.props.title || 'Topic Illustration'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-black/80 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize className="w-3.5 h-3.5" />
                </div>
              </div>
            )}
          <div>
            <h4
              className={`text-sm md:text-base font-bold ${tStyle.titleColor}`}
            >
              {comp.props.title}
            </h4>
            {comp.props.caption && (
              <p className={`text-xs ${tStyle.mutedText} mt-0.5`}>
                {comp.props.caption}
              </p>
            )}
            {comp.props.content && (
              <div
                className={`text-xs md:text-sm mt-2 leading-relaxed ${tStyle.proseClass}`}
                dangerouslySetInnerHTML={{ __html: comp.props.content }}
              />
            )}
          </div>
        </div>
      );
    }

    /* ───────────────────────────────────────────────────────────── */
    /* 12. RICH TEXT BLOCK                                          */
    /* ───────────────────────────────────────────────────────────── */
    case 'rich-text': {
      return (
        <div
          className={`p-5 md:p-6 rounded-3xl border ${tStyle.cardBg}`}
          data-tts-active={isSpeaking}
        >
          <div
            className={tStyle.proseClass}
            dangerouslySetInnerHTML={{
              __html: comp.props.html || '<p>No content available.</p>',
            }}
          />
        </div>
      );
    }

    /* ───────────────────────────────────────────────────────────── */
    /* 14. SAFETY SEQUENCE PUZZLE GAME                              */
    /* ───────────────────────────────────────────────────────────── */
    case 'puzzle-game': {
      return (
        <SafetySequencePuzzleGame comp={comp} tStyle={tStyle} theme={theme} />
      );
    }

    default:
      return null;
  }
}

/**
 * Interactive Safety Sequence Puzzle Mini-Game Component
 */
function SafetySequencePuzzleGame({ comp, tStyle, theme }) {
  const allItems = comp.props?.items || [];
  const [selectedOrder, setSelectedOrder] = useState([]);
  const [availableItems, setAvailableItems] = useState(() => {
    return (
      comp.props?.scrambled || [...allItems].sort(() => Math.random() - 0.5)
    );
  });
  const [isSolved, setIsSolved] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  const handleSelectTile = (item) => {
    if (isSolved) return;
    const newSelected = [...selectedOrder, item];
    const newAvailable = availableItems.filter((i) => i.id !== item.id);
    setSelectedOrder(newSelected);
    setAvailableItems(newAvailable);

    // Auto-check if all slots filled
    if (newSelected.length === allItems.length) {
      setHasAttempted(true);
      const allCorrect = newSelected.every((it, idx) => it.order === idx + 1);
      if (allCorrect) {
        setIsSolved(true);
      }
    }
  };

  const handleRemoveTile = (item) => {
    if (isSolved) return;
    const newSelected = selectedOrder.filter((i) => i.id !== item.id);
    const newAvailable = [...availableItems, item];
    setSelectedOrder(newSelected);
    setAvailableItems(newAvailable);
    setHasAttempted(false);
  };

  const handleReset = () => {
    setSelectedOrder([]);
    setAvailableItems([...allItems].sort(() => Math.random() - 0.5));
    setIsSolved(false);
    setHasAttempted(false);
  };

  return (
    <div
      className={`p-5 md:p-6 rounded-3xl border shadow-xl space-y-5 ${tStyle.cardBg}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-500">
              Interactive Compliance Game
            </span>
          </div>
          <h3
            className={`text-sm md:text-base font-bold ${tStyle.titleColor} mt-1`}
          >
            {comp.props?.title || 'Safety Sequence Puzzle'}
          </h3>
          <p className={`text-xs ${tStyle.subtextColor} mt-0.5`}>
            {comp.props?.subtitle ||
              'Click the safety action tiles in the correct sequence to complete the puzzle.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border/60 hover:bg-muted/40 transition-colors self-start sm:self-auto shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Puzzle
        </button>
      </div>

      {/* Slots Section: Ordered Steps Target Area */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>Your Sequential Safety Protocol</span>
          <span className="font-mono text-amber-500 font-bold">
            {selectedOrder.length} / {allItems.length} Placed
          </span>
        </label>

        <div className="grid grid-cols-1 gap-2.5">
          {Array.from({ length: allItems.length }).map((_, idx) => {
            const placed = selectedOrder[idx];
            const isCorrect = placed && placed.order === idx + 1;

            return (
              <div
                key={idx}
                className={`min-h-[54px] p-3 rounded-2xl border-2 border-dashed flex items-center justify-between gap-3 transition-all ${
                  placed
                    ? isSolved
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-100'
                      : isCorrect
                        ? 'border-amber-500/60 bg-amber-500/5'
                        : hasAttempted
                          ? 'border-rose-500/60 bg-rose-500/10'
                          : 'border-amber-500/40 bg-muted/20'
                    : 'border-border/60 bg-muted/10 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 shadow-xs ${
                      isSolved
                        ? 'bg-emerald-500 text-slate-950'
                        : placed
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {placed ? (
                    <span className="text-xs md:text-sm font-semibold truncate">
                      {placed.text}
                    </span>
                  ) : (
                    <span className="text-xs italic opacity-60">
                      Empty Slot #{idx + 1} — Select a safety tile below
                    </span>
                  )}
                </div>

                {placed && !isSolved && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTile(placed)}
                    className="p-1 rounded-lg hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 transition-colors"
                    title="Remove from slot"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {placed && isSolved && (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Tiles Pool */}
      {!isSolved && availableItems.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/40">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Available Safety Steps (Click to Place in Next Slot)
          </label>

          <div className="flex flex-wrap gap-2">
            {availableItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTile(item)}
                className="px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-card hover:border-amber-500 hover:bg-amber-500/10 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] text-left shadow-xs"
              >
                🧩 {item.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Victory / Solved Banner */}
      {isSolved && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-black">
              <CheckCircle className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-xs md:text-sm font-black text-white">
                {comp.props?.successTitle ||
                  '🎉 100% Compliant Sequence Mastered!'}
              </h4>
              <p className="text-[11px] text-emerald-200/80 mt-0.5">
                {comp.props?.successMessage ||
                  'Great job! You arranged all safety protocol steps in the correct OSHA sequence.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Attempt Incorrect Feedback */}
      {!isSolved &&
        hasAttempted &&
        selectedOrder.length === allItems.length && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <span>
              ⚠️ Some steps are out of order. Click the ❌ to adjust or Reset to
              try again.
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold text-[10px] hover:bg-rose-400 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
    </div>
  );
}
