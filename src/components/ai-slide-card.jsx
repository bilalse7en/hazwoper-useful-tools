'use client';

import React from 'react';

// Default images from Hazwoper Media
const DEFAULT_IMAGES = {
  challenge:
    'https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789050840/the-challange.webp',
  aiHelp:
    'https://media.hazwoper-osha.com/wp-content/uploads/2026/09/1789050840/how-ai-can-help.webp',
  beforeIcons: [
    'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077952/Before-Ai--1.webp',
    'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai--2.webp',
    'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai--3.webp',
    'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai---4.webp',
    'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/Before-Ai--5.webp',
  ],
  withAiIcons: [
    'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/With-AI---1.webp',
    'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/With-AI---2.webp',
    'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785078099/With-AI---3.webp',
    'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077952/With-AI---4.webp',
    'https://media.hazwoper-osha.com/wp-content/uploads/2026/07/1785077951/With-AI---5.webp',
  ],
};

// Item configurations for With-AI points (4 or 5 points supported with unique styles & animations)
const WITH_AI_STYLES = [
  {
    // Item 1: Cyan/Sky Blue — 360° spin & full circle morph
    color: '#30b6e5',
    barBg: 'bg-[#30b6e5]',
    barHover:
      'group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_10px_rgba(48,182,229,0.35)]',
    cardBorderHover:
      'hover:via-[#30b6e5]/30 hover:shadow-[0_14px_26px_rgba(48,182,229,0.18)]',
    glowGradient: 'from-white/50 via-transparent to-[#30b6e5]/20',
    iconBoxAnimation:
      'group-hover/pt:scale-[1.18] group-hover/pt:rotate-[360deg] group-hover/pt:rounded-[50%] group-hover/pt:bg-gradient-to-br group-hover/pt:from-[#30b6e5] group-hover/pt:to-white group-hover/pt:border-[#30b6e5] group-hover/pt:shadow-[0_0_16px_rgba(48,182,229,0.30)]',
    iconImgAnimation: 'group-hover/pt:scale-90 group-hover/pt:-rotate-[360deg]',
  },
  {
    // Item 2: Teal — Float Lift Up & Zoom Bounce
    color: '#24abb3',
    barBg: 'bg-[#24abb3]',
    barHover:
      'group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_10px_rgba(36,171,179,0.35)]',
    cardBorderHover:
      'hover:via-[#24abb3]/30 hover:shadow-[0_14px_26px_rgba(36,171,179,0.18)]',
    glowGradient: 'from-white/50 via-transparent to-[#24abb3]/20',
    iconBoxAnimation:
      'group-hover/pt:-translate-y-2 group-hover/pt:scale-[1.15] group-hover/pt:bg-[#d9f4ed] group-hover/pt:border-[#24abb3] group-hover/pt:shadow-[0_10px_16px_-4px_rgba(36,171,179,0.25)]',
    iconImgAnimation: 'group-hover/pt:scale-110',
  },
  {
    // Item 3: Ocean Teal — Counter-tilt Squircle Morph (-6deg)
    color: '#19aa9f',
    barBg: 'bg-[#19aa9f]',
    barHover:
      'group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_10px_rgba(25,170,159,0.35)]',
    cardBorderHover:
      'hover:via-[#19aa9f]/30 hover:shadow-[0_14px_26px_rgba(25,170,159,0.18)]',
    glowGradient: 'from-white/50 via-transparent to-[#19aa9f]/20',
    iconBoxAnimation:
      'group-hover/pt:scale-[1.15] group-hover/pt:rounded-[10px] group-hover/pt:-rotate-6 group-hover/pt:bg-[#d9f4ed] group-hover/pt:border-[#19aa9f] group-hover/pt:shadow-[0_0_16px_rgba(25,170,159,0.25)]',
    iconImgAnimation: 'group-hover/pt:rotate-6',
  },
  {
    // Item 4: Spring Green — Steep Angular Tilt (-18deg) + Gradient Wash
    color: '#2ebe78',
    barBg: 'bg-[#2ebe78]',
    barHover:
      'group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_10px_rgba(46,190,120,0.35)]',
    cardBorderHover:
      'hover:via-[#2ebe78]/30 hover:shadow-[0_14px_26px_rgba(46,190,120,0.18)]',
    glowGradient: 'from-white/50 via-transparent to-[#2ebe78]/20',
    iconBoxAnimation:
      'group-hover/pt:scale-[1.18] group-hover/pt:-rotate-[18deg] group-hover/pt:bg-gradient-to-tr group-hover/pt:from-[#2ebe78] group-hover/pt:to-white group-hover/pt:border-[#2ebe78] group-hover/pt:shadow-[0_0_18px_rgba(46,190,120,0.28)]',
    iconImgAnimation: 'group-hover/pt:scale-90 group-hover/pt:rotate-[18deg]',
  },
  {
    // Item 5: Emerald Green — 3D Elastic Pop + Clockwise Tilt (+15deg) + Ripple Glow
    color: '#10b981',
    barBg: 'bg-[#10b981]',
    barHover:
      'group-hover/pt:h-[54px] group-hover/pt:shadow-[0_0_12px_rgba(16,185,129,0.40)]',
    cardBorderHover:
      'hover:via-[#10b981]/30 hover:shadow-[0_14px_26px_rgba(16,185,129,0.22)]',
    glowGradient: 'from-white/50 via-transparent to-[#10b981]/20',
    iconBoxAnimation:
      'group-hover/pt:scale-[1.20] group-hover/pt:rotate-[15deg] group-hover/pt:rounded-[22px] group-hover/pt:bg-gradient-to-br group-hover/pt:from-[#10b981] group-hover/pt:via-[#34d399] group-hover/pt:to-white group-hover/pt:border-[#10b981] group-hover/pt:shadow-[0_0_20px_rgba(16,185,129,0.35)]',
    iconImgAnimation: 'group-hover/pt:scale-95 group-hover/pt:-rotate-[15deg]',
  },
];

