/**
 * Utility for dynamically loading PDF.js in browser environment.
 * Uses local project assets with CDN fallback for zero-network-dependency reliability.
 */

let loadingPromise = null;

export function loadPdfJs() {
  if (typeof window === 'undefined') {
    return Promise.reject(
      new Error('PDF.js can only be loaded in browser context')
    );
  }

  if (window.pdfjsLib) {
    return Promise.resolve(window.pdfjsLib);
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    // 1. Primary: load from local /pdfjs/pdf.min.js
    const script = document.createElement('script');
    script.src = '/pdfjs/pdf.min.js';
    script.async = true;

    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          window.location.origin + '/pdfjs/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        fallbackToCdn(resolve, reject);
      }
    };

    script.onerror = () => {
      // 2. Fallback: load from CDN if local script fails
      fallbackToCdn(resolve, reject);
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
}

function fallbackToCdn(resolve, reject) {
  const cdnScript = document.createElement('script');
  cdnScript.src =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  cdnScript.async = true;

  cdnScript.onload = () => {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    } else {
      reject(
        new Error('PDF.js failed to initialize from both local and CDN sources')
      );
    }
  };

  cdnScript.onerror = () => {
    reject(new Error('Failed to load PDF.js script'));
  };

  document.head.appendChild(cdnScript);
}
