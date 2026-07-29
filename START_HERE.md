# 🚀 Click Wise Hackathon: START HERE

Welcome, team! This is your roadmap to build a fully working MVP in 3 hours with $90 tokens.

---

## 📖 Read These Files IN THIS ORDER

### 1. **QUICK_REFERENCE.txt** (5 min read)
   - Ultra-condensed cheat sheet
   - Print this or keep it on second monitor
   - Roles, timeline, checklist, common blockers

### 2. **HACKATHON_STRATEGY_EXPLAINED.md** (15 min read)
   - Why we designed it this way
   - Why parallel work beats sequential
   - Why each prompt is structured as it is
   - Risk mitigation strategies
   - Philosophy: "boring hacks that work win"

### 3. **HACKATHON_MASTER_GUIDE.md** (20 min read)
   - Full battle plan
   - 30-minute standup protocol
   - Hour-by-hour timeline
   - Quality metrics & success criteria
   - Demo script for judges
   - Fallback scenarios

### 4. **Your Role-Specific Prompt File** (When your hour starts)

   - **Dev 1 → PROMPTS_PHASE3_DEV1_BACKEND.md** (5 executable prompts)
   - **Dev 2 → PROMPTS_PHASE3_DEV2_FRONTEND.md** (5 executable prompts)
   - **Dev 3 → PROMPTS_PHASE3_DEV3_EXTENSION.md** (5 executable prompts)
   - **Dev 4 → PROMPTS_PHASE4_DEV4_E2E_POLISH.md** (5 executable prompts)

---

## 🎯 Your Role (Pick One)

### Dev 1: Backend Services (~$23 tokens, 2 hours)
- Risk scoring, Claude API, caching, logging
- **Start with:** PROMPTS_PHASE3_DEV1_BACKEND.md
- **Test by:** `pytest backend/tests/ -v` (all pass)
- **Handoff to:** Dev 2, Dev 3

### Dev 2: Frontend UI (~$23 tokens, 2.5 hours)
- React components, forms, responsive design
- **Start with:** PROMPTS_PHASE3_DEV2_FRONTEND.md
- **Test by:** `npm run dev` (no console errors, renders)
- **Depends on:** Dev 1 (wait for backend ready)
- **Handoff to:** Dev 3, Dev 4

### Dev 3: Extension & Detection (~$23 tokens, 2.5 hours)
- Chrome extension, content script, manifest
- **Start with:** PROMPTS_PHASE3_DEV3_EXTENSION.md
- **Test by:** `npm run build` + load in Chrome (zero warnings)
- **Depends on:** Dev 2 (wait for frontend build)
- **Handoff to:** Dev 4

### Dev 4: QA & Deployment (~$21 tokens, 3 hours)
- Testing, documentation, polish, README
- **Start with:** PROMPTS_PHASE4_DEV4_E2E_POLISH.md
- **Test by:** Full E2E flow (8 test cases pass)
- **Depends on:** Dev 1, 2, 3 (run tests once available)
- **Deliverable:** HACKATHON_README.md (judges use to demo)

---

## ⏰ Timeline at a Glance

```
HOUR 1: Parallel Development (Each dev independent)
├─ Dev 1: Backend Prompts 1-3
├─ Dev 2: Frontend Prompts 1-2
├─ Dev 3: Extension Prompts 1-2
└─ Dev 4: Create test plan + baseline setup

HOUR 2: Integration & Refinement
├─ Dev 1: Backend Prompts 4-5
├─ Dev 2: Frontend Prompts 3-4
├─ Dev 3: Extension Prompts 3-5
└─ Dev 4: Cross-module integration testing

HOUR 3: Testing & Polish
├─ Dev 1: Fix backend bugs
├─ Dev 2: Fix frontend bugs + optional dark mode
├─ Dev 3: Fix extension issues
└─ Dev 4: Run full test suite, finalize docs
```

**Every 30 minutes:** 2-minute standup (see HACKATHON_MASTER_GUIDE.md)

---

## 🚀 How to Execute Each Prompt

Each prompt file (e.g., PROMPTS_PHASE3_DEV1_BACKEND.md) contains prompts like this:

```
[HACKATHON_EXEC_PHASE_X_TASK_Y]
File: backend/services/risk_scoring/risk_engine.py
Action: Add async method to load red_flag_rules from Supabase
Priority: CRITICAL
Tokens: ~$4

Copy this exact code block:
[... specific code ...]

Test by running:
[... specific test command ...]

Expected output:
[... what you should see ...]
```

**How to use it:**
1. Copy the code block exactly (no modifications)
2. Paste into the specified file
3. Run the test command
4. If test passes → move to next prompt
5. If test fails → debug (ask other dev if needed)

---

## 💰 Token Budget Summary

| Dev | Budget | Allocation |
|-----|--------|-----------|
| 1 (Backend) | $23 | 5+5+4+3+2 |
| 2 (Frontend) | $23 | 5+5+4+4+2 |
| 3 (Extension) | $23 | 5+5+4+3+3 |
| 4 (QA/Deploy) | $21 | 3+4+3+3+2 |
| **Reserve** | $10 | Emergency fixes |
| **TOTAL** | **$100** | On budget for $90 |

---

## ✅ Success Checklist

By end of 3 hours, you need:

- [ ] Backend API ready: `curl http://localhost:8000/api/health` → 200
- [ ] Frontend running: `npm run dev` → http://localhost:5173 loads
- [ ] Extension loads: chrome://extensions → zero warnings
- [ ] E2E flow works: Extension detects doc → shows analysis
- [ ] Tests pass: `pytest backend/tests/ -v` (all pass)
- [ ] Zero console errors: Browser + Terminal clean
- [ ] README done: HACKATHON_README.md allows judges 5-min setup
- [ ] Code clean: `git status` shows no uncommitted changes

