"use client";

import { useState, useEffect } from "react";
import { getToolHistory, deleteToolHistory, getTimeRemaining, formatSize } from "@/lib/tool-history";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  History, 
  Trash2, 
  Clock, 
  FileText, 
  ChevronRight,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";

export function HistoryList({ toolType, onRestore, className }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();

    // Subscribe to REALTIME additions for this tool
    const channel = supabase
      .channel(`history-${toolType}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tool_history' }, () => {
        loadHistory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toolType]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getToolHistory(toolType);
      setHistory(data.filter(item => item.result_url === 'GENERATOR_STATE'));
    } catch (err) {
      console.error("[HistoryList] UI Load Failure:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const success = await deleteToolHistory(id);
    if (success) {
      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success("Identity record purged");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center opacity-50">
        <History className="h-12 w-12 mb-4" />
        <p className="text-sm font-bold">No Neural History</p>
        <p className="text-xs">Your session records will appear here.</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <ScrollArea className="flex-1 px-4">
        <div className="grid gap-3 py-4">
          {history.map((item) => (
            <div 
              key={item.id}
              onClick={() => {
                onRestore(item.metadata);
              }}
              className="group relative flex items-center gap-4 p-4 bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl cursor-pointer hover:border-primary/40 hover:bg-muted/40 transition-all active:scale-[0.99] animate-in slide-in-from-right-4"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold truncate max-w-[150px] md:max-w-[250px]" title={item.file_name}>
                    {item.file_name}
                  </span>
                </div>
                <div className="flex items-center gap-2 opacity-60">
                   <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-primary">
                     <Clock className="h-3 w-3" />
                     {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                   <div className="h-0.5 w-0.5 rounded-full bg-border" />
                   <span className="text-[8px] font-medium italic">
                      {getTimeRemaining(item.expires_at)}
                   </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => handleDelete(e, item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <ChevronRight className="h-4 w-4 text-primary" />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-6 border-t border-border bg-muted/20">
        <p className="text-[10px] text-center text-muted-foreground/60 uppercase tracking-widest font-black leading-relaxed">
          * Records are automatically purged after 24 hours of inactivity.
        </p>
      </div>
    </div>
  );
}
