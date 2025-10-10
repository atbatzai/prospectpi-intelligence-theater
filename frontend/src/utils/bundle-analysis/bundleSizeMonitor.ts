/**
 * Task 5.2: Bundle Size Monitor
 * Real-time bundle size tracking against performance budgets
 */

export interface BundleMetrics {
  totalSize: number;
  chunks: ChunkInfo[];
  performanceBudgets: PerformanceBudgetViolations;
  recommendations: string[];
}

export interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  modules: string[];
  isEpic: boolean;
  epicCategory?: 'auth' | 'intelligence' | 'mobile' | 'vendor';
}

export interface PerformanceBudgetViolations {
  mobile: BudgetStatus;
  tablet: BudgetStatus; 
  desktop: BudgetStatus;
}

interface BudgetStatus {
  limit: number;
  actual: number;
  isViolation: boolean;
  violationPercentage?: number;
}

/**
 * Performance budgets from Task 0 Performance Budget document
 */
const PERFORMANCE_BUDGETS = {
  mobile: {
    total: 200 * 1024, // 200KB
    individual: 50 * 1024, // 50KB per chunk
    epic: 75 * 1024 // 75KB per epic
  },
  tablet: {
    total: 300 * 1024, // 300KB
    individual: 75 * 1024, // 75KB per chunk
    epic: 100 * 1024 // 100KB per epic
  },
  desktop: {
    total: 500 * 1024, // 500KB
    individual: 100 * 1024, // 100KB per chunk
    epic: 150 * 1024 // 150KB per epic
  }
};

export class BundleSizeMonitor {
  private static instance: BundleSizeMonitor;
  
  static getInstance(): BundleSizeMonitor {
    if (!BundleSizeMonitor.instance) {
      BundleSizeMonitor.instance = new BundleSizeMonitor();
    }
    return BundleSizeMonitor.instance;
  }

  /**
   * Analyze bundle metrics from Next.js build output
   */
  analyzeBundleMetrics(buildStats: any): BundleMetrics {
    const chunks = this.extractChunkInfo(buildStats);
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const performanceBudgets = this.checkPerformanceBudgets(chunks, totalSize);
    const recommendations = this.generateRecommendations(chunks, performanceBudgets);

    return {
      totalSize,
      chunks,
      performanceBudgets,
      recommendations
    };
  }

  /**
   * Extract chunk information from build stats
   */
  private extractChunkInfo(buildStats: any): ChunkInfo[] {
    const chunks: ChunkInfo[] = [];
    
    if (buildStats.chunks) {
      buildStats.chunks.forEach((chunk: any) => {
        const chunkInfo: ChunkInfo = {
          name: chunk.names?.[0] || chunk.id || 'unknown',
          size: chunk.size || 0,
          gzippedSize: this.estimateGzippedSize(chunk.size || 0),
          modules: chunk.modules?.map((m: any) => m.name || m.identifier) || [],
          isEpic: this.isEpicChunk(chunk.names?.[0] || ''),
          epicCategory: this.getEpicCategory(chunk.names?.[0] || '')
        };
        chunks.push(chunkInfo);
      });
    }

    return chunks.sort((a, b) => b.size - a.size); // Sort by size descending
  }

  /**
   * Check if chunk belongs to an epic
   */
  private isEpicChunk(chunkName: string): boolean {
    const epicPatterns = ['auth-epic', 'intelligence-epic', 'mobile-epic', 'vendors', 'radix-ui', 'lucide-icons'];
    return epicPatterns.some(pattern => chunkName.includes(pattern));
  }

  /**
   * Get epic category for chunk
   */
  private getEpicCategory(chunkName: string): 'auth' | 'intelligence' | 'mobile' | 'vendor' | undefined {
    if (chunkName.includes('auth')) return 'auth';
    if (chunkName.includes('intelligence')) return 'intelligence';
    if (chunkName.includes('mobile')) return 'mobile';
    if (chunkName.includes('vendor') || chunkName.includes('radix') || chunkName.includes('lucide')) return 'vendor';
    return undefined;
  }

  /**
   * Estimate gzipped size (approximately 30% of original size)
   */
  private estimateGzippedSize(originalSize: number): number {
    return Math.round(originalSize * 0.3);
  }

