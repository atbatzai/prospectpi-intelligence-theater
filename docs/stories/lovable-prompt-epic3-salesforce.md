# Lovable Prompt Extension - Epic 3: Salesforce & Team Collaboration Components

## **COPY THIS ENTIRE PROMPT EXTENSION FOR EPIC 3 COMPONENTS** 📋

---

## **Base Prompt Reference**
**IMPORTANT:** This is an EXTENSION to the base lovable-prompt.md (512 lines). Use the base prompt FIRST, then add these Epic 3 specific components.

**Base Components Already Covered:** Smart Company Input, Agent Progress Theater, CIA Dossier Viewer
**Epic 3 NEW Components:** Salesforce Lightning, Team Collaboration, Slack Integration

---

## **Epic 3 Component Extensions**

### **4. Salesforce Lightning Component - Native CRM Integration** ⚡

Create a **Salesforce Lightning Web Component** that integrates seamlessly into Account pages for 1-click dossier generation:

#### **Lightning Design System Requirements:**
- Use **SLDS (Salesforce Lightning Design System)** styling exclusively
- Lightning icons, colors, spacing, and typography patterns
- Responsive iframe component that works within Salesforce page layouts
- Native Salesforce look and feel - users should feel like it's built by Salesforce

#### **Component Structure:**
```html
<!-- Lightning Component Template -->
<template>
  <lightning-card title="ProspectPI Intelligence Theater" icon-name="custom:custom63">
    <div slot="actions">
      <lightning-button 
        label="Generate Dossier" 
        variant="brand" 
        onclick={handleGenerateDossier}>
      </lightning-button>
    </div>
    
    <!-- Auto-populated form from Account data -->
    <div class="slds-p-horizontal_medium">
      <lightning-input 
        label="Company Name" 
        value={accountName} 
        readonly="true">
      </lightning-input>
      
      <lightning-textarea 
        label="Additional Context (Optional)" 
        placeholder="Any specific research focus for this account..."
        value={contextNotes}>
      </lightning-textarea>
      
      <!-- Mini Agent Progress Theater -->
      <template if:true={isGenerating}>
        <div class="slds-box slds-theme_default slds-m-top_medium">
          <div class="slds-grid slds-gutters">
            <div class="slds-col slds-size_1-of-3">
              <div class="slds-media">
                <div class="slds-media__figure">
                  <lightning-icon icon-name="utility:search" size="small"></lightning-icon>
                </div>
                <div class="slds-media__body">
                  <p class="slds-text-heading_small">Intelligence Coordinator</p>
                  <p class="slds-text-body_small">{coordinatorStatus}</p>
                  <lightning-progress-bar value={coordinatorProgress}></lightning-progress-bar>
                </div>
              </div>
            </div>
            <!-- Repeat for other agents -->
          </div>
        </div>
      </template>
    </div>
  </lightning-card>
</template>
```

#### **Visual Design Requirements:**
- **Seamless Salesforce integration:** Component should look like native Salesforce functionality
- **Account data pre-population:** Automatically pull company name, website, description from Account record
- **Progress indication:** Mini version of Agent Progress Theater optimized for CRM sidebar
- **Action-oriented design:** Clear CTAs that fit Salesforce user workflow patterns

### **5. Team Collaboration Interface - Google Docs Style Sharing** 👥

Create a **team collaboration workspace** with sharing, permissions, and collaborative features:

#### **Sharing Interface Design:**
```typescript
interface TeamSharingProps {
  dossier: IntelligenceDossier;
  currentUser: User;
  organization: Organization;
  onShare: (shareConfig: ShareConfiguration) => void;
}

interface ShareConfiguration {
  users: User[];
  teams: Team[];
  permissions: 'view' | 'comment' | 'edit';
  notifyOnShare: boolean;
  expiresAt?: Date;
}
```

#### **Component Features:**
- **Google Docs-style sharing modal** with user search and role assignment
- **Team workspace view** showing shared dossiers with search and filtering
- **Collaborative annotations** where team members can add notes to specific dossier sections
- **Access control visualization** showing who has access with clear permission levels
- **Activity timeline** showing sharing events, comments, and updates

