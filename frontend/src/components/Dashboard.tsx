'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SmartCompanyInput } from '@/components/intelligence-theater/SmartCompanyInput';
import { AgentProgressTheater } from '@/components/intelligence-theater/AgentProgressTheater';
import { DossierViewer } from '@/components/intelligence-theater/DossierViewer';
// ProspectPI Research Input Interface
interface ProspectResearchInput {
  companyName: string;
  companyUrl?: string;
  linkedinUrl?: string;
  crmNotes?: string;
  organizationFocus?: string;
  locationOfInterest?: string;
  contextLinks?: string[];
  additionalContext?: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDossier, setCurrentDossier] = useState(null);
  const [selectedSections, setSelectedSections] = useState(new Set());

  const handleStartGeneration = async (input: ProspectResearchInput) => {
    setIsGenerating(true);
    console.log('Starting intelligence generation:', input);
  };

  const handleSectionToggle = (sectionId: string) => {
    const newSections = new Set(selectedSections);
    if (newSections.has(sectionId)) {
      newSections.delete(sectionId);
    } else {
      newSections.add(sectionId);
    }
    setSelectedSections(newSections);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 intelligence-theater-mobile">
        <div className="text-center px-4 mobile-typography">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            ProspectPI Intelligence Theater
          </h1>
          <p className="text-gray-600 text-sm md:text-base">Please log in to access the intelligence dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 intelligence-theater-mobile mobile-typography">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:py-6 mobile-stack md:flex-row">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">Intelligence Theater</h1>
            <button 
              onClick={logout} 
              className="mobile-button mobile-touch-target text-gray-600 hover:text-gray-900 focus-visible:outline-none mobile-focus-visible"
              aria-label="Sign out of Intelligence Theater"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-4 md:py-6 px-4 mobile-scroll-container">
        <SmartCompanyInput onGenerate={handleStartGeneration} isGenerating={isGenerating} />
      </main>
    </div>
  );
}
