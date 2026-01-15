"use client";

import { useEffect, useState, useRef } from "react";
import { Sparkles, Code, Zap, Shield, Cpu } from "lucide-react";

export function VictoryScroll({ role = "admin", onComplete }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [typedText, setTypedText] = useState("");
  const scrollRef = useRef(null);
  
  const victoryText = "🎉 Victory Achieved! Welcome Bilal...";
  
  // Typing effect
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < victoryText.length) {
        setTypedText(victoryText.substring(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const progress = scrollTop / (scrollHeight - clientHeight);
        setScrollProgress(Math.min(progress, 1));
      }
    };

    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll);
      return () => ref.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Corner cards configuration - Your actual tools
  const cards = [
    {
      title: "Course Generator",
      desc: "Extract & generate course content from DOCX: overview, objectives, syllabus, FAQ, main points",
      icon: Code,
      color: "from-blue-500 to-cyan-500",
      position: "top-left",
      positionClass: "top-4 left-4"
    },
    {
      title: "Blog Generator",
      desc: "Generate SEO-optimized blog content & FAQ HTML from DOCX files automatically",
      icon: Zap,
      color: "from-purple-500 to-pink-500",
      position: "top-right",
      positionClass: "top-4 right-4"
    },
    {
      title: "Resource Generator",
      desc: "Process Excel files to create resource pages with glossary links & PDF listings",
      icon: Shield,
      color: "from-orange-500 to-red-500",
      position: "bottom-left",
      positionClass: "bottom-4 left-4"
    },
    {
      title: "Professional Tools",
      desc: "AI Assistant, Video Compressor, Image Converter, HTML Cleaner & more utilities",
      icon: Cpu,
      color: "from-green-500 to-emerald-500",
      position: "bottom-right",
      positionClass: "bottom-4 right-4"
    }
  ];

  // Calculate which card should be visible based on scroll
  const getCardVisibility = (index) => {
    const cardStart = 0.25 + (index * 0.12);
    const cardEnd = cardStart + 0.12;
    
    const isVisible = scrollProgress >= cardStart && scrollProgress < cardEnd;
    const opacity = isVisible ? 1 : 0;
    
    // Slide from corner direction
    const slideTransforms = {
      "top-left": isVisible ? "translate(0, 0)" : "translate(-100%, -100%)",
      "top-right": isVisible ? "translate(0, 0)" : "translate(100%, -100%)",
      "bottom-left": isVisible ? "translate(0, 0)" : "translate(-100%, 100%)",
      "bottom-right": isVisible ? "translate(0, 0)" : "translate(100%, 100%)"
    };
    
    return {
      opacity,
      transform: slideTransforms[cards[index].position]
    };
  };

  const showInitial = scrollProgress < 0.25;
  const showCards = scrollProgress >= 0.25 && scrollProgress < 0.73;
  const showFinal = scrollProgress >= 0.73;

  return (
    <div 
      ref={scrollRef}
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-y-auto overflow-x-hidden scroll-smooth"
    >
      {/* Scrollable height */}
      <div className="h-[500vh] relative">
        
        {/* Sticky viewport */}
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          
          {/* Animated grid background */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(to right, #333 1px, transparent 1px),
                linear-gradient(to bottom, #333 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              transform: `translateY(${scrollProgress * 100}px)`
            }}
          />
          
          {/* Gradient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-500/20 via-transparent to-transparent blur-3xl" />

          {/* Progress bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-800 z-50">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transition-all duration-300"
              style={{ width: `${scrollProgress * 100}%` }}
            />
          </div>
          
          {/* Step 1: Initial Victory Message */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-700"
            style={{
              opacity: showInitial ? 1 : 0,
              transform: showInitial ? 'translateY(0)' : 'translateY(-50px)',
              pointerEvents: showInitial ? 'auto' : 'none'
            }}
          >
            <div className="max-w-3xl text-center space-y-6">
              <div className="inline-block p-3 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-sm">
                <Sparkles className="w-12 h-12 text-purple-400 animate-pulse" />
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent leading-tight">
                {typedText}
                <span className="inline-block w-0.5 h-8 bg-purple-400 ml-1 animate-pulse" />
              </h1>
              
              <p className="text-base md:text-lg text-gray-400 font-light">
                Professional code generation tools at your fingertips
              </p>
              
              {/* Scroll indicator */}
              <div className="flex flex-col items-center gap-2 mt-8 opacity-60">
                <div className="w-5 h-9 rounded-full border-2 border-purple-400 flex items-start justify-center p-1">
                  <div className="w-1 h-2.5 bg-purple-400 rounded-full animate-bounce" />
                </div>
                <p className="text-xs font-medium uppercase tracking-wider">Scroll to explore</p>
              </div>
            </div>
          </div>

          {/* Centered Logo (visible during cards) */}
          <div 
            className="absolute top-1/2 left-1/2 transition-all duration-700 pointer-events-none z-20"
            style={{
              opacity: showCards ? 1 : 0,
              transform: showCards 
                ? 'translate(-50%, -50%) scale(1)' 
                : 'translate(-50%, -50%) scale(0.8)'
            }}
          >
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-2xl rounded-full animate-pulse" />
              <img
                src="https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765460885/Hi.gif"
                alt="HAZWOPER Tools"
                className="relative w-24 h-24 md:w-72 md:h-72 object-contain rounded-2xl"
              />
            </div>
          </div>

          {/* Corner Cards - Fixed to corners, appear one at a time */}
          {cards.map((card, index) => {
            const visibility = getCardVisibility(index);
            const Icon = card.icon;
            
            return (
              <div
                key={index}
                className={`fixed ${card.positionClass} transition-all duration-700 ease-out z-30`}
                style={{
                  opacity: visibility.opacity,
                  transform: visibility.transform,
                  pointerEvents: visibility.opacity > 0 ? 'auto' : 'none'
                }}
              >
                <div className="relative">
                  {/* Card glow */}
                  <div className={`absolute -inset-2 bg-gradient-to-r ${card.color} opacity-20 blur-xl rounded-2xl`} />
                  
                  {/* Card content */}
                  <div className="relative bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4 shadow-2xl">
                    <div className={`inline-block p-2 rounded-lg bg-gradient-to-r ${card.color} mb-2`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    
                    <h3 className="text-base font-bold mb-1 text-white">
                      {card.title}
                    </h3>
                    
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Step 3: Final CTA */}
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-700"
            style={{
              opacity: showFinal ? 1 : 0,
              transform: showFinal ? 'scale(1)' : 'scale(0.8)',
              pointerEvents: showFinal ? 'auto' : 'none'
            }}
          >
            <div className="text-center space-y-6">
              {/* Logo */}
              <div className="relative">
                <div className="absolute -inset-8 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 blur-3xl rounded-full animate-pulse" />
                <img
                  src="https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765460885/Hi.gif"
                  alt="HAZWOPER Tools"
                  className="relative w-40 h-40 md:w-56 md:h-56 mx-auto object-contain rounded-3xl"
                />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Ready to Generate
              </h2>
              
              <p className="text-gray-400 text-sm md:text-base">
                Your professional toolkit awaits
              </p>
              
              <p className="text-xs text-gray-500 italic">
                Crafted with excellence by Bilal
              </p>
              
              {/* CTA Button */}
              <button
                onClick={onComplete}
                className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Sparkles className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Enter Workspace</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
