"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Trash2, FileImage, Video, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getToolHistory, deleteToolHistory, getTimeRemaining, formatSize } from "@/lib/tool-history";
import { cn } from "@/lib/utils";

export function ToolHistoryPanel({ toolType, refreshTrigger = 0 }) {
  const [history, setHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch history
  const fetchHistory = async () => {
    setLoading(true);
    const data = await getToolHistory(toolType);
    setHistory(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [toolType, refreshTrigger]);

  // Auto-refresh countdown every minute
  useEffect(() => {
    if (!isOpen || history.length === 0) return;
    const interval = setInterval(() => {
      setHistory(prev => prev.filter(item => {
        const expires = new Date(item.expires_at);
        return expires > new Date();
      }));
    }, 60000);
    return () => clearInterval(interval);
  }, [isOpen, history.length]);

  const handleDelete = async (id) => {
    const success = await deleteToolHistory(id);
    if (success) {
      setHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  if (history.length === 0 && !loading) return null;

  const toolIcon = toolType === 'video_compressor' ? Video : FileImage;
  const ToolIcon = toolIcon;

  return (
    <div className="w-full">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-6 py-4 rounded-2xl border transition-all duration-300",
          isOpen
            ? "bg-primary/5 border-primary/20 shadow-lg"
            : "bg-card/40 border-border/50 hover:bg-card/60 hover:border-border"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
            isOpen ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-sm font-black uppercase tracking-wider block">
              Recent History
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              {history.length} item{history.length !== 1 ? 's' : ''} · Auto-deletes in 24h
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-[9px] font-black px-3 py-1">{history.length}</Badge>
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* History List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" />
                  Loading history...
                </div>
              ) : (
                history.map((item, index) => {
                  const timeLeft = getTimeRemaining(item.expires_at);
                  const isExpiring = timeLeft.includes('m remaining') && !timeLeft.includes('h');

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="group flex items-center gap-4 p-4 rounded-xl bg-card/30 border border-border/50 hover:bg-card/60 hover:border-border transition-all"
                    >
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                        <ToolIcon className="w-5 h-5 text-primary/70" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{item.file_name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-muted-foreground font-mono">{formatSize(item.file_size)}</span>
                          {item.reduction_percent > 0 && (
                            <Badge variant="secondary" className="text-[8px] px-2 py-0 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                              -{item.reduction_percent}%
                            </Badge>
                          )}
                          {item.output_format && (
                            <span className="text-[10px] text-muted-foreground font-mono uppercase">{item.output_format}</span>
                          )}
                        </div>
                      </div>

                      {/* Timer */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider",
                          isExpiring
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {isExpiring && <AlertCircle className="w-3 h-3" />}
                          <Clock className="w-3 h-3" />
                          {timeLeft}
                        </div>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
