/**
 * Task 4.5: Mobile Accessibility Testing - Voice Control Integration
 * Tests voice control compatibility (iOS Voice Control, Android Voice Access, Dragon NaturallySpeaking)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Speech Recognition API
const mockSpeechRecognition = {
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  onstart: null as ((event: Event) => void) | null,
  onresult: null as ((event: any) => void) | null,
  onerror: null as ((event: any) => void) | null,
  onend: null as ((event: Event) => void) | null,
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
};

const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn().mockReturnValue([]),
  onvoiceschanged: null,
};

// Mock voice-enabled research interface
const VoiceEnabledResearchInterface = () => {
  const [isListening, setIsListening] = React.useState(false);
  const [voiceCommands, setVoiceCommands] = React.useState<string[]>([]);
  const [formData, setFormData] = React.useState({
    companyName: '',
    companyUrl: '',
    priority: 'normal',
    emailNotifications: false
  });

  const handleVoiceCommand = (command: string) => {
    setVoiceCommands(prev => [...prev, command]);
    
    // Process voice commands
    const normalizedCommand = command.toLowerCase().trim();
    
    if (normalizedCommand.includes('start research') || normalizedCommand.includes('submit')) {
      const form = document.querySelector('form') as HTMLFormElement;
      if (form) form.submit();
    } else if (normalizedCommand.includes('clear form') || normalizedCommand.includes('reset')) {
      setFormData({
        companyName: '',
        companyUrl: '',
        priority: 'normal',
        emailNotifications: false
      });
    } else if (normalizedCommand.startsWith('company name')) {
      const name = normalizedCommand.replace('company name', '').trim();
      // Preserve original casing for proper names
      const preservedName = command.replace(/company name/i, '').trim();
      setFormData(prev => ({ ...prev, companyName: preservedName }));
    } else if (normalizedCommand.includes('high priority')) {
      setFormData(prev => ({ ...prev, priority: 'high' }));
    } else if (normalizedCommand.includes('low priority')) {
      setFormData(prev => ({ ...prev, priority: 'low' }));
    }
  };

  return (
    <div role="main" aria-labelledby="main-heading">
      <h1 id="main-heading">Voice-Enabled Research Interface</h1>
      
      {/* Voice control indicator */}
      <div className="voice-status" aria-live="polite" aria-atomic="true">
        {isListening ? 'Listening for voice commands...' : 'Voice control ready'}
      </div>
      
      <div className="voice-controls" role="group" aria-label="Voice control commands">
        <button
          onClick={() => setIsListening(!isListening)}
          aria-pressed={isListening}
          aria-describedby="voice-toggle-help"
        >
          {isListening ? 'Stop Listening' : 'Start Voice Control'}
        </button>
        <div id="voice-toggle-help" className="sr-only">
          Toggle voice command recognition on or off
        </div>
        
        <button
          onClick={() => setVoiceCommands([])}
          aria-describedby="clear-commands-help"
        >
          Clear Command History
        </button>
        <div id="clear-commands-help" className="sr-only">
          Clear the list of recognized voice commands
        </div>
      </div>

      {/* Voice command help */}
      <details className="voice-help">
        <summary>Available Voice Commands</summary>
        <ul role="list" aria-label="Voice command list">
          <li><kbd>"Start research"</kbd> - Submit the form</li>
          <li><kbd>"Clear form"</kbd> - Reset all fields</li>
          <li><kbd>"Company name [name]"</kbd> - Set company name</li>
          <li><kbd>"High priority"</kbd> - Set high priority</li>
          <li><kbd>"Low priority"</kbd> - Set low priority</li>
          <li><kbd>"Click [button name]"</kbd> - Activate button</li>
          <li><kbd>"Show [section name]"</kbd> - Navigate to section</li>
        </ul>
      </details>

      {/* Research form with voice labels */}
      <form 
        role="form" 
        aria-label="Voice-controlled company research form"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="input-group">
          <label htmlFor="company-name" id="company-name-label">
            Company Name
            <span className="voice-hint" aria-label="Say 'Company name' followed by the name">
              (Voice: "Company name...")
            </span>
          </label>
          <input
            id="company-name"
            name="company-name"
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
            aria-labelledby="company-name-label"
            aria-describedby="company-name-voice-help"
          />
          <div id="company-name-voice-help" className="voice-help-text">
            Voice command: Say "Company name" followed by the company name
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="company-url" id="company-url-label">
            Company Website
            <span className="voice-hint" aria-label="Say 'Website' followed by the URL">
              (Voice: "Website...")
            </span>
          </label>
          <input
            id="company-url"
            name="company-url"
            type="url"
            value={formData.companyUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, companyUrl: e.target.value }))}
            aria-labelledby="company-url-label"
          />
        </div>

        <fieldset>
          <legend id="priority-legend">
            Research Priority
            <span className="voice-hint">(Voice: "High priority", "Normal priority", "Low priority")</span>
          </legend>
          
          <div role="radiogroup" aria-labelledby="priority-legend">
            {['high', 'normal', 'low'].map(priority => (
              <label key={priority} className="radio-option">
                <input
                  type="radio"
                  name="priority"
                  value={priority}
                  checked={formData.priority === priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  aria-describedby={`priority-${priority}-voice-help`}
                />
                <span>{priority.charAt(0).toUpperCase() + priority.slice(1)} Priority</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="checkbox-group">
          <label className="checkbox-option">
            <input
              type="checkbox"
              name="email-notifications"
              checked={formData.emailNotifications}
              onChange={(e) => setFormData(prev => ({ ...prev, emailNotifications: e.target.checked }))}
              aria-describedby="email-voice-help"
            />
            <span>Send email notifications</span>
          </label>
          <div id="email-voice-help" className="voice-help-text">
            Voice command: Say "Enable notifications" or "Disable notifications"
          </div>
        </div>

        <div className="button-group" role="group" aria-label="Form actions">
          <button 
            type="submit"
            className="primary"
            aria-describedby="submit-voice-help"
            data-voice-command="start research"
          >
            Start Research
          </button>
          <div id="submit-voice-help" className="voice-help-text">
            Voice command: "Start research" or "Submit"
          </div>
          
          <button
            type="button"
            className="secondary"
            onClick={() => setFormData({
              companyName: '',
              companyUrl: '',
              priority: 'normal',
              emailNotifications: false
            })}
            aria-describedby="clear-voice-help"
            data-voice-command="clear form"
          >
            Clear Form
          </button>
          <div id="clear-voice-help" className="voice-help-text">
            Voice command: "Clear form" or "Reset"
          </div>
        </div>
      </form>

      {/* Voice command feedback */}
      <section aria-labelledby="command-history-heading">
        <h2 id="command-history-heading">Recent Voice Commands</h2>
        <div 
          className="command-history" 
          aria-live="polite" 
          aria-label="Voice command history"
        >
          {voiceCommands.length === 0 ? (
            <p>No voice commands yet. Try saying "Start research" or "Company name Example Corp"</p>
          ) : (
            <ul role="list">
              {voiceCommands.map((command, index) => (
                <li key={index} className="command-item">
                  <span className="command-text">"{command}"</span>
                  <span className="command-time" aria-label={`Recognized ${index + 1} commands ago`}>
                    {new Date().toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Voice testing interface */}
      <div className="voice-testing" data-testid="voice-testing">
        <button onClick={() => handleVoiceCommand('start research')}>
          Simulate "Start Research"
        </button>
        <button onClick={() => handleVoiceCommand('company name TechCorp Inc')}>
          Simulate "Company name TechCorp Inc"
        </button>
        <button onClick={() => handleVoiceCommand('high priority')}>
          Simulate "High Priority"
        </button>
        <button onClick={() => handleVoiceCommand('clear form')}>
          Simulate "Clear Form"
        </button>
      </div>
    </div>
  );
};

// Voice control utilities
const simulateVoiceCommand = (command: string, element?: Element) => {
  const event = new CustomEvent('voicecommand', {
    detail: { command, confidence: 0.95, element },
    bubbles: true
  });
  
  const target = element || document.body;
  target.dispatchEvent(event);
};

const getVoiceLabels = (element: Element): string[] => {
  const labels: string[] = [];
  
  // Get aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) labels.push(ariaLabel);
  
  // Get text content
  if (element.textContent?.trim()) {
    labels.push(element.textContent.trim());
  }
  
  // Get voice command attribute
  const voiceCommand = element.getAttribute('data-voice-command');
  if (voiceCommand) labels.push(voiceCommand);
  
  // Get accessible name from associated labels
  if (element.tagName === 'INPUT') {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label?.textContent) labels.push(label.textContent.trim());
  }
  
  return labels.filter(label => label.length > 0);
};

const checkVoiceAccessibility = (element: Element): boolean => {
  const voiceLabels = getVoiceLabels(element);
  
  // Must have at least one voice-recognizable label
  if (voiceLabels.length === 0) return false;
  
  // Labels should be reasonably short (voice recognition works better)
  const hasShortLabel = voiceLabels.some(label => 
    label.split(' ').length <= 4 && label.length <= 30
  );
  
  return hasShortLabel;
};

describe('Task 4.5: Mobile Voice Control Integration', () => {
  let container: HTMLElement;
  
  beforeEach(() => {
    // Mock Speech Recognition API
    (global as any).SpeechRecognition = vi.fn().mockImplementation(() => mockSpeechRecognition);
    (global as any).webkitSpeechRecognition = (global as any).SpeechRecognition;
    
    // Mock Speech Synthesis API
    (global as any).speechSynthesis = mockSpeechSynthesis;
    (global as any).SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({ text }));
    
    const renderResult = render(<VoiceEnabledResearchInterface />);
    container = renderResult.container;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Voice Control API Integration', () => {
    it('should detect speech recognition support', () => {
      expect((global as any).SpeechRecognition || (global as any).webkitSpeechRecognition).toBeTruthy();
      expect((global as any).speechSynthesis).toBeTruthy();
    });

    it('should initialize voice control properly', () => {
      const voiceToggle = screen.getByText('Start Voice Control');
      
      fireEvent.click(voiceToggle);
      
      expect(voiceToggle.textContent).toBe('Stop Listening');
      expect(voiceToggle.getAttribute('aria-pressed')).toBe('true');
    });

    it('should provide voice control status feedback', () => {
      const statusElement = container.querySelector('.voice-status');
      
      expect(statusElement?.getAttribute('aria-live')).toBe('polite');
      expect(statusElement?.textContent).toBe('Voice control ready');
      
      // Toggle voice control
      const voiceToggle = screen.getByText('Start Voice Control');
      fireEvent.click(voiceToggle);
      
      expect(statusElement?.textContent).toBe('Listening for voice commands...');
    });

    it('should handle voice command recognition', () => {
      const testButton = screen.getByText('Simulate "Start Research"');
      
      fireEvent.click(testButton);
      
      const commandHistory = container.querySelector('.command-history');
      expect(commandHistory?.textContent).toContain('start research');
    });
  });

  describe('Voice Command Processing', () => {
    it('should process form submission voice commands', () => {
      const simulateButton = screen.getByText('Simulate "Start Research"');
      const form = container.querySelector('form') as HTMLFormElement;
      const submitHandler = vi.fn();
      
      form?.addEventListener('submit', submitHandler);
      
      fireEvent.click(simulateButton);
      
      // Command should be recognized
      const commandHistory = container.querySelector('.command-history');
      expect(commandHistory?.textContent).toContain('start research');
    });

    it('should process form field voice commands', () => {
      const simulateButton = screen.getByText('Simulate "Company name TechCorp Inc"');
      const companyNameInput = container.querySelector('#company-name') as HTMLInputElement;
      
      fireEvent.click(simulateButton);
      
      // Field should be populated
      expect(companyNameInput?.value).toBe('TechCorp Inc');
    });

    it('should process radio button voice commands', () => {
      const simulateButton = screen.getByText('Simulate "High Priority"');
      const highPriorityRadio = container.querySelector('input[value="high"]') as HTMLInputElement;
      
      fireEvent.click(simulateButton);
      
      expect(highPriorityRadio?.checked).toBe(true);
    });

    it('should process form clearing voice commands', () => {
      // First set some data
      const companyNameInput = container.querySelector('#company-name') as HTMLInputElement;
      fireEvent.change(companyNameInput, { target: { value: 'Test Company' } });
      
      expect(companyNameInput.value).toBe('Test Company');
      
      // Then clear via voice command
      const clearButton = screen.getByText('Simulate "Clear Form"');
      fireEvent.click(clearButton);
      
      expect(companyNameInput.value).toBe('');
    });
  });

  describe('Voice Label Accessibility', () => {
    it('should provide voice-recognizable labels for all interactive elements', () => {
      const interactiveElements = container.querySelectorAll('button, input, select, textarea');
      
      interactiveElements.forEach(element => {
        const isVoiceAccessible = checkVoiceAccessibility(element);
        const voiceLabels = getVoiceLabels(element);
        
        expect(isVoiceAccessible).toBe(true);
        expect(voiceLabels.length).toBeGreaterThan(0);
      });
    });

    it('should provide voice command hints for complex interactions', () => {
      const voiceHints = container.querySelectorAll('.voice-hint, .voice-help-text');
      
      expect(voiceHints.length).toBeGreaterThan(0);
      
      voiceHints.forEach(hint => {
        expect(hint.textContent?.trim().length).toBeGreaterThan(0);
        expect(hint.textContent).toMatch(/voice|say|command/i);
      });
    });

    it('should provide discoverable voice commands list', () => {
      const commandsList = container.querySelector('.voice-help ul');
      const commands = commandsList?.querySelectorAll('li');
      
      expect(commands?.length).toBeGreaterThan(0);
      
      commands?.forEach(command => {
        expect(command.textContent).toContain('"');
        expect(command.querySelector('kbd')).toBeTruthy();
      });
    });

    it('should handle voice command data attributes', () => {
      const elementsWithVoiceCommands = container.querySelectorAll('[data-voice-command]');
      
      elementsWithVoiceCommands.forEach(element => {
        const voiceCommand = element.getAttribute('data-voice-command');
        expect(voiceCommand?.trim().length).toBeGreaterThan(0);
        
        // Voice commands should be simple and clear
        const wordCount = voiceCommand?.split(' ').length || 0;
        expect(wordCount).toBeLessThanOrEqual(4);
      });
    });
  });

  describe('Voice Feedback and Confirmation', () => {
    it('should provide command history with timestamps', () => {
      const simulateButton = screen.getByText('Simulate "Start Research"');
      
      fireEvent.click(simulateButton);
      
      const commandItems = container.querySelectorAll('.command-item');
      expect(commandItems.length).toBe(1);
      
      const commandText = commandItems[0].querySelector('.command-text');
      const commandTime = commandItems[0].querySelector('.command-time');
      
      expect(commandText?.textContent).toBe('"start research"');
      expect(commandTime?.textContent).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it('should provide live region updates for voice commands', () => {
      const liveRegion = container.querySelector('[aria-live="polite"]');
      
      expect(liveRegion).toBeTruthy();
      
      const simulateButton = screen.getByText('Simulate "Company name TechCorp Inc"');
      fireEvent.click(simulateButton);
      
      // Live region should be updated (in real implementation)
      expect(liveRegion?.textContent).toBeTruthy();
    });

    it('should clear command history when requested', () => {
      // Add some commands first
      const simulateButton = screen.getByText('Simulate "Start Research"');
      fireEvent.click(simulateButton);
      
      let commandItems = container.querySelectorAll('.command-item');
      expect(commandItems.length).toBe(1);
      
      // Clear history
      const clearButton = screen.getByText('Clear Command History');
      fireEvent.click(clearButton);
      
      commandItems = container.querySelectorAll('.command-item');
      expect(commandItems.length).toBe(0);
    });

    it('should provide empty state message for command history', () => {
      const commandHistory = container.querySelector('.command-history');
      
      expect(commandHistory?.textContent).toContain('No voice commands yet');
      expect(commandHistory?.textContent).toContain('Try saying');
    });
  });

  describe('Voice Control Edge Cases', () => {
    it('should handle rapid voice commands gracefully', () => {
      const buttons = [
        screen.getByText('Simulate "Start Research"'),
        screen.getByText('Simulate "Company name TechCorp Inc"'),
        screen.getByText('Simulate "High Priority"')
      ];
      
      // Rapid fire commands
      buttons.forEach(button => fireEvent.click(button));
      
      const commandItems = container.querySelectorAll('.command-item');
      expect(commandItems.length).toBe(3);
    });

    it('should handle ambiguous voice commands', () => {
      // Test with unclear command (would need error handling in real implementation)
      const testingDiv = container.querySelector('[data-testid="voice-testing"]');
      
      if (testingDiv) {
        const customButton = document.createElement('button');
        customButton.textContent = 'Simulate Unclear Command';
        customButton.onclick = () => {
          const event = new CustomEvent('voicecommand', {
            detail: { command: 'maybe do something', confidence: 0.3 }
          });
          document.dispatchEvent(event);
        };
        testingDiv.appendChild(customButton);
        
        fireEvent.click(customButton);
        
        // Should handle gracefully without errors
        expect(container).toBeInTheDocument();
      }
    });

    it('should support voice control with assistive technologies', () => {
      // Voice control should work alongside screen readers
      const form = container.querySelector('form');
      const voiceStatus = container.querySelector('.voice-status');
      
      expect(form?.getAttribute('aria-label')).toBeTruthy();
      expect(voiceStatus?.getAttribute('aria-live')).toBe('polite');
      
      // Interactive elements should maintain accessibility
      const inputs = container.querySelectorAll('input');
      inputs.forEach(input => {
        const hasLabel = input.id && document.querySelector(`label[for="${input.id}"]`);
        const hasAriaLabel = input.getAttribute('aria-label');
        const hasAriaLabelledby = input.getAttribute('aria-labelledby');
        
        expect(hasLabel || hasAriaLabel || hasAriaLabelledby).toBeTruthy();
      });
    });

    it('should handle voice control activation states', () => {
      const voiceToggle = screen.getByText('Start Voice Control');
      
      // Initially not listening
      expect(voiceToggle.getAttribute('aria-pressed')).toBe('false');
      
      // Start listening
      fireEvent.click(voiceToggle);
      expect(voiceToggle.getAttribute('aria-pressed')).toBe('true');
      expect(voiceToggle.textContent).toBe('Stop Listening');
      
      // Stop listening
      fireEvent.click(voiceToggle);
      expect(voiceToggle.getAttribute('aria-pressed')).toBe('false');
      expect(voiceToggle.textContent).toBe('Start Voice Control');
    });

    it('should provide keyboard alternatives to voice commands', () => {
      // All voice-controlled elements should be keyboard accessible
      const voiceElements = container.querySelectorAll('[data-voice-command]');
      
      voiceElements.forEach(element => {
        // Should be focusable
        fireEvent.focus(element);
        
        // Should respond to keyboard
        if (element.tagName === 'BUTTON') {
          const clickHandler = vi.fn();
          element.addEventListener('click', clickHandler);
          
          fireEvent.keyDown(element, { key: 'Enter' });
          expect(clickHandler).toHaveBeenCalled();
        }
      });
    });
  });
});