/**
 * Parses an item string or object:
 * If a string starts with a word, we can highlight the first word or accept an object { text, highlight }
 */
function formatText(item, highlightColor) {
  if (typeof item === 'object' && item !== null) {
    if (item.highlight) {
      return (
        <>
          <span style={{ color: highlightColor }} className="font-bold">
            {item.highlight}{' '}
          </span>
          {item.text}
        </>
      );
    }
    return item.text;
  }

  // If item is string, check if it already has html or if we should auto-highlight first word
  const str = String(item || '').trim();
  const firstSpaceIdx = str.indexOf(' ');
  if (firstSpaceIdx > 0 && !str.startsWith('<')) {
    const firstWord = str.slice(0, firstSpaceIdx);
    const rest = str.slice(firstSpaceIdx + 1);
    return (
      <>
        <span style={{ color: highlightColor }} className="font-bold">
          {firstWord}{' '}
        </span>
        {rest}
      </>
    );
  }

  return str;
}

// ==========================================
// 1. SLIDE COMPONENT: The Challenge and How AI Can Help
// ==========================================
export function ChallengeAiSlide({
  challengeTitle = 'The Challenge',
  challengeContent = [
    'Customers expect confirmation that their inventory request was received and that action is being taken.',
    "As request volumes increase, repeatedly reviewing messages and drafting similar replies can take time away from Donna's other operational responsibilities.",
  ],
  challengeImage = DEFAULT_IMAGES.challenge,

  aiHelpTitle = 'How AI Can Help',
  aiHelpContent = [
    'AI can review an incoming inventory request and generate a draft reply that confirms receipt, outlines appropriate next steps, and uses a professional tone.',
    'Donna can review and adjust the draft before sending it.',
  ],
  aiHelpImage = DEFAULT_IMAGES.aiHelp,

  disclaimerText = 'The employee remains responsible for verifying customer-specific details and ensuring that the draft accurately reflects current organizational information.',
  showDisclaimer = false,
  className = '',
}) {
  const renderContent = (content) => {
    if (Array.isArray(content)) {
      return (
        <ul className="leading-[1.65] mb-5 text-[#303d48] text-[15px] space-y-2.5 transition-colors duration-500 group-hover:text-[#263641] list-disc pl-5">
          {content.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      );
    }
    return (
      <p className="leading-[1.65] mb-5 text-[#303d48] text-[15px] transition-colors duration-500 group-hover:text-[#263641]">
        {content}
      </p>
    );
  };

  return (
    <div className={`w-full max-w-[1280px] mx-auto box-border ${className}`}>
      <div className="flex flex-wrap gap-[22px] w-full box-border justify-center">
        {/* THE CHALLENGE CARD */}
        <div className="group relative flex-[1_1_520px] min-w-[320px] sm:min-w-[480px] box-border rounded-[22px] bg-gradient-to-br from-white to-[#e8f4fd] border border-[rgba(32,95,153,0.16)] border-t-[6px] border-t-[#205f99] min-[998px]:border-t-0 min-[998px]:border-l-[6px] min-[998px]:border-l-[#205f99] shadow-[0_10px_28px_rgba(1,51,93,0.10)] overflow-hidden flex flex-col min-[998px]:flex-row transition-all duration-500 ease-out hover:shadow-[0_15px_36px_rgba(1,51,93,0.14)]">
          {/* IMAGE PANEL */}
          <div className="w-full box-border p-[22px_16px] flex items-center justify-center bg-[rgba(32,95,153,0.055)] border-b border-[rgba(32,95,153,0.10)] relative min-[998px]:w-auto min-[998px]:flex-1 min-[998px]:basis-[175px] min-[998px]:min-w-[175px] min-[998px]:border-b-0 min-[998px]:border-r min-[1400px]:basis-[185px] min-[1400px]:min-w-[185px] transition-all duration-500 group-hover:bg-[rgba(32,95,153,0.09)]">
            <div className="absolute w-[150px] h-[150px] rounded-full left-[-78px] top-1/2 -translate-y-1/10 bg-[rgba(32,95,153,0.055)] transition-all duration-700 ease-out group-hover:scale-[1.18] group-hover:bg-[rgba(32,95,153,0.10)] min-[998px]:left-auto min-[998px]:right-[-90px] min-[998px]:bottom-[-170px]" />
            <div className="relative w-[145px] h-[145px] max-w-full shrink-0 rounded-full bg-[rgba(255,255,255,0.82)] flex items-center justify-center shadow-[0_0_0_8px_rgba(32,95,153,0.06),0_10px_22px_rgba(32,95,153,0.12)] z-[2]">
              <div className="absolute border-2 border-[#205f99eb] border-dashed duration-[1000ms] ease-out group-hover:rotate-[100deg] group-hover:scale-[1.08] h-[118px] w-[118px] rounded-full transition-all" />
              <img
                src={challengeImage}
                alt={challengeTitle}
                className="max-w-[112px] max-h-[112px] w-auto h-auto object-contain relative z-[2] rounded-full border-2 border-[rgba(32,95,153,0.18)] transition-all duration-700 ease-out group-hover:scale-[1.06] group-hover:border-[rgba(32,95,153,0.42)]"
              />
            </div>
          </div>

          {/* CONTENT */}
          <div className="box-border flex flex-col min-[998px]:flex-[2_1_260px] min-[998px]:min-w-[260px] min-[998px]:p-[28px_26px_24px] p-[24px_22px_26px] relative w-full z-[2]">
            <div className="absolute top-[25px] right-[25px] w-[8px] h-[8px] rounded-full bg-[#205f99] opacity-40 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-[1.6] group-hover:shadow-[0_0_0_5px_rgba(32,95,153,0.10)]" />
            <h3 className="m-0 mb-3 text-[#205f99] font-extrabold text-[21px] leading-[1.25] uppercase tracking-[1.2px] text-center min-[998px]:text-left transition-all duration-500 group-hover:text-[#174f82]">
              {challengeTitle}
            </h3>

            {renderContent(challengeContent)}

            <div className="!mx-auto bg-[#205f99] h-1 min-[998px]:mx-0 mt-auto pt-0 rounded-[20px] w-12 transition-all duration-500 ease-out group-hover:w-[70px] group-hover:h-[4px]" />
          </div>
        </div>

        {/* HOW AI CAN HELP CARD */}
        <div className="group relative flex-[1_1_520px] min-w-[320px] sm:min-w-[480px] box-border rounded-[22px] bg-gradient-to-br from-white to-[#e5faec] border border-[rgba(16,185,129,0.16)] border-t-[6px] border-t-[#10b981] min-[998px]:border-t-0 min-[998px]:border-l-[6px] min-[998px]:border-l-[#10b981] shadow-[0_10px_28px_rgba(16,185,129,0.10)] overflow-hidden flex flex-col min-[998px]:flex-row transition-all duration-500 ease-out hover:shadow-[0_15px_36px_rgba(16,185,129,0.14)]">
          {/* IMAGE PANEL */}
          <div className="w-full box-border p-[22px_16px] flex items-center justify-center bg-[rgba(16,185,129,0.055)] border-b border-[rgba(16,185,129,0.10)] relative min-[998px]:w-auto min-[998px]:flex-1 min-[998px]:basis-[175px] min-[998px]:min-w-[175px] min-[998px]:border-b-0 min-[998px]:border-r min-[1400px]:basis-[185px] min-[1400px]:min-w-[185px] transition-all duration-500 group-hover:bg-[rgba(16,185,129,0.09)]">
            <div className="absolute w-[150px] h-[150px] rounded-full left-[-78px] top-1/2 -translate-y-1/10 bg-[rgba(16,185,129,0.055)] transition-all duration-700 ease-out group-hover:scale-[1.18] group-hover:bg-[rgba(16,185,129,0.10)] min-[998px]:left-auto min-[998px]:right-[-90px] min-[998px]:top-[-170px]" />
            <div className="relative w-[145px] h-[145px] max-w-full shrink-0 rounded-full bg-[rgba(255,255,255,0.84)] flex items-center justify-center shadow-[0_0_0_8px_rgba(16,185,129,0.06),0_10px_22px_rgba(16,185,129,0.12)] z-[2]">
              <div className="absolute border-2 border-[#209967eb] border-dashed duration-[1000ms] ease-out group-hover:rotate-[100deg] group-hover:scale-[1.08] h-[118px] w-[118px] rounded-full transition-all" />
              <img
                src={aiHelpImage}
                alt={aiHelpTitle}
                className="max-w-[115px] max-h-[108px] w-auto h-auto object-contain relative z-[2] rounded-full border-2 border-[rgba(16,185,129,0.18)] transition-all duration-700 ease-out group-hover:scale-[1.06] group-hover:border-[rgba(16,185,129,0.45)]"
              />
            </div>
          </div>

          {/* CONTENT */}
          <div className="box-border flex flex-col min-[998px]:flex-[2_1_260px] min-[998px]:min-w-[260px] min-[998px]:p-[28px_26px_24px] p-[24px_22px_26px] relative w-full z-[2]">
            <div className="absolute top-[25px] right-[25px] w-[8px] h-[8px] rounded-full bg-[#10b981] opacity-40 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:scale-[1.6] group-hover:shadow-[0_0_0_5px_rgba(16,185,129,0.10)]" />
            <h3 className="m-0 mb-3 text-[#079669] font-extrabold text-[21px] leading-[1.25] uppercase tracking-[1.2px] text-center min-[998px]:text-left transition-all duration-500 group-hover:text-[#087e5a]">
              {aiHelpTitle}
            </h3>

            {renderContent(aiHelpContent)}

            <div className="!mx-auto bg-[#10b981] h-1 min-[998px]:mx-0 mt-auto pt-0 rounded-[20px] w-12 transition-all duration-500 ease-out group-hover:w-[70px] group-hover:h-[4px]" />
          </div>
        </div>
      </div>

      {/* BOTTOM DISCLAIMER BANNER */}
      {showDisclaimer && disclaimerText && (
        <div className="group/message relative z-[2] mt-[14px] overflow-hidden rounded-[19px] border border-[#b9dfd8] bg-gradient-to-br from-[#f5fbff] via-[#f7fcfb] to-[#effbf4] px-[24px] py-[19px] backdrop-blur-[4px] transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-[4px] hover:border-[#78cfc0] hover:from-[#eef9ff] hover:via-[#f5fdf9] hover:to-[#e6faef] hover:shadow-[0_12px_28px_rgba(32,95,153,0.12)]">
          <div className="pointer-events-none absolute -right-[55px] -top-[55px] h-[130px] w-[130px] rounded-full bg-[#68e5ab]/10 blur-[28px] opacity-0 transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover/message:opacity-100 group-hover/message:scale-125" />
          <div className="pointer-events-none absolute -bottom-[60px] -left-[50px] h-[130px] w-[130px] rounded-full bg-[#38b5e4]/10 blur-[30px] opacity-0 transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover/message:opacity-100 group-hover/message:scale-125" />
          <div className="pointer-events-none absolute left-0 top-0 h-[50px] w-[5px] -translate-x-1/2 rounded-b-full bg-gradient-to-r from-[#38b5e4] via-[#68e5ab] to-[#38b5e4] opacity-20 transition-all duration-700 group-hover/message:w-[130px] group-hover/message:opacity-70" />
          <div className="pointer-events-none absolute right-0 top-0 h-[50px] w-[5px] translate-x-1/2 rounded-b-full bg-gradient-to-r from-[#38b5e4] via-[#68e5ab] to-[#38b5e4] opacity-20 transition-all duration-700 group-hover/message:w-[130px] group-hover/message:opacity-70" />

          <p className="relative z-[2] m-0 text-center text-[14px] font-medium leading-[1.7] text-[#40515d] transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover/message:text-[#263f46] min-[1400px]:text-[15px]">
            {disclaimerText}
          </p>

          <div className="pointer-events-none absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-[#68e5ab] to-transparent opacity-0 transition-all duration-700 group-hover/message:w-[45%] group-hover/message:opacity-80" />
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. SLIDE COMPONENT: Before vs With AI
// ==========================================
export function BeforeAfterSlide({
  beforeTitle = 'Before AI',
  withTitle = 'With AI',
  beforePoints = [
    'Searching through old emails for a piece of information',
    'Rewriting the same type of message over and over',
    'Starting reports from scratch every time',
    'Organizing notes manually after a meeting',
  ],
  withAiPoints = [
    'Faster searching, summarizing, and writing first drafts',
    'Automating templated messages',
    'Instant summaries of long documents',
    'Organized action items from meetings',
  ],
  beforeIcons = DEFAULT_IMAGES.beforeIcons,
  withAiIcons = DEFAULT_IMAGES.withAiIcons,
  className = '',
}) {
  return (
    <div className={`w-full box-border my-[25px] ${className}`}>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-7 w-full items-stretch">
        {/* BEFORE AI COLUMN */}
        <div className="group relative w-full min-w-0 rounded-[30px] bg-gradient-to-r from-[#777777] via-[#d0d0d0] to-[#777777] p-[2px] transition-all duration-700 ease-out hover:from-[#4d4d4d] hover:via-[#eaeaea] hover:to-[#7a7a7a] hover:shadow-[0_0_24px_rgba(130,130,130,0.28)]">
          <div className="relative w-full h-full min-w-0 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#f1f1f1] via-[#e7e7e7] to-[#d6d6d6] p-5 sm:p-7 lg:p-[30px] box-border">
            <div className="absolute bg-gradient-to-r duration-700 ease-out from-[#777777] group-hover:h-[11px] group-hover:shadow-[0_0_14px_rgba(130,130,130,0.35)] h-[7px] left-0 to-[#c8c8c8] top-0 transition-all via-[#a7a7a7] w-full z-30" />
            <div className="absolute -top-20 -right-20 w-[190px] h-[190px] rounded-full bg-white/40 backdrop-blur-sm transition-all duration-700 ease-out group-hover:scale-[1.5] group-hover:bg-white/60 group-hover:translate-x-2 group-hover:-translate-y-2 pointer-events-none" />
            <div className="absolute -bottom-[90px] -left-[90px] w-[180px] h-[180px] rounded-full bg-white/25 backdrop-blur-sm transition-all duration-700 ease-out group-hover:scale-[1.4] group-hover:bg-white/45 group-hover:-translate-x-2 group-hover:translate-y-2 pointer-events-none" />

            <div className="relative z-10 text-center mb-[26px] pt-1">
              <h2 className="m-0 text-[#222222] text-2xl sm:text-3xl font-bold tracking-tight transition-all duration-500 ease-out group-hover:tracking-wide">
                {beforeTitle}
              </h2>
              <div className="w-[55px] h-1 bg-[#777777] rounded-full mx-auto mt-[10px] mb-[9px] transition-all duration-500 ease-out group-hover:w-20 group-hover:bg-[#555555]" />
            </div>

            <div className="relative z-10 flex flex-col gap-[13px]">
              {beforePoints.map((point, idx) => {
                const icon =
                  beforeIcons[idx] || beforeIcons[beforeIcons.length - 1];
                return (
                  <div
                    key={idx}
                    className="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-black/[0.06] backdrop-blur-sm transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/80 hover:via-white/20 hover:to-white/60 hover:-translate-y-1.5 hover:shadow-[0_10px_22px_rgba(0,0,0,0.08)]"
                  >
                    <div className="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/90 p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_12px_rgba(0,0,0,0.05)]">
                      <div className="shrink-0 w-2 h-[46px] rounded-[10px] bg-[#999999]" />
                      <div className="shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#eeeeee] border border-[#dddddd]">
                        <img
                          src={icon}
                          alt={`Before AI ${idx + 1}`}
                          className="w-[42px] h-[42px] object-contain"
                          onError={(e) => {
                            // Fallback if 5th icon webp isn't uploaded yet
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="m-0 text-[#333333] text-base leading-relaxed break-words">
                          {typeof point === 'object' ? point.text : point}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* WITH AI COLUMN */}
        <div className="group relative w-full min-w-0 rounded-[30px] bg-gradient-to-r from-[#087443] via-[#30b6e5] to-[#19aa9f] p-[2px] transition-all duration-700 ease-out hover:from-[#30b6e5] hover:via-[#68e5ab] hover:to-[#087443] hover:shadow-[0_0_26px_rgba(48,182,229,0.28)]">
          <div className="relative w-full h-full min-w-0 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#edf9f4] via-[#e4f6ee] to-[#d7eee4] p-5 sm:p-7 lg:p-[30px] box-border">
            <div className="absolute bg-gradient-to-r duration-700 ease-out from-[#087443] group-hover:h-[11px] group-hover:shadow-[0_0_16px_rgba(48,182,229,0.35)] h-[7px] left-0 to-[#19aa9f] top-0 transition-all via-[#30b6e5] w-full z-30" />
            <div className="-right-20 -top-20 absolute backdrop-blur-sm bg-white/35 duration-700 ease-out group-hover:-translate-y-2 group-hover:bg-white/68 group-hover:scale-[1.5] group-hover:translate-x-2 h-[190px] pointer-events-none rounded-full transition-all w-[190px]" />
            <div className="absolute -bottom-[90px] -left-[90px] w-[180px] h-[180px] rounded-full bg-white/35 backdrop-blur-sm transition-all duration-700 ease-out group-hover:scale-[1.4] group-hover:bg-white/35 group-hover:-translate-x-2 group-hover:translate-y-2 pointer-events-none" />

            <div className="relative z-10 text-center mb-[26px] pt-1">
              <h2 className="m-0 bg-gradient-to-r from-[#087443] via-[#30b6e5] to-[#19aa9f] bg-clip-text text-transparent text-2xl sm:text-3xl font-bold tracking-tight transition-all duration-500 ease-out group-hover:tracking-wide">
                {withTitle}
              </h2>
              <div className="w-[55px] h-1 rounded-full bg-gradient-to-r from-[#30b6e5] to-[#087443] mx-auto mt-[10px] mb-[9px] transition-all duration-500 ease-out group-hover:w-20" />
            </div>

            <div className="relative z-10 flex flex-col gap-[13px]">
              {withAiPoints.map((point, idx) => {
                const style = WITH_AI_STYLES[idx % WITH_AI_STYLES.length];
                const icon =
                  withAiIcons[idx] || withAiIcons[withAiIcons.length - 1];

                return (
                  <div
                    key={idx}
                    className={`group/pt relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 rounded-[18px] p-[1.5px] bg-[#d5eee4] backdrop-blur-sm overflow-hidden transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-white/90 ${style.cardBorderHover} hover:to-white/70 hover:-translate-y-2`}
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover/pt:opacity-100 bg-gradient-to-br ${style.glowGradient} rounded-[18px]`}
                    />
                    <div className="relative flex items-center gap-3 sm:gap-[15px] w-full min-w-0 bg-white/95 backdrop-blur-md p-3 sm:p-[15px] rounded-[16.5px] box-border shadow-[0_5px_14px_rgba(8,116,67,0.07)]">
                      {/* Left accent bar */}
                      <div
                        className={`shrink-0 w-2 h-[46px] rounded-[10px] ${style.barBg} transition-all duration-500 ease-out ${style.barHover}`}
                      />

                      {/* Icon container with unique per-point animation */}
                      <div
                        className={`shrink-0 flex items-center justify-center w-11 h-11 sm:w-[50px] sm:h-[50px] rounded-[15px] bg-[#e9f8f4] border border-[#d1eee5] transition-all duration-700 ease-out ${style.iconBoxAnimation}`}
                      >
                        <img
                          src={icon}
                          alt={`With AI ${idx + 1}`}
                          className={`w-[42px] h-[42px] object-contain transition-transform duration-700 ease-out ${style.iconImgAnimation}`}
                          onError={(e) => {
                            // Fallback if 5th icon webp isn't uploaded yet
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>

                      {/* Text content with first word bold highlight */}
                      <div className="flex-1 min-w-0">
                        <p className="m-0 text-[#333333] text-base leading-relaxed break-words">
                          {formatText(point, style.color)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. UNIVERSAL ALL-IN-ONE SLIDE COMPONENT
// ==========================================
export default function AiSlide({ type = 'challenge', ...props }) {
  if (type === 'before-after' || type === 'comparison') {
    return <BeforeAfterSlide {...props} />;
  }
  return <ChallengeAiSlide {...props} />;
}
