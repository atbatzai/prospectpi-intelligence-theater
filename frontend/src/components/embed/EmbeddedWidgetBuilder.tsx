/**
 * Story 7.3: Embedded Widgets & White-label Options
 * 
 * Embeddable intelligence widgets, iframe code generation,
 * customizable branding, responsive embed sizes, CSP-compliant security
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Code, Copy, Monitor, Smartphone, Tablet, Palette, CheckCircle } from 'lucide-react';

type WidgetType = 'dossier-preview' | 'company-search' | 'intelligence-feed';
type WidgetSize = 'small' | 'medium' | 'large';

export const EmbeddedWidgetBuilder: React.FC = () => {
  const [widgetType, setWidgetType] = useState<WidgetType>('dossier-preview');
  const [widgetSize, setWidgetSize] = useState<WidgetSize>('medium');
  const [primaryColor, setPrimaryColor] = useState('#1E3A8A');
  const [showBranding, setShowBranding] = useState(true);
  const [copied, setCopied] = useState(false);

  const generateEmbedCode = () => {
    const sizeMap = {
      small: { width: '400px', height: '300px' },
      medium: { width: '600px', height: '450px' },
      large: { width: '800px', height: '600px' }
    };

    const size = sizeMap[widgetSize];
    const config = {
      type: widgetType,
      primaryColor,
      showBranding
    };

    return `<iframe
  src="https://app.prospectpi.com/embed/${widgetType}?config=${encodeURIComponent(JSON.stringify(config))}"
  width="${size.width}"
  height="${size.height}"
  frameborder="0"
  allow="clipboard-read; clipboard-write"
  sandbox="allow-scripts allow-same-origin allow-popups"
></iframe>`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-detective-primary flex items-center gap-2">
          <Code className="h-6 w-6" />
          Embedded Widget Builder
        </h2>
        <p className="text-gray-600 mt-1">Create embeddable intelligence widgets for your website</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Widget Type */}
          <Card>
            <CardHeader>
              <CardTitle>Widget Type</CardTitle>
              <CardDescription>Choose the type of widget to embed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(['dossier-preview', 'company-search', 'intelligence-feed'] as WidgetType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setWidgetType(type)}
                  className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                    widgetType === type
                      ? 'border-detective-primary bg-detective-primary/5'
                      : 'border-gray-200 hover:border-detective-primary/50'
                  }`}
                >
                  <div className="font-semibold capitalize">
                    {type.replace('-', ' ')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {type === 'dossier-preview' && 'Display company intelligence dossier'}
                    {type === 'company-search' && 'Interactive company search interface'}
                    {type === 'intelligence-feed' && 'Real-time intelligence updates feed'}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Widget Size */}
          <Card>
            <CardHeader>
              <CardTitle>Widget Size</CardTitle>
              <CardDescription>Select responsive dimensions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as WidgetSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setWidgetSize(size)}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      widgetSize === size
                        ? 'border-detective-primary bg-detective-primary/5'
                        : 'border-gray-200 hover:border-detective-primary/50'
                    }`}
                  >
                    <div className="flex justify-center mb-2">
                      {size === 'small' && <Smartphone className="h-5 w-5" />}
                      {size === 'medium' && <Tablet className="h-5 w-5" />}
                      {size === 'large' && <Monitor className="h-5 w-5" />}
                    </div>
                    <div className="text-sm font-medium capitalize">{size}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Customization
              </CardTitle>
              <CardDescription>Brand the widget to match your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Primary Color</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Show ProspectPI Branding</div>
                  <div className="text-sm text-gray-600">Display "Powered by ProspectPI" badge</div>
                </div>
                <input
                  type="checkbox"
                  checked={showBranding}
                  onChange={(e) => setShowBranding(e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Code Output & Preview */}
        <div className="space-y-6">
          {/* Embed Code */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Embed Code</CardTitle>
                <Button onClick={handleCopyCode} size="sm">
                  {copied ? (
                    <><CheckCircle className="h-4 w-4 mr-2 text-green-600" /> Copied!</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-2" /> Copy Code</>
                  )}
                </Button>
              </div>
              <CardDescription>Paste this code into your website HTML</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">
                <code>{generateEmbedCode()}</code>
              </pre>
            </CardContent>
          </Card>

          {/* Widget Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>How your widget will appear</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-4 bg-gray-50">
                <div
                  className="bg-white rounded-lg shadow-lg p-6"
                  style={{
                    borderTop: `4px solid ${primaryColor}`,
                    maxWidth: widgetSize === 'small' ? '400px' : widgetSize === 'medium' ? '600px' : '100%'
                  }}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold" style={{ color: primaryColor }}>
                      {widgetType === 'dossier-preview' && 'Company Intelligence Dossier'}
                      {widgetType === 'company-search' && 'Search Companies'}
                      {widgetType === 'intelligence-feed' && 'Intelligence Feed'}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      Interactive widget content appears here
                    </div>
                    <div className="mt-4 h-32 bg-gray-100 rounded flex items-center justify-center">
                      <Badge variant="outline">Widget Content</Badge>
                    </div>
                    {showBranding && (
                      <div className="mt-4 text-xs text-gray-500">
                        Powered by <span className="font-semibold">ProspectPI</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Info */}
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-4">
              <div className="font-semibold mb-1 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Security Features
              </div>
              <ul className="text-sm text-gray-600 space-y-1 ml-6 list-disc">
                <li>CSP-compliant iframe sandboxing</li>
                <li>XSS protection enabled</li>
                <li>HTTPS-only content delivery</li>
                <li>Rate limiting on embed endpoints</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
