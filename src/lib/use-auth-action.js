'use client';

import { toast } from 'sonner';
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

  const performAction = (action, meta = {}) => {
    if (!user) {
      toast.error('Identity Verification Required', {
        description: `Please Sign In or Create an Account to synchronize assets and perform ${meta.name || 'this action'}.`,
        action: {
          label: 'Authenticate',
          onClick: () => triggerLogin(),
        },
      });
      triggerLogin();
      return false;
    }

    const { type, name } = meta;

    // Execute the action
    action();

    // Show professional success toast
    if (type === 'copy') {
      toast.success('Identity Sequence Copied', {
        description: `Content from "${name || 'Tool'}" has been synchronized to your clipboard.`,
      });
    } else if (type === 'download') {
      toast.success('Assets Dispatched', {
        description: `Files for "${name || 'Tool'}" have been successfully downloaded to your local storage.`,
      });
    }

    return true;
  };

  return { performAction, isAuthenticated: !!user };
}
