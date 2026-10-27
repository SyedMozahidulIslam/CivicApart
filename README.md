# 🇧🇩 CivicApart — Public Problem Reporting & Resolution Platform for Bangladesh

> **“Report local problems. Track real progress.”**  
> A transparent, human-designed public civic problem reporting and resolution platform for Bangladesh. Empowering citizens to report municipal hazards, verify community issues, and track verified ground progress across city corporations and upazilas.

---

## 🌟 Key Highlights & Architectural Principles

- **No False Claims Policy**: CivicApart never claims that a government authority or municipal body has accepted, routed, or resolved a report unless that transition is actively confirmed by an authorized operator through a verified workflow.
- **Independent Community Verification**: Even when no official municipal integration exists, issues are tracked through neighborhood consensus ("Problem Still Exists" vs "Seems Resolved" feedback), photographic evidence, and structured moderation.
- **Designed for Bangladesh**: Built with dual-language support (**English** and **বাংলা**), Bangladesh Standard Time (**BST**, UTC+6), all 8 administrative divisions (Dhaka, Chattogram, Sylhet, Rajshahi, Khulna, Barishal, Rangpur, Mymensingh), landmark shortcuts (Mirpur 10, Dhanmondi 27, Gulshan 2, Agrabad, Zindabazar), and national emergency disclaimers (999 & 333).
- **Server-Side Gemini AI Integration**: Powered by `@google/genai` TypeScript SDK (`gemini-3.8-flash`) for advisory categorization, duplicate candidate detection, description refinement, and safety moderation without ever exposing secrets to client bundles.
- **Interactive OpenStreetMap with Leaflet**: Complete interactive Bangladesh problem map with custom colored category pins, coordinate picker, and district-level navigation.
- **Strict Role-Based Authorization & Auditing**: Five distinct roles (`visitor`, `citizen`, `moderator`, `operator`, `admin`) with state machine transitions and immutable audit logs.

---

## 🏛️ Roles & Permitted Capabilities

| Role | Browse & Map | Submit Reports | Verify / Vote | Assign Crew | Change Status | Audit Logs |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Public Visitor** | ✅ Yes | ❌ (Login req.) | ❌ (Login req.) | ❌ No | ❌ No | ❌ No |
| **Registered Citizen** | ✅ Yes | ✅ Yes (Photos & GPS) | ✅ Yes (1 vote/ticket) | ❌ No | ❌ No | ❌ No |
| **Community Moderator** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ✅ Verify/Reject | ✅ Review Queue |
| **Municipal Operator** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Assign lead | ✅ In Progress / Resolved | ✅ Team Notes |
| **Platform Administrator**| ✅ Yes | ✅ Yes | ✅ Yes | ✅ Any Agency | ✅ Any State | ✅ Full System Logs |

---

## 🔄 Report Lifecycle State Machine

CivicApart enforces an explicit transition state machine:

```
[ submitted ]
      │
      ├──> [ under_review ] ──> [ verified ] ──> [ assigned ] ──> [ in_progress ] ──> [ resolved_pending_confirmation ]
      │           │                                                                                 │
      └──> [ rejected ] <───────────────────────────────────────────────────────────────────────────┴──> [ reopened ]
                                                                                                            │
                                                                                                       [ closed ]
```

1. **Submitted**: Initial citizen report with GPS coordinates and photo evidence.
2. **Under Review**: Evaluated by community moderators for duplicate detection, relevance, and location accuracy.
3. **Verified**: Confirmed as an authentic public issue by community evidence or moderators.
4. **Assigned**: Routed to participating municipal entity (e.g., DNCC Roads, Dhaka WASA, DESCO, CCC).
5. **In Progress**: Remediation work actively being carried out on site.
6. **Resolved (Pending Confirmation)**: Operator marks work complete with resolution proof photo. Local residents receive notification to confirm on the ground.
7. **Closed**: Confirmed resolved by local community consensus.
8. **Reopened**: If 3 or more citizens report that the problem still exists after resolution claim, the ticket automatically reopens.
9. **Rejected**: Non-civic or duplicate report; requires mandatory documented reason recorded in audit logs.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Leaflet OpenStreetMap.
- **Backend**: Node.js full-stack Express server (`server.ts`) with development Vite middleware.
- **AI Engine**: `@google/genai` TypeScript SDK using `gemini-3.8-flash`.
- **Database & State**: In-memory and file-backed structured store with realistic Bangladesh seed data, atomic audit logging, and status transitions.
- **Testing**: Node.js built-in test runner (`node:test`, `node:assert/strict`) executed via `npx --yes tsx --test`.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (version 20 or higher)
- npm or bun

### 2. Environment Configuration
Create a `.env` file based on `.env.example`:

```bash
# GEMINI_API_KEY: Injected automatically by AI Studio secrets or set manually
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# APP_URL: Current hosting origin
APP_URL="http://localhost:3000"
```

### 3. Installation & Local Development
```bash
# Install dependencies
npm install

# Start full-stack development server (Express backend + Vite frontend)
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🧪 Unit Testing

Pure business logic (permitted lifecycle transitions, authorization rules, Haversine geographic duplicate scoring, urgency keyword normalization for English and Bengali) is verified with deterministic unit tests:

```bash
npx --yes tsx --test src/utils/statusWorkflow.test.ts
```

All 8 tests execute in milliseconds with zero dependencies on browser DOM.

---

## 🤖 Gemini AI Capabilities & Safety

| Feature | Endpoint | Model | Purpose |
| :--- | :--- | :--- | :--- |
| **Categorization** | `POST /api/gemini/categorize` | `gemini-3.8-flash` | Analyzes title & description to suggest exact municipal category & subcategory. |
| **Description Polisher** | `POST /api/gemini/improve-description` | `gemini-3.8-flash` | Formats informal drafts into concise, objective technical language without inventing false facts. |
| **Duplicate Candidate Check**| `POST /api/gemini/check-duplicates` | Hybrid / Jaccard + Proximity | Alerts citizen before submission if an issue was already registered within 500m. |
| **Content Moderation** | `POST /api/gemini/moderate` | `gemini-3.8-flash` | Checks submissions for PII leakage (National IDs) or abusive language. |

*Fallback Assurance*: If `GEMINI_API_KEY` is not provided or the network is unreachable, robust local heuristic fallbacks engage seamlessly so report creation is never blocked.

---

## 🔒 Security & Citizen Privacy Protection

1. **Reporter Contact Masking**: Citizen phone numbers are masked on public endpoints (e.g. `+880 1711-***567`) and never revealed to visitors.
2. **Access Control**: Role checks are enforced on server endpoints (`/api/reports/:id/status`, `/api/reports/:id/progress-notes`). Ordinary citizens cannot promote tickets to Verified or Resolved.
3. **Immutable History**: Every transition creates an immutable `StatusHistoryEntry` with timestamp, actor ID, role, and comment.
4. **Emergency Interception**: Keywords indicating imminent life hazards (live wires, deep open manholes, gas leaks) trigger prominent **999** and **333** Bangladesh emergency banners.

---

## 📈 Public Transparency Analytics

CivicApart provides an open **Public Transparency** page calculated from live platform data:
- Verified Resolution Rate
- Active Remediation Count
- Average Days to Resolution
- Breakdown by all 9 civic categories
- Distribution across 8 administrative divisions of Bangladesh

---

## 📄 License
Licensed under the Apache License, Version 2.0.
