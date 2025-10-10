import { create } from 'zustand';
import { AgentProgress, DossierData, DeviceCapabilities, WebSocketPerformanceBudget } from '@/types';
import { detectDeviceCapabilities } from '@/lib/utils';

interface IntelligenceState {
  // Current research request
  currentRequestId: string | null;
  isGenerating: boolean;
  
  // Agent progress
  agentProgress: AgentProgress[];
  canInterrupt: boolean;
  estimatedCompletion: number;
  
  // Dossier data
  currentDossier: DossierData | null;
  dossierHistory: DossierData[];
  
  // UI state
  selectedSections: Set<string>;
  
  // Actions
  setCurrentRequest: (requestId: string | null) => void;
  setGenerating: (isGenerating: boolean) => void;
  updateAgentProgress: (progress: AgentProgress[]) => void;
  setCanInterrupt: (canInterrupt: boolean) => void;
  setEstimatedCompletion: (time: number) => void;
  setCurrentDossier: (dossier: DossierData | null) => void;
  addToDossierHistory: (dossier: DossierData) => void;
  toggleSection: (sectionId: string) => void;
  resetState: () => void;
}

const initialState = {
  currentRequestId: null,
  isGenerating: false,
  agentProgress: [],
  canInterrupt: false,
  estimatedCompletion: 0,
  currentDossier: null,
  dossierHistory: [],
  selectedSections: new Set<string>(),
};

export const useIntelligenceStore = create<IntelligenceState>((set, get) => ({
  ...initialState,

  setCurrentRequest: (requestId) => set({ currentRequestId: requestId }),
  
  setGenerating: (isGenerating) => set({ isGenerating }),
  
  updateAgentProgress: (progress) => set({ agentProgress: progress }),
  
  setCanInterrupt: (canInterrupt) => set({ canInterrupt }),
  
  setEstimatedCompletion: (estimatedCompletion) => set({ estimatedCompletion }),
  
  setCurrentDossier: (currentDossier) => {
    set({ currentDossier });
    if (currentDossier) {
      // Auto-expand executive summary section
      const expandedSections = new Set(['executive-summary']);
      set({ selectedSections: expandedSections });
    }
  },
  
  addToDossierHistory: (dossier) => {
    const { dossierHistory } = get();
    set({ 
      dossierHistory: [dossier, ...dossierHistory.slice(0, 9)] // Keep last 10
    });
  },
  
  toggleSection: (sectionId) => {
    const { selectedSections } = get();
    const newSections = new Set(selectedSections);
    
    if (newSections.has(sectionId)) {
      newSections.delete(sectionId);
    } else {
      newSections.add(sectionId);
    }
    
    set({ selectedSections: newSections });
  },
  
  resetState: () => set(initialState),
}));

/**
 * Task 0.4: Adaptive Performance Architecture Store
 * Central state management for mobile performance optimization
 */
interface PerformanceStore {
  deviceCapabilities: DeviceCapabilities | null
  performanceBudget: WebSocketPerformanceBudget
  isPerformanceOptimized: boolean
  animationsEnabled: boolean
  updateFrequency: number
  
  // Actions
  initializePerformanceDetection: () => Promise<void>
  updatePerformanceSettings: (capabilities: DeviceCapabilities) => void
  setAnimationsEnabled: (enabled: boolean) => void
  getOptimalUpdateFrequency: () => number
}

export const usePerformanceStore = create<PerformanceStore>((set, get) => ({
  deviceCapabilities: null,
  performanceBudget: {
    maxUpdateFrequency: {
      mobile3G: 500,
      mobile4G: 250,
      tablet: 100,
      desktop: 50,
    },
    maxConnections: {
      mobile: 1,
      tablet: 1,
      desktop: 3,
    },
    batchingThreshold: {
      mobile: 3,
      tablet: 2,
      desktop: 1,
    },
  },
  isPerformanceOptimized: false,
  animationsEnabled: true,
  updateFrequency: 100,

  initializePerformanceDetection: async () => {
    const capabilities = await detectDeviceCapabilities();
    set({ deviceCapabilities: capabilities });
    get().updatePerformanceSettings(capabilities);
  },

  updatePerformanceSettings: (capabilities: DeviceCapabilities) => {
    const { performanceBudget } = get();
    let updateFrequency: number;
    let animationsEnabled = !capabilities.reducedMotion;
    
    // Determine optimal update frequency based on device
    if (capabilities.connectionQuality === '2G' || capabilities.performanceTier === 'low') {
      updateFrequency = performanceBudget.maxUpdateFrequency.mobile3G;
      animationsEnabled = false;
    } else if (capabilities.connectionQuality === '3G') {
      updateFrequency = performanceBudget.maxUpdateFrequency.mobile3G;
    } else if (capabilities.performanceTier === 'medium') {
      updateFrequency = performanceBudget.maxUpdateFrequency.mobile4G;
    } else {
      updateFrequency = performanceBudget.maxUpdateFrequency.desktop;
    }

    set({ 
      updateFrequency,
      animationsEnabled: animationsEnabled && !capabilities.batteryOptimization,
      isPerformanceOptimized: true
    });
  },

  setAnimationsEnabled: (enabled: boolean) => set({ animationsEnabled: enabled }),

  getOptimalUpdateFrequency: () => {
    const { deviceCapabilities, performanceBudget } = get();
    if (!deviceCapabilities) return performanceBudget.maxUpdateFrequency.desktop;
    
    if (deviceCapabilities.performanceTier === 'low' || deviceCapabilities.connectionQuality === '2G') {
      return performanceBudget.maxUpdateFrequency.mobile3G;
    } else if (deviceCapabilities.connectionQuality === '3G') {
      return performanceBudget.maxUpdateFrequency.mobile3G;
    } else if (deviceCapabilities.performanceTier === 'medium') {
      return performanceBudget.maxUpdateFrequency.tablet;
    } else {
      return performanceBudget.maxUpdateFrequency.desktop;
    }
  },
}));