**If all 8 are true → You're ready to demo.** 🎉

---

## 🎬 Demo Script (For You to Practice)

Before showing judges, practice this with a teammate:

```
1. Show automatic detection
   → Navigate to stripe.com/legal/ssa
   → Click extension icon
   → Show popup with risk score

2. Show full analysis
   → Click "Open Full Analyzer"
   → Sidepanel opens with breakdown

3. Show caching
   → Go back to same page
   → Show instant load (< 100ms)

4. Show manual upload
   → Open http://localhost:5173
   → Paste document
   → See real-time analysis

5. Explain architecture
   → Show SPEC.md
   → Explain caching strategy
   → Explain risk scoring logic

Total time: < 5 minutes
```

Practice until you can do it flawlessly.

---

## 🚨 Emergency Fallback Plans

**If Backend won't start:**
- Have mock JSON response file ready
- Demo frontend + extension separately
- Show SPEC.md to explain architecture

**If Extension won't load:**
- Show screenshot of working extension
- Demo backend + frontend separately
- Explain what extension would do

**If Claude API times out:**
- Use cached results from earlier scans
- Explain caching reduces cost 10x
- Show the caching logic in code

**If Supabase is down:**
- Backend falls back to in-memory cache (already coded)
- Still works for demo
- Works fine for single session

Have these ready. You'll feel more confident.

---

## 🎯 Key Principles

1. **Parallel > Sequential**
   - Each dev works independently
   - Handoffs at specific points
   - No blocking

2. **Test After Each Prompt**
   - Don't accumulate bugs
   - Fail fast, iterate quickly
   - Each prompt has verification step

3. **MVP Only**
   - Risk score = color + number
   - UI = functional, not fancy
   - No animations, no extra features

4. **Documentation First**
   - Dev 4 writes README in parallel
   - Not an afterthought
   - Judges judge your docs too

5. **Communicate Often**
   - 30-minute standups
   - Ask for help early
   - Don't debug alone for > 10 min

---

## 📞 Quick Links

| Document | Use When | Read Time |
|----------|----------|-----------|
| QUICK_REFERENCE.txt | Need quick facts/timelines | 5 min |
| HACKATHON_STRATEGY_EXPLAINED.md | Want to understand WHY | 15 min |
| HACKATHON_MASTER_GUIDE.md | Need detailed battle plan | 20 min |
| PROMPTS_PHASE3_DEV1_BACKEND.md | You're Dev 1, ready to code | 30 min |
| PROMPTS_PHASE3_DEV2_FRONTEND.md | You're Dev 2, ready to code | 30 min |
| PROMPTS_PHASE3_DEV3_EXTENSION.md | You're Dev 3, ready to code | 30 min |
| PROMPTS_PHASE4_DEV4_E2E_POLISH.md | You're Dev 4, ready to test | 30 min |
| SPEC.md | Judges ask about architecture | 10 min |
| CLAUDE.md | Judges ask about vision | 5 min |
| HACKATHON_TEST_REPORT.md | Record test results here | (created during Hour 3) |
| HACKATHON_README.md | Judges use for setup | (created during Hour 3) |

---

## 🏆 What Winning Looks Like

Judges will see:
- ✅ Extension icon appears on websites
- ✅ Click extension → instant risk score
- ✅ Click "Analyzer" → full breakdown in sidepanel
- ✅ Second visit → cached result (< 100ms)
- ✅ Manual upload → real-time analysis
- ✅ No crashes, no console errors
- ✅ Clear README with 5-min setup
- ✅ Team can explain decisions

**If all true → You win. Period.**

---

## 💪 Final Words

This is achievable. The structure is tight. The prompts are clear. You have fallback plans.

What separates winning hacks from losing hacks:
1. **Working end-to-end** (most fail here)
2. **Clean code** (most don't prioritize)
3. **Clear explanation** (most can't articulate)
4. **Smooth demo** (most have 5 bugs)

You have all 4. Execute, communicate, and demo with confidence.

---

## 🚀 Ready to Start?

1. **Everyone:** Read QUICK_REFERENCE.txt (5 min)
2. **Everyone:** Read HACKATHON_STRATEGY_EXPLAINED.md (15 min)
3. **Everyone:** Read HACKATHON_MASTER_GUIDE.md (20 min)
4. **Dev 1:** Open PROMPTS_PHASE3_DEV1_BACKEND.md and start
5. **Dev 2:** Open PROMPTS_PHASE3_DEV2_FRONTEND.md and start
6. **Dev 3:** Open PROMPTS_PHASE3_DEV3_EXTENSION.md and start
7. **Dev 4:** Start PROMPTS_PHASE4_DEV4_E2E_POLISH.md setup phase

**Clock starts now. Go build something amazing.** ✨

---

## 📋 Checklist Before You Start Coding

- [ ] All 4 developers have read QUICK_REFERENCE.txt
- [ ] All 4 developers have read HACKATHON_STRATEGY_EXPLAINED.md
- [ ] All 4 developers have read HACKATHON_MASTER_GUIDE.md
- [ ] Each dev has their role-specific prompt file open
- [ ] Backend env is configured (.env file created)
- [ ] Frontend dependencies installed (`npm install` in frontend/)
- [ ] First developer (Dev 1) has started Prompt 1
- [ ] Team has set up 30-minute standup alarm/reminder

**Once all checked → You're officially go for launch!** 🎬

---

**Built with strategic thinking, tight planning, and confidence in your team's ability to execute.**

Now go win this thing. 💪🚀

