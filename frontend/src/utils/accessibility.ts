/**
 * Story 2.2.2: Accessibility Compliance (WCAG 2.1 AA+)
 * 
 * Comprehensive accessibility utilities for screen readers, keyboard navigation,
 * color contrast, focus management, and ARIA attributes
 */

export interface A11yConfig {
  skipToMainContentEnabled: boolean;
  keyboardNavigationEnabled: boolean;
  screenReaderAnnouncements: boolean;
  highContrastMode: boolean;
  reducedMotion: boolean;
}

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if high contrast mode is enabled
 */
export const prefersHighContrast = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Validate color contrast ratio (WCAG AA requires 4.5:1 for normal text)
 */
export const getContrastRatio = (foreground: string, background: string): number => {
  const getLuminance = (color: string): number => {
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Focus management for keyboard navigation
 */
export class FocusManager {
  private static focusableElements = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ];

  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = this.focusableElements.join(', ');
    return Array.from(container.querySelectorAll(selector));
  }

  static trapFocus(container: HTMLElement): () => void {
    const focusable = this.getFocusableElements(container);
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTab);
    firstFocusable?.focus();

    return () => container.removeEventListener('keydown', handleTab);
  }
}

/**
 * Screen reader announcements
 */
export class ScreenReaderAnnouncer {
  private static liveRegion: HTMLDivElement | null = null;

  static initialize(): void {
    if (typeof document === 'undefined') return;
    if (this.liveRegion) return;

    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    this.liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(this.liveRegion);
  }

  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.initialize();
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.liveRegion) this.liveRegion.textContent = '';
    }, 1000);
  }
}

/**
 * Keyboard shortcuts manager
 */
export class KeyboardShortcuts {
  private static shortcuts = new Map<string, () => void>();

  static register(key: string, callback: () => void, description: string): void {
    this.shortcuts.set(key, callback);
  }

  static handleKeyPress(event: KeyboardEvent): void {
    const key = this.getKeyCombo(event);
    const callback = this.shortcuts.get(key);
    if (callback) {
      event.preventDefault();
      callback();
    }
  }

  private static getKeyCombo(event: KeyboardEvent): string {
    const parts: string[] = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    parts.push(event.key);
    return parts.join('+');
  }
}
