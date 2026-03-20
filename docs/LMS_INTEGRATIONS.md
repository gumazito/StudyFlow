# LMS Integrations — SEQTA, Canvas, Moodle

## Overview

StudyFlow can integrate with existing school LMS platforms to:
- Import student rosters and classes automatically
- Sync grades and test results back to the LMS gradebook
- Allow SSO from the LMS into StudyFlow
- Import course content from LMS modules

---

## 1. SEQTA (Australian Schools)

### About
SEQTA is the most popular LMS in Australian schools (~1,500 schools).

### Integration Points
- **SEQTA API:** REST API available for partner integrations
- **Contact:** integrations@seqta.com.au for API access
- **Auth:** OAuth 2.0 + API tokens per school
- **Endpoints:**
  - Students: `/api/students` — roster sync
  - Classes: `/api/classes` — group auto-creation
  - Results: `/api/results` — grade push-back
  - Timetable: `/api/timetable` — schedule awareness

### Implementation Plan
```typescript
// lib/integrations/seqta.ts
export class SeqtaConnector {
  constructor(private schoolId: string, private apiToken: string) {}

  async syncStudents(classId: string): Promise<Student[]> {
    // Pull student list from SEQTA class
  }

  async pushResults(results: TestResult[]): Promise<void> {
    // Send StudyFlow test results back to SEQTA gradebook
  }

  async importContent(moduleId: string): Promise<CourseContent> {
    // Import learning content from SEQTA module
  }
}
```

### Setup for Schools
1. School IT admin enables API access in SEQTA admin
2. School generates API token for StudyFlow
3. In StudyFlow Admin → Integrations → Add SEQTA
4. Enter school SEQTA URL + API token
5. Select classes to sync

---

## 2. Canvas LMS

### About
Canvas by Instructure — widely used in universities and some schools globally.

### Integration Points
- **Canvas REST API:** Well-documented, open API
- **LTI 1.3:** Industry standard for tool integration
- **Auth:** OAuth 2.0 + developer keys

### LTI Integration (Recommended)
LTI (Learning Tools Interoperability) lets StudyFlow appear as a tool inside Canvas.

```typescript
// lib/integrations/lti.ts
// LTI 1.3 launch handler
export async function handleLtiLaunch(params: LtiLaunchParams) {
  // 1. Validate JWT from Canvas
  // 2. Extract user identity (name, email, role)
  // 3. Extract course context (course_id, section)
  // 4. Auto-create/login StudyFlow user
  // 5. Redirect to appropriate StudyFlow screen
}

// Grade passback via LTI AGS
export async function sendGradeToCanvas(
  lineItemUrl: string,
  score: number,
  userId: string
) {
  // POST score back to Canvas gradebook
}
```

### Canvas API Endpoints
- Courses: `GET /api/v1/courses`
- Students: `GET /api/v1/courses/:id/students`
- Assignments: `POST /api/v1/courses/:id/assignments`
- Grades: `PUT /api/v1/courses/:id/assignments/:id/submissions/:id`

---

## 3. Moodle

### About
Open-source LMS, used by many schools worldwide.

### Integration Points
- **Moodle Web Services API:** REST/SOAP
- **LTI 1.3:** Same as Canvas
- **Auth:** Token-based (site admin generates)

### Key Moodle API Functions
```
core_user_get_users          → Student roster
core_course_get_courses      → Course list
mod_assign_save_grade        → Grade push
core_enrol_get_enrolled_users → Class enrollment
```

---

## Shared Integration Architecture

```
lib/integrations/
├── types.ts            # Shared interfaces (Student, Course, Grade)
├── lti.ts              # LTI 1.3 protocol handler
├── seqta.ts            # SEQTA-specific connector
├── canvas.ts           # Canvas-specific connector
├── moodle.ts           # Moodle-specific connector
└── sync-manager.ts     # Orchestrates roster/grade sync
```

### Data Flow
```
School LMS  →  [Roster Sync]  →  StudyFlow Groups + Members
StudyFlow   →  [Grade Sync]   →  School LMS Gradebook
School LMS  →  [LTI Launch]   →  StudyFlow (SSO)
School LMS  →  [Content Import] → StudyFlow Packages
```

### Admin UI (StudyFlow)
Group admins will see an "Integrations" tab with:
- Connected LMS selector (SEQTA / Canvas / Moodle)
- Sync status and last sync time
- Manual sync trigger
- Class mapping (LMS class → StudyFlow group)
- Grade passback toggle per course

---

## Implementation Priority

| Phase | Feature | Effort |
|-------|---------|--------|
| 1 | LTI 1.3 protocol (works with Canvas + Moodle) | 2 weeks |
| 2 | Canvas roster sync + grade passback | 1 week |
| 3 | SEQTA roster sync (needs API partnership) | 2 weeks |
| 4 | Moodle connector | 1 week |
| 5 | Content import from LMS | 2 weeks |
| 6 | Admin UI for integration management | 1 week |

**Note:** SEQTA requires a partnership agreement. Reach out to their integrations team early.
