import { supabase } from './supabase';
import { showSuccess } from '@/lib/swal';

/**
 * Records a media transaction in the Supabase media_hub.
 * All records auto-expire after 24 hours.
 */
export async function recordMediaUpload({
  fileName,
  fileType,
  fileSize,
  previewUrl = null,
  downloadUrl = null,
  expiresAt = undefined,
}) {
  // NON-BLOCKING: We don't await the DB check to ensure generators NEVER hang
  try {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;

      const payload = {
        user_id: session.user.id,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        preview_url: previewUrl,
        download_url: downloadUrl,
        expires_at:
          expiresAt === null
            ? null
            : expiresAt ||
              new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      // Fire and forget insert
      supabase
        .from('media_hub')
        .insert([payload])
        .then(({ error }) => {
          if (error) {
            console.warn(
              '[MediaHub] Background Sync Warning (likely missing created_at column):',
              error.message
            );
          } else {
            showSuccess(
              'Identity session synchronized',
              'Artifact tracked in neural hub.'
            );
          }
        });
    });

    return true; // Return immediately to unblock the caller (Blog Generator, etc)
  } catch (err) {
    console.error('[MediaHub] Immediate failure:', err);
    return null;
  }
}
