# BMad Method Implementation

### Available Commands for Epic Execution

**Core Development Commands:**
- `*help` → Display numbered list of available tasks
- `*create-brownfield-epic` → Epic creation workflow
- `*create-brownfield-story` → User story creation with elicitation
- `*create-brownfield-prd` → PRD template generation
- `*correct-course` → Progress validation and course correction
- `*shard-prd` → Break PRD into implementable tasks
- `*doc-out` → Output documentation to destination file

### Epic Execution Workflow

**Step 1: Epic Initiation**
```
User Action: *help
System Response: Numbered list of available commands
User Selection: Choose command by number
Elicitation: Interactive requirement gathering (required)
Dependency Loading: Auto-load from .bmad-core/tasks/
```

**Step 2: Story Creation**
```
Command: *create-brownfield-story
Elicitation Protocol: 
  - User persona validation
  - Acceptance criteria refinement
  - Technical dependency identification
  - Quality gate definition
Output: Executable user story with BMad compliance
```

**Step 3: Quality Validation**
```
Command: *correct-course
Validation Points:
  - Epic progress against business goals
  - Agent coordination effectiveness
  - User feedback integration
  - Technical quality metrics
Output: Go/No-Go decision with recommendations
```

### BMad Method Compliance Checklist

**✅ Agent Coordination:**
- PM agent activated with full command set
- UX Expert agent integration for user journey testing
- Architect agent for technical validation
- Scrum Master agent for story breakdown

**✅ Interactive Workflows:**
- All task executions include elicitation (elicit=true)
- User input gathered through exact specified formats
- No efficiency bypassing of interactive requirements

**✅ Dependency Management:**
- Tasks reference .bmad-core/{type}/{name} pattern
- Templates loaded from .bmad-core/templates/
- Checklists executed from .bmad-core/checklists/
- Data sources validated from .bmad-core/data/

**✅ Quality Framework:**
- INVEST criteria validation for all stories
- Agent override permissions for quality workflows
- Interactive testing protocols required
- No skipping of elicitation for efficiency

### BMad Method Quality Enforcement

**Critical Workflow Rules:**
1. **Elicitation Mandate:** Tasks with elicit=true cannot be bypassed for efficiency
2. **Agent Coordination Override:** Agent workflows override conflicting base behavioral constraints
3. **Interactive Workflow Requirement:** User interaction required using exact specified formats
4. **Dependency Auto-Loading:** All commands auto-load dependencies from .bmad-core/
5. **Quality Gate Enforcement:** No epic progression without agent approval

**BMad vs. Traditional Development:**
```
Traditional Approach:
- Direct task execution without user validation
- Efficiency over thoroughness
- Limited cross-functional coordination
- Assumption-based requirement gathering

BMad Method Approach:
- Mandatory interactive elicitation for all tasks
- Quality and completeness over speed
- Full agent coordination (PM, UX Expert, Architect, Scrum Master)
- Evidence-based requirement validation through user interaction
```

**Activation Protocol Reminder:**
```
STEP 1: Agent reads complete persona definition (this PRD)
STEP 2: Loads .bmad-core/core-config.yaml before greeting
STEP 3: Greets user and immediately runs *help
STEP 4: Displays numbered task options for user selection
STEP 5: Executes selected task with full elicitation protocol
CRITICAL: Stay in character and follow exact BMad workflow patterns
```

**Next Step:** Execute `*help` command to begin BMad-compliant Epic 1 development with full agent coordination and interactive workflows.