  /**
   * Check performance budgets for all device types
   */
  private checkPerformanceBudgets(chunks: ChunkInfo[], totalSize: number): PerformanceBudgetViolations {
    return {
      mobile: this.checkBudgetForDevice('mobile', chunks, totalSize),
      tablet: this.checkBudgetForDevice('tablet', chunks, totalSize), 
      desktop: this.checkBudgetForDevice('desktop', chunks, totalSize)
    };
  }

  /**
   * Check budget for specific device type
   */
  private checkBudgetForDevice(device: 'mobile' | 'tablet' | 'desktop', chunks: ChunkInfo[], totalSize: number): BudgetStatus {
    const budget = PERFORMANCE_BUDGETS[device];
    const isViolation = totalSize > budget.total;
    
    return {
      limit: budget.total,
      actual: totalSize,
      isViolation,
      violationPercentage: isViolation ? ((totalSize - budget.total) / budget.total) * 100 : undefined
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(chunks: ChunkInfo[], budgets: PerformanceBudgetViolations): string[] {
    const recommendations: string[] = [];
    
    // Check for large chunks
    const largeChunks = chunks.filter(chunk => chunk.size > PERFORMANCE_BUDGETS.mobile.epic);
    if (largeChunks.length > 0) {
      recommendations.push(
        `Large chunks detected: ${largeChunks.map(c => `${c.name} (${this.formatSize(c.size)})`).join(', ')}. Consider further code splitting.`
      );
    }

    // Check for budget violations
    if (budgets.mobile.isViolation) {
      recommendations.push(
        `Mobile budget exceeded by ${budgets.mobile.violationPercentage?.toFixed(1)}%. Consider lazy loading or reducing bundle size.`
      );
    }

    // Check for duplicate dependencies
    const vendorChunks = chunks.filter(c => c.epicCategory === 'vendor');
    if (vendorChunks.length > 3) {
      recommendations.push(
        'Multiple vendor chunks detected. Consider optimizing package imports and tree-shaking.'
      );
    }

    // Epic-specific recommendations
    const epicSizes = this.getEpicSizes(chunks);
    Object.entries(epicSizes).forEach(([epic, size]) => {
      if (size > PERFORMANCE_BUDGETS.mobile.epic) {
        recommendations.push(
          `${epic} epic is ${this.formatSize(size)}. Consider lazy loading components within this epic.`
        );
      }
    });

    return recommendations;
  }

  /**
   * Get total sizes for each epic
   */
  private getEpicSizes(chunks: ChunkInfo[]): Record<string, number> {
    const epicSizes: Record<string, number> = {};
    
    chunks.forEach(chunk => {
      if (chunk.isEpic && chunk.epicCategory) {
        epicSizes[chunk.epicCategory] = (epicSizes[chunk.epicCategory] || 0) + chunk.size;
      }
    });
    
    return epicSizes;
  }

  /**
   * Format bytes to human readable string
   */
  private formatSize(bytes: number): string {
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)}KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(1)}MB`;
  }

  /**
   * Log bundle analysis results
   */
  logAnalysis(metrics: BundleMetrics): void {
    console.log('\n🔍 Bundle Size Analysis Results');
    console.log('=====================================');
    
    console.log(`📦 Total Bundle Size: ${this.formatSize(metrics.totalSize)}`);
    
    // Performance budget status
    console.log('\n📱 Performance Budget Status:');
    Object.entries(metrics.performanceBudgets).forEach(([device, status]) => {
      const emoji = status.isViolation ? '❌' : '✅';
      const violation = status.violationPercentage ? ` (+${status.violationPercentage.toFixed(1)}%)` : '';
      console.log(`  ${emoji} ${device}: ${this.formatSize(status.actual)} / ${this.formatSize(status.limit)}${violation}`);
    });
    
    // Top chunks
    console.log('\n📊 Top Chunks:');
    metrics.chunks.slice(0, 10).forEach((chunk, index) => {
      const epic = chunk.isEpic ? ` [${chunk.epicCategory}]` : '';
      console.log(`  ${index + 1}. ${chunk.name}: ${this.formatSize(chunk.size)}${epic}`);
    });
    
    // Recommendations
    if (metrics.recommendations.length > 0) {
      console.log('\n💡 Optimization Recommendations:');
      metrics.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
  }

  /**
   * Check if bundle meets performance requirements
   */
  meetsPerformanceRequirements(metrics: BundleMetrics): boolean {
    return !metrics.performanceBudgets.mobile.isViolation;
  }
}

export default BundleSizeMonitor;