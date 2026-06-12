'use client';

import { showToast, showSuccess, showConfirm } from '@/lib/swal';
import { triggerLogin } from '@/lib/auth';
import { useEffect, useState } from 'react';

export function useAuthAction() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check session storage for user
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        queueMicrotask(() => setUser(JSON.parse(stored)));
      } catch (e) {}
    }
  }, []);

  const performAction = async (action, meta = {}) => {
    if (!user) {
      const result = await showConfirm({
        title: 'Identity Verification Required',
        text: `Please Sign In or Create an Account to synchronize assets and perform ${meta.name || 'this action'}.`,
        icon: 'lock',
        confirmButtonText: 'Authenticate Now',
        cancelButtonText: 'Later',
      });

      if (result.isConfirmed) {
        triggerLogin();
      }
      return false;
    }

    const { type, name } = meta;

    // Execute the action
    await action();

    // Show professional success toast
    if (type === 'copy') {
      showSuccess(
        'Identity Sequence Copied',
        `Content from "${name || 'Tool'}" has been synchronized to your clipboard.`
      );
    } else if (type === 'download') {
      showSuccess(
        'Assets Dispatched',
        `Files for "${name || 'Tool'}" have been successfully downloaded to your local storage.`
      );
    }

    return true;
  };

  return { performAction, isAuthenticated: !!user };
}
