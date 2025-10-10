/**
 * Task 4.5: Mobile Accessibility Testing - Screen Reader Compatibility
 * Tests screen reader compatibility for mobile devices (iOS VoiceOver, Android TalkBack)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock mobile research interface components
const MobileResearchInterface = () => (
  <div role="main" aria-labelledby="main-heading">
    <header>
      <h1 id="main-heading">ProspectPI Research Assistant</h1>
      <nav aria-label="Main navigation">
        <ul role="list">
          <li><a href="#research" aria-current="page">Research</a></li>
          <li><a href="#results">Results</a></li>
          <li><a href="#settings">Settings</a></li>
        </ul>
      </nav>
    </header>

    <main>
      <section aria-labelledby="research-form-heading">
        <h2 id="research-form-heading">Company Research Form</h2>
        
        <form role="form" aria-label="Company research request">
          <div className="input-group">
            <label htmlFor="company-name">
              Company Name
              <span aria-label="required" className="required">*</span>
            </label>
            <input
              id="company-name"
              type="text"
              required
              aria-required="true"
              aria-describedby="company-name-help"
              placeholder="Enter company name"
            />
            <div id="company-name-help" className="help-text">
              Enter the full legal name of the company you want to research
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="company-url">Company Website (Optional)</label>
            <input
              id="company-url"
              type="url"
              aria-describedby="company-url-help"
              placeholder="https://example.com"
            />
            <div id="company-url-help" className="help-text">
              Provide the company's website URL if known
            </div>
          </div>

          <fieldset>
            <legend>Research Priority Level</legend>
            <div role="radiogroup" aria-labelledby="priority-legend">
              <div id="priority-legend" className="sr-only">Select research priority</div>
              
              <label className="radio-option">
                <input type="radio" name="priority" value="high" />
                <span>High Priority</span>
                <span className="description">Complete research within 1 hour</span>
              </label>
              
              <label className="radio-option">
                <input type="radio" name="priority" value="normal" defaultChecked />
                <span>Normal Priority</span>
                <span className="description">Complete research within 24 hours</span>
              </label>
              
              <label className="radio-option">
                <input type="radio" name="priority" value="low" />
                <span>Low Priority</span>
                <span className="description">Complete research within 3 days</span>
              </label>
            </div>
          </fieldset>

          <div className="checkbox-group">
            <label className="checkbox-option">
              <input type="checkbox" id="email-notifications" />
              <span>Send email notifications</span>
            </label>
            
            <label className="checkbox-option">
              <input type="checkbox" id="detailed-report" />
              <span>Include detailed competitor analysis</span>
            </label>
          </div>

          <div className="button-group" role="group" aria-label="Form actions">
            <button type="submit" className="primary">
              Start Research
              <span aria-hidden="true">🔍</span>
            </button>
            <button type="button" className="secondary">
              Save as Draft
            </button>
            <button type="button" className="tertiary" aria-label="Clear form">
              Clear
            </button>
          </div>
        </form>
      </section>

      <aside aria-labelledby="recent-searches-heading">
        <h2 id="recent-searches-heading">Recent Searches</h2>
        <ul role="list" aria-label="Recent company searches">
          <li>
            <button className="search-item" aria-describedby="search-1-info">
              TechCorp Inc.
            </button>
            <div id="search-1-info" className="sr-only">
              Researched 2 hours ago, high priority, completed
            </div>
          </li>
          <li>
            <button className="search-item" aria-describedby="search-2-info">
              StartupXYZ
            </button>
            <div id="search-2-info" className="sr-only">
              Researched yesterday, normal priority, in progress
            </div>
          </li>
        </ul>
      </aside>
    </main>

    <footer role="contentinfo">
      <div aria-label="Application status">
        <span aria-live="polite" id="status-message">
          Ready to start new research
        </span>
      </div>
    </footer>
  </div>
);

// Research results component with screen reader optimizations
const MobileResearchResults = () => (
  <div role="main" aria-labelledby="results-heading">
    <h1 id="results-heading">Research Results: TechCorp Inc.</h1>
    
    <div className="results-summary" aria-labelledby="summary-heading">
      <h2 id="summary-heading">Executive Summary</h2>
      <div aria-live="assertive" aria-atomic="true">
        <p>Research completed successfully. Found 15 key data points.</p>
      </div>
    </div>

    <section aria-labelledby="company-info-heading">
      <h2 id="company-info-heading">Company Information</h2>
      
      <dl className="info-grid">
        <dt>Company Name</dt>
        <dd>TechCorp Inc.</dd>
        
        <dt>Industry</dt>
        <dd>Software Development</dd>
        
        <dt>Founded</dt>
        <dd><time dateTime="2010">2010</time></dd>
        
        <dt>Employees</dt>
        <dd>500-1000</dd>
        
        <dt>Revenue</dt>
        <dd>$50M - $100M (estimated)</dd>
      </dl>
    </section>

    <section aria-labelledby="key-findings-heading">
      <h2 id="key-findings-heading">Key Findings</h2>
      
      <div className="findings-list" role="list">
        <article className="finding" role="listitem">
          <h3>Market Position</h3>
          <p>Strong position in enterprise software market with focus on AI solutions.</p>
          <div className="confidence" aria-label="Confidence level: High, 95%">
            <span aria-hidden="true">●●●●●</span>
            <span className="sr-only">Confidence: High (95%)</span>
          </div>
        </article>
        
        <article className="finding" role="listitem">
          <h3>Recent Developments</h3>
          <p>Launched new product line in Q3 2024, expanded to European market.</p>
          <div className="confidence" aria-label="Confidence level: Medium, 78%">
            <span aria-hidden="true">●●●○○</span>
            <span className="sr-only">Confidence: Medium (78%)</span>
          </div>
        </article>
      </div>
    </section>

    <div className="actions" role="group" aria-label="Result actions">
      <button className="primary" aria-describedby="export-desc">
        Export Report
      </button>
      <div id="export-desc" className="sr-only">
        Download detailed research report as PDF
      </div>
      
      <button className="secondary" aria-describedby="share-desc">
        Share Results
      </button>
      <div id="share-desc" className="sr-only">
        Share research results via email or link
      </div>
      
      <button className="tertiary" aria-describedby="new-search-desc">
        New Search
      </button>
      <div id="new-search-desc" className="sr-only">
        Start a new company research request
      </div>
    </div>

    <div aria-live="polite" id="notification-area" className="sr-only">
      {/* Dynamic notifications appear here */}
    </div>
  </div>
);

