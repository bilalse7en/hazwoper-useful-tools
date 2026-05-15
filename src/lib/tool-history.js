"use client";

import { supabase } from "./supabase";

/**
 * Tool History Manager
 * Handles CRUD operations for Image Converter & Video Compressor history
 * Records auto-expire after 24 hours (enforced by Supabase)
 */

// Save a tool usage record
export async function saveToolHistory({ toolType, fileName, fileSize, outputFormat, outputSize, reductionPercent, resultUrl, metadata = {} }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // For generator tools, we often want to update the "latest" state rather than adding new rows every second
  // But for simple tools like image/video, we just insert.
  
  const { data, error } = await supabase
    .from('tool_history')
    .insert({
      user_id: user.id,
      tool_type: toolType,
      file_name: fileName,
      file_size: fileSize,
      output_format: outputFormat || null,
      output_size: outputSize || 0,
      reduction_percent: reductionPercent || 0,
      result_url: resultUrl || null,
      metadata: metadata,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('[ToolHistory] Save error:', error);
    return null;
  }
  return data;
}

/**
 * Specifically for Generators: Save/Update the most recent session state
 */
export async function saveGeneratorState(toolType, stateData, fileName = 'Generator Session') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // We save generator states as tool_history entries with result_url = 'GENERATOR_STATE'
  // and content in metadata
  const { data, error } = await supabase
    .from('tool_history')
    .insert({
      user_id: user.id,
      tool_type: toolType,
      file_name: fileName || stateData.fileName || 'Generator Session',
      result_url: 'GENERATOR_STATE',
      metadata: stateData,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('[ToolHistory] State save error:', error);
    return null;
  }
  return data;
}

/**
 * Get the most recent generator state
 */
export async function getLatestGeneratorState(toolType) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('tool_history')
    .select('*')
    .eq('user_id', user.id)
    .eq('tool_type', toolType)
    .eq('result_url', 'GENERATOR_STATE')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.metadata;
}

// Fetch user's tool history (only non-expired)
export async function getToolHistory(toolType = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('tool_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (toolType) {
    query = query.eq('tool_type', toolType);
  }

  let { data, error } = await query.gt('expires_at', new Date().toISOString());
  
  // FALLBACK: If expires_at or created_at column is missing (42703), try a simple fetch
  if (error && error.code === '42703') {
    const fallback = await supabase
      .from('tool_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('tool_type', toolType);
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error('[ToolHistory] Fetch error:', error);
    return [];
  }
  return data || [];
}

// Delete a single history record
export async function deleteToolHistory(id) {
  const { error } = await supabase
    .from('tool_history')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[ToolHistory] Delete error:', error);
    return false;
  }
  return true;
}

// Calculate time remaining string
export function getTimeRemaining(expiresAt) {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires - now;

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}

// Format file size
export function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
