/**
 * Raw Intelligence Page - BMad Option 3
 * Route: /dashboard/raw-intelligence
 */
import { RawIntelligenceViewer } from '@/components/raw-intelligence/RawIntelligenceViewer';

export default function RawIntelligencePage() {
  return <RawIntelligenceViewer />;
}

export const metadata = {
  title: 'Raw Intelligence Vault | ProspectPI',
  description: 'View 100% raw data from each source before synthesis',
};