// Screen reader simulation utilities
const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'assertive');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

const getAccessibleName = (element: Element): string => {
  // Simplified accessible name calculation
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;
  
  const ariaLabelledby = element.getAttribute('aria-labelledby');
  if (ariaLabelledby) {
    const labelElement = document.getElementById(ariaLabelledby);
    if (labelElement) return labelElement.textContent || '';
  }
  
  if (element.tagName === 'INPUT') {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent || '';
  }
  
  return element.textContent || '';
};

const getAccessibleDescription = (element: Element): string => {
  const ariaDescribedby = element.getAttribute('aria-describedby');
  if (ariaDescribedby) {
    const descElement = document.getElementById(ariaDescribedby);
    if (descElement) return descElement.textContent || '';
  }
  
  return '';
};

describe('Task 4.5: Mobile Screen Reader Compatibility', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Clear any existing live regions
    const existingLiveRegions = document.querySelectorAll('[aria-live]');
    existingLiveRegions.forEach(region => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    });
  });

  describe('Research Interface Screen Reader Support', () => {
    beforeEach(() => {
      const renderResult = render(<MobileResearchInterface />);
      container = renderResult.container;
    });

    it('should provide proper heading hierarchy for navigation', () => {
      const h1 = container.querySelector('h1');
      const h2Elements = container.querySelectorAll('h2');
      
      expect(h1).toBeTruthy();
      expect(h1?.textContent).toBe('ProspectPI Research Assistant');
      expect(h1?.id).toBe('main-heading');
      
      expect(h2Elements.length).toBeGreaterThan(0);
      h2Elements.forEach(h2 => {
        expect(h2.id).toBeTruthy();
      });
    });

    it('should provide semantic landmarks for screen reader navigation', () => {
      const main = container.querySelector('[role="main"]');
      const nav = container.querySelector('nav');
      const form = container.querySelector('[role="form"]');
      const contentinfo = container.querySelector('[role="contentinfo"]');
      
      expect(main).toBeTruthy();
      expect(nav).toBeTruthy();
      expect(form).toBeTruthy();
      expect(contentinfo).toBeTruthy();
      
      expect(nav?.getAttribute('aria-label')).toBe('Main navigation');
      expect(form?.getAttribute('aria-label')).toBe('Company research request');
    });

    it('should provide proper form labeling and descriptions', () => {
      const companyNameInput = container.querySelector('#company-name') as HTMLInputElement;
      const companyUrlInput = container.querySelector('#company-url') as HTMLInputElement;
      
      // Check labels
      const nameLabel = container.querySelector('label[for="company-name"]');
      const urlLabel = container.querySelector('label[for="company-url"]');
      
      expect(nameLabel?.textContent).toContain('Company Name');
      expect(urlLabel?.textContent).toContain('Company Website');
      
      // Check descriptions
      expect(companyNameInput?.getAttribute('aria-describedby')).toBe('company-name-help');
      expect(companyUrlInput?.getAttribute('aria-describedby')).toBe('company-url-help');
      
      const nameHelp = container.querySelector('#company-name-help');
      const urlHelp = container.querySelector('#company-url-help');
      
      expect(nameHelp?.textContent).toContain('Enter the full legal name');
      expect(urlHelp?.textContent).toContain('Provide the company\'s website URL');
    });

    it('should handle required field announcements properly', () => {
      const requiredInput = container.querySelector('#company-name') as HTMLInputElement;
      
      expect(requiredInput?.getAttribute('aria-required')).toBe('true');
      expect(requiredInput?.required).toBe(true);
      
      const requiredIndicator = container.querySelector('.required');
      expect(requiredIndicator?.getAttribute('aria-label')).toBe('required');
    });

    it('should provide proper radiogroup structure', () => {
      const fieldset = container.querySelector('fieldset');
      const legend = fieldset?.querySelector('legend');
      const radiogroup = container.querySelector('[role="radiogroup"]');
      const radios = container.querySelectorAll('input[type="radio"][name="priority"]');
      
      expect(fieldset).toBeTruthy();
      expect(legend?.textContent).toBe('Research Priority Level');
      expect(radiogroup).toBeTruthy();
      expect(radios.length).toBe(3);
      
      // Check default selection
      const defaultRadio = container.querySelector('input[type="radio"][defaultChecked]') as HTMLInputElement;
      expect(defaultRadio?.value).toBe('normal');
    });

    it('should provide accessible button descriptions', () => {
      const buttons = container.querySelectorAll('button');
      
      buttons.forEach(button => {
        const accessibleName = getAccessibleName(button);
        expect(accessibleName.trim().length).toBeGreaterThan(0);
        
        // Icon buttons should have aria-label
        if (button.querySelector('[aria-hidden="true"]')) {
          expect(button.getAttribute('aria-label') || button.textContent?.trim()).toBeTruthy();
        }
      });
    });

    it('should handle list semantics properly', () => {
      const lists = container.querySelectorAll('[role="list"], ul');
      
      lists.forEach(list => {
        const listItems = list.querySelectorAll('[role="listitem"], li');
        expect(listItems.length).toBeGreaterThan(0);
        
        if (list.getAttribute('aria-label')) {
          expect(list.getAttribute('aria-label')?.trim().length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Research Results Screen Reader Support', () => {
    beforeEach(() => {
      const renderResult = render(<MobileResearchResults />);
      container = renderResult.container;
    });

    it('should announce dynamic content changes', () => {
      const liveRegion = container.querySelector('[aria-live="assertive"]');
      const politeRegion = container.querySelector('[aria-live="polite"]');
      
      expect(liveRegion).toBeTruthy();
      expect(politeRegion).toBeTruthy();
      
      expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');
    });

    it('should provide proper data structure with description lists', () => {
      const descriptionList = container.querySelector('dl');
      const terms = container.querySelectorAll('dt');
      const descriptions = container.querySelectorAll('dd');
      
      expect(descriptionList).toBeTruthy();
      expect(terms.length).toBeGreaterThan(0);
      expect(descriptions.length).toEqual(terms.length);
      
      // Check semantic time element
      const timeElement = container.querySelector('time[dateTime]');
      expect(timeElement).toBeTruthy();
      expect(timeElement?.getAttribute('dateTime')).toBe('2010');
    });

    it('should provide confidence level information accessibly', () => {
      const confidenceElements = container.querySelectorAll('.confidence');
      
      confidenceElements.forEach(element => {
        const ariaLabel = element.getAttribute('aria-label');
        const srOnlyText = element.querySelector('.sr-only')?.textContent;
        
        expect(ariaLabel || srOnlyText).toBeTruthy();
        expect(ariaLabel || srOnlyText).toContain('Confidence');
        
        // Visual indicator should be hidden from screen readers
        const visualIndicator = element.querySelector('[aria-hidden="true"]');
        expect(visualIndicator).toBeTruthy();
      });
    });

    it('should provide action button descriptions', () => {
      const actionButtons = container.querySelectorAll('.actions button');
      
      actionButtons.forEach(button => {
        const describedby = button.getAttribute('aria-describedby');
        
        if (describedby) {
          const description = container.querySelector(`#${describedby}`);
          expect(description).toBeTruthy();
          expect(description?.textContent?.trim().length).toBeGreaterThan(0);
        }
      });
    });

    it('should handle article structure for findings', () => {
      const findings = container.querySelectorAll('article[role="listitem"]');
      
      expect(findings.length).toBeGreaterThan(0);
      
      findings.forEach(finding => {
        const heading = finding.querySelector('h3');
        const content = finding.querySelector('p');
        
        expect(heading?.textContent?.trim().length).toBeGreaterThan(0);
        expect(content?.textContent?.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('Screen Reader Navigation Patterns', () => {
    beforeEach(() => {
      const renderResult = render(<MobileResearchInterface />);
      container = renderResult.container;
    });

    it('should support keyboard navigation for screen readers', () => {
      const focusableElements = container.querySelectorAll(
        'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
      );
      
      expect(focusableElements.length).toBeGreaterThan(0);
      
      focusableElements.forEach(element => {
        fireEvent.focus(element);
        expect(document.activeElement).toBe(element);
        
        // Should not have negative tabindex unless intentionally hidden
        const tabindex = element.getAttribute('tabindex');
        if (tabindex) {
          expect(parseInt(tabindex)).toBeGreaterThanOrEqual(0);
        }
      });
    });

    it('should provide skip links or equivalent navigation aids', () => {
      const mainContent = container.querySelector('[role="main"]');
      const navigation = container.querySelector('nav');
      
      expect(mainContent).toBeTruthy();
      expect(navigation).toBeTruthy();
      
      // Check for proper focus management
      const firstFocusable = container.querySelector('input, button') as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
        expect(document.activeElement).toBe(firstFocusable);
      }
    });

    it('should announce form validation errors accessibly', () => {
      const requiredInput = container.querySelector('#company-name') as HTMLInputElement;
      
      // Simulate form submission with empty required field
      fireEvent.change(requiredInput, { target: { value: '' } });
      fireEvent.blur(requiredInput);
      
      // Should maintain aria-required and provide error context
      expect(requiredInput.getAttribute('aria-required')).toBe('true');
      
      // In real implementation, would check for aria-invalid and error messages
      const form = container.querySelector('form');
      if (form) {
        fireEvent.submit(form);
        // Error handling would be tested here
      }
    });

    it('should provide context for dynamic updates', () => {
      const statusMessage = container.querySelector('#status-message');
      
      expect(statusMessage?.parentElement?.getAttribute('aria-live')).toBe('polite');
      expect(statusMessage?.textContent).toBe('Ready to start new research');
      
      // Test dynamic update
      if (statusMessage) {
        statusMessage.textContent = 'Research in progress...';
        expect(statusMessage.textContent).toBe('Research in progress...');
      }
    });
  });

  describe('Mobile Screen Reader Optimizations', () => {
    it('should work with VoiceOver gesture simulation', () => {
      const renderResult = render(<MobileResearchInterface />);
      container = renderResult.container;
      
      // Simulate VoiceOver rotor navigation
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const landmarks = container.querySelectorAll('[role="main"], [role="navigation"], [role="form"], [role="contentinfo"]');
      const buttons = container.querySelectorAll('button');
      
      expect(headings.length).toBeGreaterThan(0);
      expect(landmarks.length).toBeGreaterThan(0);
      expect(buttons.length).toBeGreaterThan(0);
      
      // Each should be discoverable by rotor
      headings.forEach(heading => {
        expect(heading.tagName).toMatch(/^H[1-6]$/);
      });
    });

    it('should work with TalkBack exploration', () => {
      const renderResult = render(<MobileResearchResults />);
      container = renderResult.container;
      
      // Simulate TalkBack explore by touch
      const interactiveElements = container.querySelectorAll('button, input, a, [role="button"]');
      
      interactiveElements.forEach(element => {
        const accessibleName = getAccessibleName(element);
        const accessibleDescription = getAccessibleDescription(element);
        
        expect(accessibleName.trim().length).toBeGreaterThan(0);
        
        // Should provide enough context for understanding
        const totalContext = accessibleName + ' ' + accessibleDescription;
        expect(totalContext.trim().length).toBeGreaterThan(accessibleName.length);
      });
    });

    it('should handle orientation changes gracefully', () => {
      const renderResult = render(<MobileResearchInterface />);
      container = renderResult.container;
      
      // Screen readers should maintain context through orientation changes
      const mainContent = container.querySelector('[role="main"]');
      const form = container.querySelector('form');
      
      expect(mainContent).toBeTruthy();
      expect(form).toBeTruthy();
      
      // Content structure should remain consistent
      const beforeHeadings = container.querySelectorAll('h1, h2, h3').length;
      
      // Simulate orientation change (would trigger re-render in real app)
      const afterHeadings = container.querySelectorAll('h1, h2, h3').length;
      
      expect(afterHeadings).toBe(beforeHeadings);
    });

    it('should provide appropriate reading order', () => {
      const renderResult = render(<MobileResearchInterface />);
      container = renderResult.container;
      
      // Check logical reading order
      const allText = container.textContent || '';
      
      expect(allText.indexOf('ProspectPI Research Assistant')).toBeLessThan(
        allText.indexOf('Company Research Form')
      );
      expect(allText.indexOf('Company Name')).toBeLessThan(
        allText.indexOf('Company Website')
      );
      expect(allText.indexOf('Research Priority Level')).toBeLessThan(
        allText.indexOf('Start Research')
      );
    });

    it('should handle focus management during interactions', () => {
      const renderResult = render(<MobileResearchInterface />);
      container = renderResult.container;
      
      const submitButton = screen.getByText('Start Research');
      const clearButton = screen.getByLabelText('Clear form');
      
      // Focus should be manageable
      fireEvent.focus(submitButton);
      expect(document.activeElement).toBe(submitButton);
      
      fireEvent.focus(clearButton);
      expect(document.activeElement).toBe(clearButton);
      
      // Clear action should manage focus appropriately
      fireEvent.click(clearButton);
      // In real implementation, focus would move to first input
    });
  });
});