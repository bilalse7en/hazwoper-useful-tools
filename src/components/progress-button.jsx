"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function ProgressButton({
  isLoading,
  progress,
  label,
  loadingLabel = "Processing",
  className,
  onClick,
  ...props
}) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const buttonRef = useRef(null);

  useEffect(() => {
    if (buttonRef.current) {
      const { offsetWidth, offsetHeight } = buttonRef.current;
      setDimensions({ width: offsetWidth, height: offsetHeight });
    }
    
    // Also handle resizing
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({ 
          width: entry.target.offsetWidth, 
          height: entry.target.offsetHeight 
        });
      }
    });

    if (buttonRef.current) {
      observer.observe(buttonRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Calculate perimeter for the SVG stroke-dasharray
  const radius = 6; // Standard rounded-md radius is approx 6px
  const w = dimensions.width;
  const h = dimensions.height;
  
  // Straight segments
  const perimeter = 2 * (w + h);
  
  // Dash offset: 0 is full, perimeter is empty
  const strokeDashoffset = perimeter - (progress / 100) * perimeter;

  return (
    <div className="relative inline-block w-full">
      <Button
        ref={buttonRef}
        className={cn(
          "relative w-full z-10 transition-all duration-300",
          isLoading && "bg-primary/20 text-primary hover:bg-primary/30",
          className
        )}
        onClick={onClick}
        disabled={isLoading || props.disabled}
        {...props}
      >
        <span className="flex items-center justify-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? `${loadingLabel} ${Math.round(progress)}%` : label}
        </span>
      </Button>

      {/* Progress Border SVG */}
      <svg
        className={cn(
          "absolute top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-300",
          isLoading ? "opacity-100" : "opacity-0"
        )}
        style={{ zIndex: 20 }}
        width={w}
        height={h}
      >
        <rect
          x="1"
          y="1"
          width={Math.max(0, w - 2)}
          height={Math.max(0, h - 2)}
          rx={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
          style={{
            strokeDasharray: perimeter,
            strokeDashoffset: strokeDashoffset,
            transition: "stroke-dashoffset 0.2s ease-out",
          }}
        />
      </svg>
    </div>
  );
}
