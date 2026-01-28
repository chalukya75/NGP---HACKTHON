# SkillForge - EdTech Placement Prep Platform PRD

## Original Problem Statement
Build a hackathon-ready, scalable EdTech web application that helps college students gain real technical skills, interview confidence, and placement readiness for high-paying roles (SDE, Data Analyst, Data Scientist, ML Engineer).

## User Personas
1. **College Student (Primary)**: Preparing for tech placements
2. **Career Switcher**: Learning programming fundamentals
3. **Data Aspirant**: Targeting Data Analyst/Scientist/ML roles

## Core Requirements (Static)
- Domain-based authentication (college email validation)
- Role selection (SDE, Data Analyst, Data Scientist, ML Engineer)
- Task-based learning system with points & levels
- BRO AI mentor (Voice + Text mode) using OpenAI GPT-5.2 & Whisper
- Built-in Python code editor
- Resume Builder with company-specific templates
- Placement Readiness Dashboard
- Job Trends awareness

## What's Been Implemented - January 2026

### Phase 1 (Complete)
- Authentication with JWT + domain validation
- Role Selection (4 roles)
- DSA Arrays module (5 tasks)
- BRO text mode
- Basic code editor

### Phase 2 (Complete - Current)

#### DSA Track (6 Modules, 20+ Tasks)
- **Arrays**: 5 problems (Two Sum, Max Subarray, Contains Duplicate, Product Except Self, Rotate Array)
- **Strings**: 4 problems (Valid Palindrome, Valid Anagram, Longest Substring, Group Anagrams)
- **Linked Lists**: 3 problems (Reverse, Detect Cycle, Merge Two Lists)
- **Stacks & Queues**: 2 problems (Valid Parentheses, Min Stack)
- **Trees**: 3 problems (Max Depth, Invert Tree, Validate BST)
- **Dynamic Programming**: 3 problems (Climbing Stairs, House Robber, Coin Change)

#### Data Analytics Track
- SQL Fundamentals (SELECT, JOINs, GROUP BY)
- Excel for Analysis (VLOOKUP, Pivot Tables)
- Exploratory Data Analysis (EDA)

#### Data Science Track
- Python for Data Science (NumPy, Pandas)
- Statistics Simplified (Mean/Median, Std Dev)

#### ML Track
- ML Basics (Supervised vs Unsupervised)
- Overfitting/Underfitting
- Train-Test Split

#### BRO AI Mentor
- **Text Mode**: OpenAI GPT-5.2 integration
- **Voice Mode**: OpenAI Whisper for speech-to-text
- Contextual help during task solving
- Resume assistance
- Interview tips

#### Resume Builder
- Company-specific templates (Google, Microsoft, Amazon, Infosys)
- AI-powered resume analysis
- Skill gap identification
- ATS optimization tips
- Multiple resume versions

#### Placement Readiness Dashboard
- Overall readiness score
- Skill breakdown by track
- Consistency score (streak tracking)
- Personalized recommendations
- Role-specific metrics

#### Job Trends System
- Real-time job market insights
- Role-specific trends popup
- In-demand skills display
- Salary insights

#### Gamification
- Points system (10-25 pts per task)
- Levels: Beginner → Intermediate → Advanced
- Streak tracking (daily/weekly)
- Weekly activity tracking (DSA, GitHub, LinkedIn)

### Tech Stack
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 + Whisper via Emergent Integrations

## API Endpoints (Complete)
- POST /api/auth/register, /api/auth/login
- GET /api/users/profile, PUT /api/users/role
- POST /api/users/streak
- GET /api/skills/dsa (all tracks)
- GET /api/skills/dsa/{trackId} (single track)
- GET /api/skills/dsa/{trackId}/{taskId}
- GET /api/skills/analytics, /api/skills/datascience, /api/skills/ml
- POST /api/tasks/{taskId}/submit
- POST /api/bro/chat, POST /api/bro/voice
- GET /api/resume/templates, POST /api/resume/create
- POST /api/resume/analyze
- POST /api/generate/linkedin, POST /api/generate/github
- GET /api/trends
- GET /api/readiness
- POST /api/code/run (MOCKED)

## Database Collections
- users (profile, progress, points, streak, resumes)
- chat_history (BRO conversations)

## Prioritized Backlog

### P0 (Critical)
- [x] All DSA modules
- [x] Resume Builder
- [x] BRO Voice Mode
- [x] Placement Dashboard
- [ ] Real Python code execution (Pyodide)
- [ ] Test case validation

### P1 (High Priority)
- [ ] GitHub integration for activity tracking
- [ ] LinkedIn post automation
- [ ] More Data Science/ML problems
- [ ] Company-wise interview questions

### P2 (Medium Priority)
- [ ] Mock interview system
- [ ] Leaderboard
- [ ] Study groups
- [ ] Mobile responsive improvements

### P3 (Future)
- [ ] Mobile app
- [ ] Video explanations
- [ ] Company-specific tracks
