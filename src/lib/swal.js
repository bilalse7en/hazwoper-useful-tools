import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

/**
 * Utility to detect current theme
 */
const getThemeColors = () => {
  const isNebula = document.documentElement.classList.contains('nebula');
  const isDark = document.documentElement.classList.contains('dark');

  if (isNebula) {
    return {
      background: 'rgba(10, 17, 40, 0.95)',
      color: '#f0f9ff',
      confirmButtonColor: '#38bdf8',
      cancelButtonColor: '#ef4444',
      borderColor: '#38bdf844',
      backdrop: 'rgba(0, 5, 20, 0.6) blur(8px)',
    };
  } else if (isDark) {
    return {
      background: 'rgba(23, 23, 23, 0.95)',
      color: '#ffffff',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#f43f5e',
      borderColor: '#ffffff11',
      backdrop: 'rgba(0, 0, 0, 0.75) blur(4px)',
    };
  } else {
    return {
      background: 'rgba(255, 255, 255, 0.98)',
      color: '#0f172a',
      confirmButtonColor: '#0ea5e9',
      cancelButtonColor: '#ef4444',
      borderColor: '#e2e8f0',
      backdrop: 'rgba(15, 23, 42, 0.1) blur(2px)',
    };
  }
};

const getCommonOptions = () => {
  const colors = getThemeColors();
  return {
    background: colors.background,
    color: colors.color,
    backdrop: colors.backdrop,
    buttonsStyling: false,
    customClass: {
      popup:
        'premium-swal-popup border border-[#ffffff11] backdrop-blur-xl rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden',
      title: 'font-orbitron font-black text-2xl tracking-tighter pt-6',
      htmlContainer: 'font-sans font-medium text-muted-foreground opacity-90',
      confirmButton:
        'premium-btn premium-btn-primary mx-2 px-8 py-3 rounded-2xl font-orbitron font-bold uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20',
      cancelButton:
        'premium-btn premium-btn-destructive mx-2 px-8 py-3 rounded-2xl font-orbitron font-bold uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 shadow-lg shadow-destructive/20',
      actions: 'pb-8 gap-4',
      timerProgressBar: 'bg-primary',
    },
    showClass: {
      popup: 'animate__animated animate__zoomIn animate__faster',
    },
    hideClass: {
      popup: 'animate__animated animate__zoomOut animate__faster',
    },
  };
};

/**
 * Custom SweetAlert2 theme-aware helper for Confirmations
 */
export const showConfirm = async (options) => {
  const common = getCommonOptions();
  // Close any existing toasts/alerts for a cleaner flow during confirmation
  Swal.close();

  return MySwal.fire({
    ...common,
    ...options,
    icon: options.icon || 'question',
    showCancelButton:
      options.showCancelButton !== undefined ? options.showCancelButton : true,
    confirmButtonText: options.confirmButtonText || 'Confirm',
    cancelButtonText: options.cancelButtonText || 'Cancel',
  });
};

/**
 * Custom SweetAlert2 theme-aware helper for Alerts
 */
export const showAlert = (title, text, icon = 'info') => {
  const common = getCommonOptions();
  // Ensure only one alert/toast is active
  Swal.close();

  return MySwal.fire({
    ...common,
    title,
    text,
    icon,
    timer: 5000,
    timerProgressBar: true,
  });
};

/**
 * Success Notification (Toast)
 */
export const showSuccess = (title, text) => {
  const message = text ? `${title}: ${text}` : title;
  return showToast(message, 'success');
};

/**
 * Error Notification (Toast)
 */
export const showError = (title, text) => {
  const message = text ? `${title}: ${text}` : title;
  return showToast(message, 'error');
};

/**
 * Custom SweetAlert2 theme-aware helper for Toasts (High Precision Animations)
 */
export const showToast = (message, icon = 'success') => {
  const colors = getThemeColors();

  // Singleton pattern: Close previous toast if active to prevent stacking clutter
  Swal.close();

  const Toast = MySwal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
    background: colors.background,
    color: colors.color,
    showClass: {
      popup: 'animate__animated animate__fadeInRight animate__faster',
    },
    hideClass: {
      popup: 'animate__animated animate__fadeOutRight animate__faster',
    },
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
    customClass: {
      popup:
        'premium-toast-popup backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl m-4',
      title: 'font-orbitron font-bold text-sm tracking-tight px-3',
      timerProgressBar:
        icon === 'success'
          ? 'bg-emerald-500'
          : icon === 'error'
            ? 'bg-rose-500'
            : 'bg-primary',
    },
  });

  return Toast.fire({
    icon,
    title: message,
  });
};

export default MySwal;