#### **Visual Design Requirements:**
- **Enterprise collaboration UX:** Clean, professional interface suitable for business teams
- **Permission clarity:** Clear visual indicators for different access levels (view/comment/edit)
- **Mobile-responsive sharing:** Collaboration features work on mobile devices
- **Integration with existing UI:** Shares design language with core Intelligence Theater components

### **6. Slack Integration Components - Rich Card Previews** 💬

Create **Slack bot interfaces** with rich card previews and interactive notifications:

#### **Slack Card Component:**
```typescript
interface SlackDossierCard {
  dossier: IntelligenceDossier;
  sharedBy: User;
  message?: string;
  actions: SlackAction[];
}

interface SlackAction {
  type: 'view_full' | 'add_comment' | 'share_with_team';
  label: string;
  url?: string;
}
```

#### **Slack Integration Features:**
- **Rich dossier previews** with company logo, confidence score, and key insights
- **Interactive buttons** for "View Full Dossier", "Add to CRM", "Share with Team"
- **Notification templates** for dossier completion, sharing, and updates
- **Channel integration** for team dossier sharing and discussion

#### **Visual Design Requirements:**
- **Slack-native design:** Components should feel native to Slack interface
- **Information hierarchy:** Key insights prominently displayed, details available on click
- **Action-oriented design:** Clear CTAs that enable workflow progression within Slack

---

## **Epic 3 Mock Data & Business Context**

### **Salesforce Integration Scenarios:**
- **Account Executive workflow:** Generate dossier for "Snowflake Inc" from Salesforce Account page
- **Opportunity preparation:** Pre-call research for upcoming executive meeting
- **Account planning:** Quarterly account review with intelligence refresh

### **Team Collaboration Scenarios:**
- **Sales team sharing:** Account manager shares Databricks dossier with Solutions Engineer before demo
- **Cross-functional collaboration:** Marketing team shares competitive intelligence with Sales team
- **Manager review:** Sales director reviews team's dossiers for quarterly account planning

### **Slack Integration Scenarios:**
- **Deal room notifications:** "New dossier ready for MongoDB opportunity - confidence 94%"
- **Team updates:** "Sarah shared updated Atlassian intelligence in #enterprise-sales"
- **Campaign coordination:** Marketing shares competitive analysis in #product-marketing

---

## **Epic 3 Technical Implementation Notes**

### **Salesforce Lightning Development:**
- Use **Lightning Web Components (LWC)** framework
- Implement **Connected App** for OAuth integration
- Follow **Salesforce ISV program** requirements for AppExchange distribution
- Support both **Classic and Lightning Experience** interfaces

### **Team Collaboration Backend:**
- Extend existing user/organization models for team permissions
- Implement **role-based access control (RBAC)** for dossier sharing
- Add **activity logging** for collaboration audit trails
- Support **real-time collaboration** with WebSocket updates

### **Slack Integration Architecture:**
- Build **Slack app** with bot capabilities and interactive components
- Implement **OAuth 2.0** for Slack workspace authentication
- Use **Slack Block Kit** for rich card layouts and interactive elements
- Support **Enterprise Grid** for large organization deployments

---

## **Epic 3 Success Criteria**

### **Salesforce Integration:**
- ✅ 1-click dossier generation from any Salesforce Account page
- ✅ Native Lightning Design System compliance
- ✅ Automatic data sync from Account to dossier and back
- ✅ AppExchange readiness for ISV distribution

### **Team Collaboration:**
- ✅ Seamless dossier sharing with role-based permissions
- ✅ Collaborative annotation and commenting system
- ✅ Team workspace with search and organization features
- ✅ Mobile-responsive collaboration interface

### **Slack Integration:**
- ✅ Rich dossier previews with interactive elements
- ✅ Automated notifications for team workflow events
- ✅ Channel-based sharing and discussion features
- ✅ Enterprise Grid support for large organizations

**Use this prompt extension AFTER the base lovable-prompt.md for all Epic 3 Salesforce and team collaboration components! 🚀**