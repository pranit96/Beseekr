CAT Prep API Documentation
Base URL: /api/cat
Auth: Cookie-based (requires login)

📚 Subjects & Topics
GET /subjects
Get all subjects with user's topic progress (auto-initializes on first call)

Response:

{
  "success": true,
  "data": [{
    "id": "uuid",
    "code": "quant",
    "name": "Quantitative Aptitude",
    "icon": "🔢",
    "topics": [{ "id": "uuid", "title": "Percentages", "status": "not_started", "accuracy_percent": null }],
    "stats": { "total": 30, "not_started": 28, "in_progress": 1, "done": 1 }
  }]
}
GET /topics/:id
Get single topic details

POST /topics
Create custom topic

Payload:

{ "subject_id": "uuid", "title": "Custom Topic", "description": "optional" }
PUT /topics/:id
Update topic

Payload:

{ "title": "New Title", "description": "...", "difficulty": 3 }
PATCH /topics/:id/status
Update topic status (triggers revision scheduling if "done")

Payload:

{ "status": "not_started|in_progress|done|needs_revision" }
DELETE /topics/:id
Delete custom topic

📝 Study Tasks
GET /tasks
List tasks with filters

Query Params: status, priority, subject_id, task_type, page, limit

POST /tasks
Create study task

Payload:

{
  "title": "Practice Percentages",
  "topic_id": "uuid (optional)",
  "subject_id": "uuid (optional)",
  "task_type": "study|practice|revision|mock",
  "priority": "low|medium|high|urgent",
  "estimated_minutes": 60,
  "deadline": "2025-02-01"
}
PUT /tasks/:id
Update task

PATCH /tasks/:id/complete
Mark task complete (updates streak)

DELETE /tasks/:id
Delete task

📓 Notes
GET /topics/:id/notes
Get notes for a topic

GET /notes/search
Search notes

Query Params: q (search term), tags (comma-separated)

POST /notes
Create note

Payload:

{
  "topic_id": "uuid",
  "title": "Percentage Formulas",
  "content": "Markdown content...",
  "concepts": ["Change percentage", "Successive discounts"],
  "formulas": ["Final = Original × (1 + r/100)"],
  "tricks": ["For 20% increase, multiply by 1.2"],
  "common_mistakes": ["Forgetting to convert back to percentage"],
  "tags": ["arithmetic", "important"]
}
PUT /notes/:id
Update note

DELETE /notes/:id
Delete note

POST /notes/:id/generate-flashcards
AI generate flashcards from note content

Response: Created flashcards array

🎴 Flashcards
GET /topics/:id/flashcards
Get flashcards for topic

GET /flashcards/due
Get flashcards due for review (spaced repetition)

Query Params: limit (default 20)

POST /flashcards
Create flashcard

Payload:

{
  "topic_id": "uuid",
  "question": "What is the formula for compound interest?",
  "answer": "A = P(1 + r/n)^(nt)",
  "difficulty": 3
}
POST /flashcards/:id/review
Review flashcard (updates spaced repetition schedule)

Payload:

{ "correct": true }
📊 Mock Tests
POST /mocks/start
Start a new mock test

Payload:

{
  "type": "full|sectional_quant|sectional_varc|sectional_dilr|custom",
  "difficulty": "easy|medium|hard",
  "generate_new": false
}
Response: Mock with questions (correct answers hidden)

GET /mocks
Get mock history

Query Params: page, limit

GET /mocks/:id
Get mock details

POST /mocks/:id/submit
Submit answer for a question

Payload:

{
  "question_id": "uuid",
  "answer": "A",
  "time_spent": 120
}
POST /mocks/:id/complete
Complete mock and get results (reveals correct answers)

POST /mocks/:id/abandon
Abandon in-progress mock

GET /mocks/weak-areas
Get topics with <50% accuracy

GET /mocks/improving
Get topics showing improvement

GET /mocks/performance
Get performance dashboard with trends

🔄 Revisions (Spaced Repetition)
GET /revisions
Get due/overdue revisions

GET /revisions/upcoming
Get upcoming revisions

Query Params: days (default 7)

GET /revisions/calendar
Get revision calendar

Query Params: year, month

POST /revisions/:id/complete
Mark revision complete

Payload:

{ "notes": "Revised all formulas", "create_task": false }
🏠 Dashboard & Settings
GET /dashboard
Full progress dashboard

Response: Syllabus progress, settings, revision stats, mock performance, weak areas

GET /settings
Get user settings

PUT /settings
Update settings

Payload:

