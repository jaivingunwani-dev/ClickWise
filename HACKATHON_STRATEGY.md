# Click Wise Hackathon Strategy & Prompt Engineering Plan

**Total Budget:** $90 | **Team:** 4 people | **Per person:** ~$23 | **Timeline:** Focus on MVP only

---

## Phase Summary & Token Allocation

| Phase | Status | Focus | Token Est. |
|-------|--------|-------|-----------|
| Phase 1 | ✅ DONE | Scaffolding | Consumed |
| Phase 2 | ✅ DONE | Caching & API | Consumed |
| Phase 3 | 🚀 NEXT | Risk Scoring & UI | $35 |
| Phase 4 | 🚀 FINAL | Polish & Deployment | $30 |
| Contingency | Reserve | Bug fixes | $25 |

---

## Team Assignment & Execution Order

### **Dev 1: Backend Services** (~$23)
Focus: Risk scoring, Claude integration testing, caching validation

### **Dev 2: Frontend UI** (~$23)
Focus: Risk display, document summary component, responsive layout

### **Dev 3: Extension & Detection** (~$23)
Focus: Content script refinement, popup/sidepanel integration, manifest updates

### **Dev 4: End-to-End & Polish** (~$21)
Focus: E2E testing, error handling, deployment setup, README

---

## Critical Rules for Token Efficiency

1. **Every prompt must be copy-paste executable** — no ambiguity
2. **Use code blocks for concrete examples** — don't describe, show
3. **Reference existing files by path** — avoid re-reading
4. **Ask for specific outputs** — JSON, boolean, file paths only
5. **Batch related tasks** — minimize context switching
6. **Test incrementally** — fail fast, iterate with minimal tokens
7. **No exploratory work** — know exactly what you're building before prompting

---

## MVP Feature Checklist (Hackathon Focus)

- [x] Document detection on page load
- [x] Text extraction & hashing
- [x] Supabase caching layer
- [x] Claude API integration
- [ ] **Risk score calculation & visualization** ← Phase 3 focus
- [ ] **Summary display component** ← Phase 3 focus
- [ ] **Interactive UI (popup/sidepanel)** ← Phase 3 focus
- [ ] **Error handling & edge cases** ← Phase 4 focus
- [ ] **Deployment & README** ← Phase 4 focus

---

## What NOT to Do (Token Killers)

❌ Refactor existing code
❌ Add new libraries without approval
❌ Write comprehensive tests (basic smoke tests only)
❌ Over-engineer edge cases
❌ Change architecture mid-way
❌ Implement features beyond MVP
❌ Spend tokens on minor UI polish

---

## Success Metrics for Hackathon

1. **Working end-to-end flow:** User clicks extension → sees analysis
2. **Real Claude API integration:** Not mock data
3. **Caching working:** Second scan shows cached result
4. **Risk scoring visible:** Color-coded risk level displayed
5. **Responsive UI:** Works on desktop + mobile
6. **Clean README:** 5-minute setup for judges

---

## Execution Protocol

Each developer will receive **specific, executable prompts** (not guidelines).

**Prompt Format:**
```
[HACKATHON_EXEC_PHASE_X_TASK_Y]
File: path/to/file.ext
Action: [add|update|implement]
Priority: [critical|high|medium]
Tokens: ~$X
---
[Specific code block or change request]
```

All prompts follow this structure to avoid ambiguity and minimize clarification rounds.