import { supabase } from './supabase';
import { toast } from 'sonner';

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
    toast.error('Protocol Violation', {
      description:
        'Administrative nodes cannot be reported via standard subscriber channels.',
    });
    return false;
  }

  // Rule: Admin immunity
  if (reporter.role === 'admin' && target.role === 'admin') {
    toast.error('System Error', {
      description:
        'Dual administrative conflict detected. Use central council protocols.',
    });
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

    toast.success('Signal Flagged', {
      description:
        'Incident report has been encrypted and sent to central intelligence.',
    });
    return true;
  } catch (err) {
    console.error('Reporting error:', err);
    toast.error('Transmission Failure');
    return false;
  }
}

/**
 * Block a user.
 */
export async function blockUser(blocker, target) {
  if (!blocker || !target) return;

  if (target.role === 'admin') {
    toast.error('Access Denied', {
      description: 'Subscribers cannot block administrative authorized nodes.',
    });
    return false;
  }

  try {
    const { error } = await supabase.from('user_interactions').insert({
      reporter_id: blocker.id,
      target_id: target.id,
      type: 'block',
    });

    if (error) throw error;

    toast.success('Signal Terminated', {
      description: 'Direct communication link with this node has been severed.',
    });
    return true;
  } catch (err) {
    console.error('Blocking error:', err);
    toast.error('Link Severance Failed');
    return false;
  }
}