{
  "target_exam_date": "2025-11-24",
  "daily_study_hours_goal": 4,
  "weekly_mocks_goal": 2
}
🤖 AI Features
GET /ai/study-plan
AI-generated weekly study plan based on weak areas

GET /ai/analysis
AI performance analysis with recommendations

GET /ai/topic-tips/:topicId
Get AI tips for improving on a topic

⏱️ Timed Practice (Enhanced)
POST /practice/start
Start timed practice session

Payload:

{
  "subject_id": "uuid (optional)",
  "topic_id": "uuid (optional)",
  "session_type": "timed|untimed|speed_drill|accuracy_focus",
  "question_count": 10,
  "time_limit_minutes": 15
}
POST /practice/submit
Submit practice answer

Payload:

{
  "session_id": "uuid",
  "question_id": "uuid",
  "answer": "B",
  "time_spent": 45
}
POST /practice/:id/complete
Complete practice session

GET /practice/history
Get practice history

❌ Mistake Journal (Enhanced)
GET /mistakes
List mistakes

Query Params: reviewed (true/false), type (concept/calculation/silly_error/time_pressure/misread)

GET /mistakes/stats
Mistake statistics

POST /mistakes/:id/review
Mark mistake reviewed

Payload:

{ "notes": "Need to revise this concept" }
POST /mistakes/:id/categorize
AI categorize mistake type

📌 Bookmarks (Enhanced)
GET /bookmarks
List bookmarked questions

Query Params: collection

GET /bookmarks/collections
List bookmark folders

POST /bookmarks/collections
Create collection

Payload:

{ "name": "Must Revise", "color": "#FF5722", "icon": "🔥" }
POST /bookmarks/:questionId
Bookmark a question

Payload:

{
  "collection": "Must Revise",
  "importance": "high|medium|low|must_revise",
  "notes": "Got this wrong twice"
}
DELETE /bookmarks/:questionId
Remove bookmark

🎯 Daily Goals (Enhanced)
GET /goals/today
Get today's goals and progress

GET /goals/history
Get goals history

Query Params: days (default 7)

📈 External Mocks (Enhanced)
POST /external-mocks
Record external mock score (IMS/TIME/CL)

Payload:

{
  "platform": "IMS|TIME|Career Launcher|Unacademy|2IIM|Bodhee|Other",
  "mock_name": "SimCAT 2025 Week 4",
  "mock_date": "2025-01-25",
  "overall_score": 102.5,
  "max_score": 198,
  "percentile": 94.5,
  "quant_score": 45,
  "quant_percentile": 92,
  "varc_score": 38,
  "varc_percentile": 95,
  "dilr_score": 19.5,
  "dilr_percentile": 88,
  "notes": "Time management was good"
}
GET /external-mocks
List external mocks

Query Params: platform, limit

GET /external-mocks/analytics
Combined internal + external mock analytics

GET /external-mocks/:id
Get single external mock

PUT /external-mocks/:id
Update external mock

DELETE /external-mocks/:id
Delete external mock

📹 Topic Resources (Enhanced)
GET /resources/search
Search resources

Query Params: q, type (video/article/pdf/course), difficulty, free

GET /resources/recommended
AI-recommended resources for weak areas

GET /resources/topic/:topicId
Resources for specific topic

GET /resources/subject/:subjectId
Resources for subject

POST /resources
Add resource

Payload:

{
  "topic_id": "uuid",
  "title": "Percentage Problems - Full Chapter",
  "url": "https://youtube.com/watch?v=...",
  "resource_type": "video|article|pdf|course|practice_set|other",
  "source": "YouTube",
  "duration_minutes": 45,
  "difficulty": "beginner|intermediate|advanced",
  "is_free": true
}
PATCH /resources/:id/rate
Rate a resource

Payload:

{ "rating": 4.5 }
DELETE /resources/:id
Delete resource

⚙️ CAT-Specific Settings (Enhanced)
GET /cat-settings
Get CAT exam settings

PUT /cat-settings
Update CAT settings

Payload:

{
  "preferred_slot": "slot_1|slot_2|slot_3",
  "sectional_time_limit": 40,
  "enforce_sectional_timing": true,
  "target_percentile": 99,
  "daily_question_goal": 50,
  "email_daily_reminder": true,
  "reminder_time": "08:00:00"
}
GET /cat-settings/slots
Get CAT slot timings (8:30 AM, 12:30 PM, 4:30 PM)

GET /cat-settings/strategy
Get sectional time strategy recommendations

📤 Export
GET /export
Export all CAT prep data

Query Params: 
format
 (json/csv)

