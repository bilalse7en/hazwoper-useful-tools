import { supabase } from './supabase';
import { showToast, showSuccess } from '@/lib/swal';

/**
 * Report a user for misbehavior.
 * Rules:
 * - Normal user cannot report Admin.
 * - Admin cannot report Admin.
 */
export async function reportUser(reporter, target, reason) {
  if (!reporter || !target) return;

  // Rule: Untouchable Admins
  if (target.role === 'admin') {
    showToast('Protocol Violation', 'error');
    return false;
  }

  // Rule: Admin immunity
  if (reporter.role === 'admin' && target.role === 'admin') {
    showToast('System Error', 'error');
    return false;
  }

  try {
    const { error } = await supabase.from('user_interactions').insert({
      reporter_id: reporter.id,
      target_id: target.id,
      type: 'report',
      reason,
    });

    if (error) throw error;

    showSuccess(
      'Signal Flagged',
      'Incident report encrypted and sent to intelligence.'
    );
    return true;
  } catch (err) {
    console.error('Reporting error:', err);
    showToast('Transmission Failure', 'error');
    return false;
  }
}

/**
 * Block a user.
 */
export async function blockUser(blocker, target) {
  if (!blocker || !target) return;

  if (target.role === 'admin') {
    showToast('Access Denied', 'error');
    return false;
  }

  try {
    const { error } = await supabase.from('user_interactions').insert({
      reporter_id: blocker.id,
      target_id: target.id,
      type: 'block',
    });

    if (error) throw error;

    showSuccess(
      'Signal Terminated',
      'Communication link with this node has been severed.'
    );
    return true;
  } catch (err) {
    console.error('Blocking error:', err);
    showToast('Link Severance Failed', 'error');
    return false;
  }
}
