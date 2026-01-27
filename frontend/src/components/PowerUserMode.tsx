/**
 * Story 2.3.1: Power User Mode Toggle
 * 
 * Advanced interface options for experienced intelligence analysts
 * with keyboard shortcuts, bulk operations, and advanced filtering
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Zap, 
  Keyboard, 
  Filter, 
  Download, 
  Code,
  Layout,
  Settings
} from 'lucide-react';

interface PowerUserSettings {
  advancedMode: boolean;
  keyboardShortcuts: boolean;
  bulkOperations: boolean;
  advancedFilters: boolean;
  apiAccess: boolean;
  debugMode: boolean;
}

interface PowerUserModeProps {
  onSettingsChange?: (settings: PowerUserSettings) => void;
}

export const PowerUserMode: React.FC<PowerUserModeProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState<PowerUserSettings>({
    advancedMode: false,
    keyboardShortcuts: true,
    bulkOperations: false,
    advancedFilters: false,
    apiAccess: false,
    debugMode: false
  });

  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('powerUserSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleToggle = (key: keyof PowerUserSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    localStorage.setItem('powerUserSettings', JSON.stringify(newSettings));
    onSettingsChange?.(newSettings);
  };

  const shortcuts = [
    { key: 'Ctrl+K', action: 'Quick search' },
    { key: 'Ctrl+N', action: 'New dossier' },
    { key: 'Ctrl+E', action: 'Export current' },
    { key: 'Ctrl+S', action: 'Save draft' },
    { key: 'Ctrl+/', action: 'Show shortcuts' },
    { key: 'Esc', action: 'Close modal' }
  ];

  return (
    <Card className="border-detective-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-detective-secondary" />
          Power User Mode
          {settings.advancedMode && (
            <Badge variant="secondary" className="bg-detective-secondary/10 text-detective-secondary">
              ACTIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Advanced Mode Toggle */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-detective-primary/5 to-detective-secondary/5 rounded-lg">
          <div className="space-y-1">
            <div className="font-semibold text-detective-primary">Advanced Mode</div>
            <div className="text-sm text-gray-600">Enable all power user features</div>
          </div>
          <Switch
            checked={settings.advancedMode}
            onCheckedChange={() => handleToggle('advancedMode')}
          />
        </div>

        {/* Individual Feature Toggles */}
        <div className="space-y-3">
          <FeatureToggle
            icon={<Keyboard className="h-4 w-4" />}
            title="Keyboard Shortcuts"
            description="Navigate with keyboard commands"
            enabled={settings.keyboardShortcuts}
            onToggle={() => handleToggle('keyboardShortcuts')}
            badge={settings.keyboardShortcuts ? '6 shortcuts' : undefined}
          />

          <FeatureToggle
            icon={<Layout className="h-4 w-4" />}
            title="Bulk Operations"
            description="Process multiple dossiers at once"
            enabled={settings.bulkOperations}
            onToggle={() => handleToggle('bulkOperations')}
            disabled={!settings.advancedMode}
          />

          <FeatureToggle
            icon={<Filter className="h-4 w-4" />}
            title="Advanced Filters"
            description="Complex search and filtering"
            enabled={settings.advancedFilters}
            onToggle={() => handleToggle('advancedFilters')}
            disabled={!settings.advancedMode}
          />

          <FeatureToggle
            icon={<Code className="h-4 w-4" />}
            title="API Access"
            description="REST API and webhook integration"
            enabled={settings.apiAccess}
            onToggle={() => handleToggle('apiAccess')}
            disabled={!settings.advancedMode}
          />

          <FeatureToggle
            icon={<Settings className="h-4 w-4" />}
            title="Debug Mode"
            description="Show technical details and logs"
            enabled={settings.debugMode}
            onToggle={() => handleToggle('debugMode')}
            disabled={!settings.advancedMode}
          />
        </div>

        {/* Keyboard Shortcuts Reference */}
        {settings.keyboardShortcuts && (
          <div className="mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="w-full"
            >
              {showShortcuts ? 'Hide' : 'Show'} Keyboard Shortcuts
            </Button>

            {showShortcuts && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 space-y-2"
              >
                {shortcuts.map((shortcut, i) => (
                  <div key={i} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">{shortcut.action}</span>
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface FeatureToggleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  badge?: string;
}

const FeatureToggle: React.FC<FeatureToggleProps> = ({
  icon,
  title,
  description,
  enabled,
  onToggle,
  disabled = false,
  badge
}) => (
  <div className={`flex items-center justify-between p-3 rounded-lg border ${
    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
  }`}>
    <div className="flex items-center gap-3">
      <div className="text-detective-primary">{icon}</div>
      <div>
        <div className="font-medium text-sm flex items-center gap-2">
          {title}
          {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
        </div>
        <div className="text-xs text-gray-600">{description}</div>
      </div>
    </div>
    <Switch
      checked={enabled}
      onCheckedChange={onToggle}
      disabled={disabled}
    />
  </div>
);
