// Mobile optimization utilities and responsive design hooks

import { useEffect, useState } from 'react';

/**
 * Hook to detect mobile device and screen size
 */
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        setIsMobile(true);
        setScreenSize('mobile');
      } else if (width < 1024) {
        setIsMobile(false);
        setScreenSize('tablet');
      } else {
        setIsMobile(false);
        setScreenSize('desktop');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, screenSize };
}

/**
 * Hook for responsive navigation state
 */
export function useNavigationState() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const { isMobile } = useMobile();

  useEffect(() => {
    if (!isMobile) {
      setIsNavigationOpen(false);
    }
  }, [isMobile]);

  return {
    isNavigationOpen,
    setIsNavigationOpen,
    toggleNavigation: () => setIsNavigationOpen(!isNavigationOpen)
  };
}

/**
 * Hook for touch gestures on mobile
 */
export function useTouchGestures() {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > 50 && Math.abs(distanceY) < 100;
    const isRightSwipe = distanceX < -50 && Math.abs(distanceY) < 100;
    const isUpSwipe = distanceY > 50 && Math.abs(distanceX) < 100;
    const isDownSwipe = distanceY < -50 && Math.abs(distanceX) < 100;

    return {
      isLeftSwipe,
      isRightSwipe,
      isUpSwipe,
      isDownSwipe,
      distanceX,
      distanceY
    };
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    touchStart,
    touchEnd
  };
}

/**
 * Hook for keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const alt = event.altKey;
      const shift = event.shiftKey;

      let shortcutKey = '';
      if (ctrl) shortcutKey += 'ctrl+';
      if (alt) shortcutKey += 'alt+';
      if (shift) shortcutKey += 'shift+';
      shortcutKey += key;

      if (shortcuts[shortcutKey]) {
        event.preventDefault();
        shortcuts[shortcutKey]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * Hook for infinite scroll
 */
export function useInfiniteScroll(
  callback: () => void,
  hasMore: boolean,
  threshold: number = 100
) {
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - threshold &&
        hasMore
      ) {
        callback();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, hasMore, threshold]);
}

/**
 * Hook for virtual scrolling (performance optimization for large lists)
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }
  };
}

/**
 * Utility classes for mobile optimization
 */
export const mobileOptimizations = {
  // Touch-friendly sizing
  touchTarget: 'min-h-[44px] min-w-[44px]',
  
  // Safe area handling for iOS
  safeArea: {
    top: 'pt-safe-top',
    bottom: 'pb-safe-bottom',
    left: 'pl-safe-left',
    right: 'pr-safe-right'
  },
  
  // Responsive text sizes
  text: {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl'
  },
  
  // Responsive spacing
  spacing: {
    xs: 'p-2 sm:p-3',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-12'
  },
  
  // Mobile-specific layouts
  layout: {
    stack: 'flex flex-col',
    stackMobile: 'flex flex-col lg:flex-row',
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    gridMobile: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
  },
  
  // Mobile navigation
  navigation: {
    drawer: 'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform lg:translate-x-0',
    overlay: 'fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden',
    toggle: 'lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-600'
  }
};

/**
 * Mobile-optimized form validation
 */
export function useMobileFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: any, rules: any) => {
    // Add mobile-specific validation logic
    const fieldErrors: string[] = [];
    
    if (rules.required && (!value || value.toString().trim() === '')) {
      fieldErrors.push('Ce champ est obligatoire');
    }
    
    if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      fieldErrors.push('Email invalide');
    }
    
    if (rules.phone && value && !/^(\+33|0)[1-9](\d{8})$/.test(value.replace(/\s/g, ''))) {
      fieldErrors.push('Numéro de téléphone invalide');
    }
    
    if (rules.minLength && value && value.length < rules.minLength) {
      fieldErrors.push(`Minimum ${rules.minLength} caractères`);
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: fieldErrors[0] || ''
    }));
    
    return fieldErrors.length === 0;
  };

  const markTouched = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  return {
    errors,
    touched,
    validateField,
    markTouched,
    isValid: Object.values(errors).every(error => !error)
  };
}

/**
 * PWA utilities
 */
export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;
    
    const result = await installPrompt.prompt();
    setInstallPrompt(null);
    setIsInstallable(false);
    
    return result.outcome === 'accepted';
  };

  return {
    isInstallable,
    installApp,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches
  };
}

/**
 * Accessibility utilities for mobile
 */
export function useA11y() {
  const [isVoiceOverActive, setIsVoiceOverActive] = useState(false);
  const [fontSize, setFontSize] = useState('normal');

  useEffect(() => {
    // Detect screen reader
    const detectScreenReader = () => {
      setIsVoiceOverActive(
        'speechSynthesis' in window && 
        window.speechSynthesis.getVoices().length > 0
      );
    };

    detectScreenReader();
    
    // Detect user font size preference
    const detectFontSize = () => {
      const testElement = document.createElement('div');
      testElement.style.fontSize = '1rem';
      testElement.style.position = 'absolute';
      testElement.style.visibility = 'hidden';
      document.body.appendChild(testElement);
      
      const size = window.getComputedStyle(testElement).fontSize;
      document.body.removeChild(testElement);
      
      const sizeValue = parseFloat(size);
      if (sizeValue > 18) {
        setFontSize('large');
      } else if (sizeValue > 16) {
        setFontSize('medium');
      } else {
        setFontSize('normal');
      }
    };

    detectFontSize();
  }, []);

  return {
    isVoiceOverActive,
    fontSize,
    announceToScreenReader: (message: string) => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.textContent = message;
      
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    }
  };
}
