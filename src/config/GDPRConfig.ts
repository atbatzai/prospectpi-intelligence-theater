/**
 * ProspectPI Intelligence Theater - GDPR Configuration
 * Minimal GDPR Compliance Configuration
 */

export interface GDPRConfig {
  dataRetentionDays: number;
  deletionGracePeriodDays: number;
  exportEnabled: boolean;
  consentRequired: boolean;
  regionalProcessing: {
    enabled: boolean;
    regions: ('US' | 'EU' | 'UK' | 'CA')[];
  };
  privacyPolicyVersion: string;
}

export interface RegionalProcessingConfig {
  US: {
    dataCenter: string;
    complianceFramework: 'CCPA' | 'SOC2' | 'GDPR';
  };
  EU: {
    dataCenter: string;
    complianceFramework: 'GDPR';
  };
  UK: {
    dataCenter: string;
    complianceFramework: 'UK-GDPR' | 'GDPR';
  };
  CA: {
    dataCenter: string;
    complianceFramework: 'PIPEDA' | 'GDPR';
  };
}

export class GDPRConfigManager {
  private static instance: GDPRConfigManager;
  
  private config: GDPRConfig = {
    dataRetentionDays: 90,
    deletionGracePeriodDays: 30,
    exportEnabled: true,
    consentRequired: true,
    regionalProcessing: {
      enabled: true,
      regions: ['US', 'EU', 'UK', 'CA']
    },
    privacyPolicyVersion: '1.0.0'
  };

  private regionalConfig: RegionalProcessingConfig = {
    US: {
      dataCenter: 'us-east-1',
      complianceFramework: 'SOC2'
    },
    EU: {
      dataCenter: 'eu-west-1', 
      complianceFramework: 'GDPR'
    },
    UK: {
      dataCenter: 'eu-west-2',
      complianceFramework: 'UK-GDPR'
    },
    CA: {
      dataCenter: 'ca-central-1',
      complianceFramework: 'PIPEDA'
    }
  };

  public static getInstance(): GDPRConfigManager {
    if (!GDPRConfigManager.instance) {
      GDPRConfigManager.instance = new GDPRConfigManager();
    }
    return GDPRConfigManager.instance;
  }

  getConfig(): GDPRConfig {
    return this.config;
  }

  getRegionalConfig(region: 'US' | 'EU' | 'UK' | 'CA') {
    return this.regionalConfig[region];
  }

  isRegionalProcessingRequired(region: string): boolean {
    return ['EU', 'UK'].includes(region);
  }

  getDataRetentionPeriod(): number {
    return this.config.dataRetentionDays;
  }

  getDeletionGracePeriod(): number {
    return this.config.deletionGracePeriodDays;
  }

  shouldEnforceConsent(): boolean {
    return this.config.consentRequired;
  }

  getPrivacyPolicyVersion(): string {
    return this.config.privacyPolicyVersion;
  }
}