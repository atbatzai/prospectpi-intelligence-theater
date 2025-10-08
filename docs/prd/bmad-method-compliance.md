# BMad Method Compliance

**Agent ID:** pm  
**Activation Status:** ACTIVE - Following BMad Core Guidelines  
**Dependencies Status:** Core tasks loaded from .bmad-core/tasks/  
**Quality Framework:** Epic-driven with agent coordination  
**Elicitation Protocol:** Interactive workflows enabled for all user stories  

### BMad Dependency Structure

**Required Dependencies (Auto-Load Pattern):**
```
.bmad-core/
├── tasks/
│   ├── brownfield-create-epic.md
│   ├── brownfield-create-story.md
│   ├── create-doc.md
│   ├── correct-course.md
│   ├── shard-doc.md
│   └── execute-checklist.md
├── templates/
│   ├── brownfield-prd-tmpl.yaml
│   └── prd-tmpl.yaml
├── checklists/
│   ├── pm-checklist.md
│   └── change-checklist.md
└── data/
    └── technical-preferences.md
```

**Command-to-Dependency Mapping:**
- `*create-brownfield-epic` → .bmad-core/tasks/brownfield-create-epic.md
- `*create-brownfield-story` → .bmad-core/tasks/brownfield-create-story.md
- `*create-brownfield-prd` → .bmad-core/tasks/create-doc.md + .bmad-core/templates/brownfield-prd-tmpl.yaml
- `*correct-course` → .bmad-core/tasks/correct-course.md
- `*shard-prd` → .bmad-core/tasks/shard-doc.md

**Elicitation Requirements:**
- ALL tasks with elicit=true REQUIRE user interaction
- NO bypassing interactive workflows for efficiency
- Exact specified format adherence mandatory
- Agent coordination overrides conflicting base constraints

---
