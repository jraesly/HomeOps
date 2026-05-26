# HomeOps — Phased Build Plan

## Project Overview

**HomeOps** is a mobile-first home operations app for tracking rooms, devices/assets, recurring maintenance, consumables, documents, warranties, repairs, and household knowledge.

The product is inspired by the familiar **Google Home-style hierarchy**:

```text
Home
  → Areas / Floors
    → Rooms
      → Devices / Assets
        → Tasks
        → Logs
        → Parts
        → Documents
        → Issues
        → Warranties
```

The goal is not to control smart-home devices. The goal is to help a homeowner operate, maintain, document, and understand the house.

## Recommended Technology Stack

### Frontend

```text
React Native
Expo
TypeScript
Expo Router
TanStack Query
React Hook Form
Zod
Zustand or Context
NativeWind or React Native Paper
Expo Image Picker
Expo Camera / Barcode Scanner
SQLite later for offline mode
```

### Backend

```text
Python
FastAPI
Pydantic
SQLAlchemy or SQLModel
Alembic
PostgreSQL
pytest
Docker Compose
```

### Later Services

```text
Background jobs: Celery / RQ / Arq
Cache / queue: Redis
File storage: local filesystem first, then Azure Blob or S3
AI / RAG: Python ingestion service
Vector search: pgvector, Azure AI Search, or Qdrant
Notifications: Expo push notifications
```

## High-Level Build Order

```text
Phase 0: Product definition and repo setup
Phase 1: Backend foundation
Phase 2: Core mobile app shell
Phase 3: Rooms and devices
Phase 4: Maintenance tasks and logs
Phase 5: Dashboard and due-date engine
Phase 6: Consumables and inventory
Phase 7: Photos, documents, and warranties
Phase 8: QR codes and field workflow
Phase 9: Search and home timeline
Phase 10: AI / RAG assistant
Phase 11: Offline-first sync
Phase 12: Polish, observability, deployment, and demo story
```

The most important phases for the first usable MVP are **Phase 1 through Phase 5**.

---

# Phase 0 — Product Definition and Repo Setup

## Goal

Define the MVP tightly enough that the project does not drift into overbuilding.

## MVP Scope

The MVP should support:

```text
Create a home
Create rooms
Create devices/assets in rooms
Create recurring maintenance tasks for devices
Complete maintenance tasks
Automatically calculate the next due date
View overdue and due-soon tasks on a dashboard
View device maintenance history
```

## Non-MVP for Now

Avoid these initially:

```text
AI assistant
OCR
full offline sync
smart-home integrations
contractor sharing
household collaboration
push notifications
web dashboard
advanced analytics
```

## Initial Repo Structure

```text
homeops/
  api/
    app/
      main.py
      core/
      models/
      schemas/
      routers/
      services/
      repositories/
      tests/
    alembic/
    pyproject.toml
    Dockerfile

  mobile/
    app/
    src/
      components/
      screens/
      api/
      hooks/
      models/
      forms/
      state/
      utils/
    package.json

  docker-compose.yml
  README.md
```

## Deliverables

```text
README with product definition
Local dev instructions
Docker Compose skeleton
FastAPI app boots
Expo app boots
Postgres container boots
```

## Acceptance Criteria

```text
docker compose up starts Postgres and FastAPI
npm start or npx expo start runs the mobile app
GET /health returns 200
Mobile app shows a basic "HomeOps" screen
```

---

# Phase 1 — Backend Foundation

## Goal

Build the source-of-truth backend.

This is where much of the valuable engineering practice lives: API design, domain modeling, recurrence logic, database modeling, tests, and service-layer architecture.

## Core Backend Entities

Start with:

```text
User
Home
Area
Room
Device
MaintenanceTask
MaintenanceLog
```

For the first pass, real authentication can be skipped. Use a fixed test user ID.

## Data Model V1

### User

```text
id
email
display_name
created_at
updated_at
```

### Home

```text
id
user_id
name
address_optional
timezone
created_at
updated_at
```

Example:

```text
Home:
  name: Davidsonville House
  timezone: America/New_York
```

### Area

Areas are optional but useful. They let the app model floors or zones.

```text
id
home_id
name
sort_order
created_at
updated_at
```

Examples:

```text
Main Floor
Second Floor
Basement
Exterior
Garage
Garden
Utility
```

### Room

```text
id
home_id
area_id nullable
name
room_type
notes
created_at
updated_at
```

Examples:

```text
Kitchen
Utility Room
Primary Bedroom
Garage
Back Deck
Garden Beds
```

### Device

This is the core asset record.

```text
id
home_id
room_id nullable
name
device_type
manufacturer nullable
model_number nullable
serial_number nullable
install_date nullable
purchase_date nullable
warranty_end_date nullable
status
notes
created_at
updated_at
```

Device types:

```text
HVAC
Water Treatment
Appliance
Plumbing
Electrical
Exterior
Garden
Safety
Network
Other
```

Statuses:

```text
active
watching
needs_service
retired
```

### MaintenanceTask

```text
id
home_id
device_id nullable
title
description nullable
task_type
priority
recurrence_type
recurrence_interval
due_date
last_completed_at nullable
estimated_minutes nullable
instructions nullable
status
created_at
updated_at
```

Task types:

```text
replace_filter
inspect
clean
test
service
refill
winterize
other
```

Priority:

```text
low
medium
high
critical
```

Recurrence type:

```text
none
daily
weekly
monthly
quarterly
yearly
seasonal
custom_days
```

Status:

```text
active
paused
completed_once
archived
```

### MaintenanceLog

```text
id
home_id
device_id nullable
task_id nullable
completed_at
title
notes nullable
cost_cents nullable
performed_by nullable
created_at
updated_at
```

This records what actually happened.

## Backend Endpoints V1

### Health

```text
GET /health
```

### Homes

```text
POST /homes
GET /homes
GET /homes/{home_id}
PATCH /homes/{home_id}
DELETE /homes/{home_id}
```

### Areas

```text
POST /homes/{home_id}/areas
GET /homes/{home_id}/areas
PATCH /areas/{area_id}
DELETE /areas/{area_id}
```

### Rooms

```text
POST /homes/{home_id}/rooms
GET /homes/{home_id}/rooms
GET /rooms/{room_id}
PATCH /rooms/{room_id}
DELETE /rooms/{room_id}
```

### Devices

```text
POST /rooms/{room_id}/devices
POST /homes/{home_id}/devices
GET /homes/{home_id}/devices
GET /devices/{device_id}
PATCH /devices/{device_id}
DELETE /devices/{device_id}
```

### Maintenance Tasks

```text
POST /devices/{device_id}/tasks
GET /homes/{home_id}/tasks
GET /devices/{device_id}/tasks
GET /tasks/{task_id}
PATCH /tasks/{task_id}
DELETE /tasks/{task_id}
POST /tasks/{task_id}/complete
```

### Logs

```text
GET /devices/{device_id}/logs
GET /homes/{home_id}/logs
POST /devices/{device_id}/logs
```

### Dashboard

```text
GET /homes/{home_id}/dashboard
```

## Service-Layer Logic

Do not put business logic directly in route handlers.

Use a structure like:

```text
routers/tasks.py
services/task_service.py
repositories/task_repository.py
models/task.py
schemas/task.py
```

The important service method:

```text
complete_task(task_id, payload)
```

It should:

```text
1. Load the task
2. Validate that it is active
3. Create a MaintenanceLog
4. Set task.last_completed_at
5. Calculate next due date
6. Update task.due_date
7. Return updated task + created log
```

## Recurrence Logic V1

Implement a simple function:

```python
calculate_next_due_date(
    completed_at: date,
    recurrence_type: str,
    recurrence_interval: int
) -> date | None
```

Examples:

```text
monthly + interval 1 → next month
monthly + interval 3 → three months
yearly + interval 1 → next year
custom_days + interval 90 → completed_at + 90 days
none → null
```

Do not overbuild RRULE support yet.

## Tests

Minimum backend tests:

```text
create home
create room
create device
create recurring task
complete task creates log
complete task updates next due date
dashboard returns overdue task
dashboard returns due-soon task
```

## Deliverables

```text
FastAPI backend running
Postgres connected
Alembic migrations working
Core CRUD endpoints working
Task completion logic working
Backend tests passing
```

## Acceptance Criteria

```text
Can create a home, room, device, and task through API
Can complete a task through API
Completing task creates maintenance log
Task next due date updates correctly
GET /dashboard returns overdue and due-soon tasks
```

---

# Phase 2 — Core Mobile App Shell

## Goal

Create the React Native app structure and connect it to the backend.

## Mobile Structure

Use Expo Router.

Recommended tab structure:

```text
app/
  _layout.tsx
  (tabs)/
    dashboard.tsx
    rooms.tsx
    tasks.tsx
    devices.tsx
    settings.tsx
```

Later tabs:

```text
Inventory
Documents
Ask
```

## Main Tabs

```text
Dashboard
Rooms
Tasks
Devices/Search
Settings
```

## Frontend Libraries

Use:

```text
TanStack Query for API data
React Hook Form for forms
Zod for validation
Expo Router for routing
Zustand for lightweight global app state
```

## API Client

Create a simple API client:

```text
src/api/client.ts
src/api/homes.ts
src/api/rooms.ts
src/api/devices.ts
src/api/tasks.ts
```

Example methods:

```text
getDashboard(homeId)
getRooms(homeId)
getRoom(roomId)
createRoom(homeId, payload)
createDevice(roomId, payload)
createTask(deviceId, payload)
completeTask(taskId, payload)
```

Manual API client code is fine for the MVP. Generated OpenAPI clients can come later.

## Screens V1

### Dashboard Screen

Shows:

```text
Home name
Overdue tasks
Due soon tasks
Recently completed tasks
Quick actions
```

### Rooms Screen

Shows:

```text
List of rooms
Room name
Device count
Overdue task count
```

### Room Detail Screen

Shows:

```text
Room name
Devices in room
Add device button
```

### Device Detail Screen

Shows:

```text
Device name
Device metadata
Upcoming tasks
Maintenance history
Add task button
Complete task button
```

### Task Detail Screen

Shows:

```text
Task title
Due date
Instructions
Device
Complete task button
```

## Deliverables

```text
Mobile app can call FastAPI
Dashboard loads real data
Rooms list loads real data
Device detail loads real data
Can create room from mobile
Can create device from mobile
Can create task from mobile
Can complete task from mobile
```

## Acceptance Criteria

```text
User can complete full loop from phone:
Create room → create device → create task → complete task → see dashboard update
```

---

# Phase 3 — Rooms, Areas, and Device UX

## Goal

Make the home model feel intuitive.

This is where the app starts feeling like "Google Home for house operations."

## Area Support

Add area grouping:

```text
Main Floor
Second Floor
Basement
Exterior
Garage
Garden
```

Rooms should display grouped by area.

Example:

```text
Main Floor
  Kitchen
  Living Room
  Office

Basement
  Utility Room
  Storage Room

Exterior
  Deck
  Garden
  HVAC Pad
```

## Device Card Design

Each device card should show:

```text
Device name
Type
Room
Status
Next task due
Overdue badge if needed
```

Example:

```text
Whole-House Filter
Utility Room · Water Treatment
Next: Replace sediment filter in 12 days
```

## Device Detail Improvements

Add sections:

```text
Overview
Tasks
History
Parts
Documents
Notes
```

Implement only Overview, Tasks, and History first, but design the layout with future tabs in mind.

## Device Templates

Add simple templates to speed up device creation.

Example templates:

```text
HVAC System
Water Softener
Whole-House Filter
Refrigerator
Dishwasher
Dryer
Smoke Detector
Sump Pump
Router / Network
Deck
Garden Bed
```

When user selects "Water Softener," suggest starter tasks:

```text
Check salt monthly
Clean brine tank annually
```

When user selects "HVAC System," suggest:

```text
Replace filter every 60 days
Clean outdoor unit seasonally
Schedule service yearly
```

This can be hardcoded first.

## Deliverables

```text
Areas/floors supported
Rooms grouped by area
Device cards improved
Device detail page structured
Basic device templates added
```

## Acceptance Criteria

```text
User can add a water softener from a template
App suggests maintenance tasks
Device appears in room and dashboard
```

---

# Phase 4 — Maintenance Tasks and Logs

## Goal

Make maintenance tracking feel complete and useful.

## Task Types

Support these initially:

```text
Recurring task
One-time task
Inspection
Replacement
Cleaning
Service call
Refill
Seasonal task
```

## Task Fields

Add:

```text
title
description
device_id
due_date
recurrence_type
recurrence_interval
priority
estimated_minutes
instructions
requires_parts boolean
contractor_required boolean
```

## Completion Flow

When completing a task, mobile should show a form:

```text
Completed date
Notes
Cost
Performed by
Parts used
Photo optional later
```

Example:

```text
Task: Replace whole-house sediment filter

Completion form:
  Completed today
  Notes: Water pressure improved after replacement.
  Cost: $18
  Performed by: John
```

## Maintenance History

Device detail should show history:

```text
May 25, 2026
Replaced sediment filter
Notes: Water pressure improved.
Cost: $18

Feb 25, 2026
Replaced sediment filter
Notes: Filter was very dirty.
Cost: $18
```

## Manual Log

Allow adding a log without an existing task.

Example:

```text
HVAC tech replaced capacitor
```

This matters because not everything starts as a planned task.

## Deliverables

```text
Richer task model
Task completion form
Maintenance log list
Manual maintenance logs
Basic cost tracking per log
```

## Acceptance Criteria

```text
User can complete recurring task with notes and cost
User can add an unplanned repair log
Device history shows both planned and unplanned maintenance
```

---

# Phase 5 — Dashboard and Due-Date Engine

## Goal

Make the app useful immediately when opened.

The dashboard is the operational center.

## Dashboard Sections

Use these sections:

```text
Overdue
Due Soon
Upcoming
Recently Completed
Needs Attention
Quick Add
```

## Due-Date Buckets

Backend should calculate:

```text
overdue: due_date < today
due_soon: today through next 14 days
upcoming: next 15 through 60 days
```

## Home Health Score

Add a simple score.

Example:

```text
100 minus:
  10 points per critical overdue task
  5 points per high-priority overdue task
  2 points per medium overdue task
  1 point per low overdue task
```

Display:

```text
Home Health: 87%
2 overdue tasks
4 due soon
```

Do not overthink it. It is a simple heuristic.

## Task Prioritization

Sort dashboard tasks by:

```text
overdue first
priority
due date
device importance
```

## Quick Actions

Dashboard should include:

```text
Add device
Add task
Complete task
Add log
Scan QR later
```

## Deliverables

```text
Useful dashboard
Due-date buckets
Home health score
Recently completed tasks
Quick actions
```

## Acceptance Criteria

```text
Opening the app immediately tells the user what needs attention
Completing a task updates dashboard state
Overdue task disappears or moves to next due date after completion
```

---

# Phase 6 — Consumables and Inventory

## Goal

Track the parts and supplies needed to maintain the house.

This is one of the most practical features.

## New Entities

### Consumable

```text
id
home_id
name
category
sku nullable
brand nullable
size nullable
quantity_on_hand
reorder_threshold
preferred_vendor nullable
reorder_url nullable
notes nullable
created_at
updated_at
```

Examples:

```text
16x25x1 HVAC filter
Whole-house sediment filter
Water softener salt
Refrigerator water filter
AA batteries
Smoke detector batteries
Deck stain
Caulk
```

### DeviceConsumable

Many-to-many mapping:

```text
id
device_id
consumable_id
quantity_used_per_task
notes
```

Example:

```text
Whole-House Filter uses:
  1 sediment filter per replacement
```

### TaskConsumable

Optional mapping:

```text
task_id
consumable_id
quantity_required
```

## Inventory Behavior

When completing a task:

```text
If task has linked consumables:
  ask user whether to deduct from inventory
```

Example:

```text
Complete "Replace HVAC filter"
Deduct 1 16x25x1 filter? Yes
```

## Inventory Dashboard

Show:

```text
Low stock
Recently used
Common parts
Parts by device
```

Example:

```text
Low Stock
  16x25x1 HVAC Filter — 1 left
  Water Softener Salt — 0 bags
```

## Deliverables

```text
Consumables CRUD
Link consumables to devices
Link consumables to tasks
Deduct inventory on task completion
Low-stock dashboard
```

## Acceptance Criteria

```text
User can track filter quantity
Completing filter replacement deducts inventory
Dashboard shows low-stock alert
```

---

# Phase 7 — Photos, Documents, and Warranties

## Goal

Turn devices into complete records.

## New Entities

### Document

```text
id
home_id
device_id nullable
title
document_type
file_url
mime_type
uploaded_at
notes nullable
```

Document types:

```text
manual
receipt
warranty
invoice
quote
photo
inspection_report
other
```

### Warranty

```text
id
device_id
provider
warranty_type
start_date
end_date
terms_notes
document_id nullable
created_at
updated_at
```

## Photo Support

Support photo uploads for:

```text
device photo
model/serial plate
completed maintenance task
repair issue
receipt
warranty card
```

## Storage Approach

For MVP:

```text
local filesystem or simple object storage abstraction
```

Later:

```text
Azure Blob or S3
```

Create a storage service interface:

```python
class StorageService:
    def upload_file(...)
    def get_file_url(...)
    def delete_file(...)
```

This makes it easy to swap storage later.

## Device Document Tab

Show:

```text
Manuals
Receipts
Warranties
Invoices
Photos
Quotes
```

## Warranty Reminders

Add:

```text
warranty_end_date
warranty_expiring_soon
```

Dashboard can show:

```text
Dishwasher warranty expires in 45 days
```

## Deliverables

```text
Upload documents
Attach documents to devices
Upload photos
Track warranty dates
Show warranty expiration alerts
```

## Acceptance Criteria

```text
User can attach a manual PDF to a device
User can attach a receipt photo to a device
Dashboard can show upcoming warranty expiration
```

---

# Phase 8 — QR Codes and Field Workflow

## Goal

Make the app useful while physically standing near the device.

## QR Concept

Every device gets a QR code.

QR encodes something like:

```text
homeops://devices/{device_id}
```

Or for web fallback:

```text
https://homeops.app/devices/{device_id}
```

## QR Features

Add:

```text
Generate QR for device
Show QR in app
Print/share QR
Scan QR
Open device detail from scan
```

## Field Workflow

Scanning a QR should open:

```text
Device overview
Overdue tasks
Due soon tasks
Complete task
Add log
Add photo
View manual
```

Example:

```text
Scan water softener QR
  → Water Softener page opens
  → "Check salt" is overdue
  → Tap complete
  → Add note: "Added two bags"
  → Inventory deducts 2 salt bags
```

## Deliverables

```text
Device QR generation
QR scanner in mobile app
Deep link to device detail
Field workflow optimized
```

## Acceptance Criteria

```text
User can scan QR code and land directly on correct device
User can complete task from scanned device page
```

---

# Phase 9 — Search and Home Timeline

## Goal

Make the app feel like a searchable memory for the house.

## Global Search

Search across:

```text
rooms
devices
tasks
logs
consumables
documents metadata
vendors later
```

Example searches:

```text
filter
water softener
capacitor
salt
deck stain
warranty
```

## Timeline Events

Introduce a timeline/event table.

### HomeEvent

```text
id
home_id
entity_type
entity_id
event_type
title
description
occurred_at
created_at
```

Event types:

```text
device_created
task_created
task_completed
log_added
document_uploaded
inventory_used
warranty_added
issue_opened
issue_resolved
```

Timeline display:

```text
May 25, 2026
  Replaced whole-house sediment filter
  Added 2 bags of water softener salt

May 18, 2026
  HVAC inspection completed

May 3, 2026
  Added grape bed near garage
```

## Why This Matters

This is one of the most valuable product features.

Over time, the home gets a memory.

## Deliverables

```text
Global search
Device search
Home timeline
Device-specific timeline
Automatic event creation
```

## Acceptance Criteria

```text
Completing a task creates a timeline event
Uploading a document creates a timeline event
User can search for "filter" and find devices, tasks, logs, and consumables
```

---

# Phase 10 — AI / RAG Assistant

## Goal

Add intelligence after the structured app is already useful.

Do not build this first.

## AI Assistant Purpose

The assistant should answer questions from:

```text
structured database
maintenance logs
device notes
manuals
invoices
warranty documents
uploaded photos later
```

## Example Questions

```text
What filter does the upstairs heat pump use?
When did I last replace the whole-house filter?
Which devices have warranties expiring this year?
What did the HVAC tech replace last time?
How do I put the water softener in bypass mode?
What maintenance is overdue?
```

## Important Design Principle

Answer from structured data first.

Use RAG only when needed.

Example:

```text
Question:
"What size filter does the main floor heat pump use?"

Step 1:
Check Device.filter_size or linked consumable.

Step 2:
If missing, search manuals/docs.

Step 3:
Return answer with source.
```

## RAG Pipeline

### Document Ingestion

```text
Upload document
  → store file
  → extract text
  → chunk text
  → create embeddings
  → save chunks with document_id/device_id
```

### Query Flow

```text
User asks question
  → classify intent
  → query structured DB
  → retrieve relevant document chunks
  → generate answer
  → return sources
```

## New Entities

### DocumentChunk

```text
id
document_id
device_id nullable
chunk_index
text
embedding
page_number nullable
created_at
```

### AssistantQueryLog

```text
id
home_id
question
answer
sources
created_at
```

## Source-Backed Answers

Always return sources:

```text
Answer:
The whole-house filter uses a 4.5" x 10" sediment cartridge.

Sources:
- Device profile
- Uploaded manual: page 8
- Maintenance log from Feb 25, 2026
```

## Suggested Backend Endpoints

```text
POST /documents/{document_id}/ingest
POST /homes/{home_id}/ask
GET /documents/{document_id}/chunks
```

## Deliverables

```text
Document text extraction
Document chunking
Vector search
Ask endpoint
Mobile Ask screen
Source-backed answers
```

## Acceptance Criteria

```text
User can upload a manual
System indexes it
User can ask a question
Assistant returns a grounded answer with source references
```

---

# Phase 11 — Offline-First Sync

## Goal

Make the mobile app reliable in utility rooms, basements, garages, and outdoor areas.

This is advanced, so save it until the app works online.

## Offline Model

Mobile keeps a local queue of pending actions:

```text
TaskCompleted
DeviceCreated
LogAdded
PhotoAttached
InventoryAdjusted
```

Each action has:

```text
client_event_id
created_at
entity_type
entity_id
operation
payload
sync_status
retry_count
```

## Backend Idempotency

Every write should support an idempotency key.

Example:

```text
POST /tasks/{task_id}/complete
Idempotency-Key: abc-123
```

Backend stores processed keys to prevent duplicate logs.

## Sync Flow

```text
User completes task offline
  → save local event
  → optimistic UI update
  → when online, send event to API
  → backend processes idempotently
  → mobile marks event synced
```

## Conflict Examples

### Conflict 1 — Task Completed Offline on Two Devices

Resolution:

```text
Backend accepts first completion
Second completion becomes an additional log or is rejected as duplicate depending on idempotency/entity version
```

### Conflict 2 — Device Edited Offline While Deleted Elsewhere

Resolution:

```text
Return conflict
Mobile shows "This device was changed elsewhere"
```

## Deliverables

```text
Local SQLite event queue
Offline task completion
Sync retry logic
Idempotency keys
Conflict handling basics
```

## Acceptance Criteria

```text
User can complete a task while offline
Task appears completed locally
When connection returns, completion syncs exactly once
No duplicate logs are created
```

---

# Phase 12 — Polish, Observability, Deployment, and Demo Story

## Goal

Make the project production-shaped.

## Backend Polish

Add:

```text
structured logging
request IDs
error handling
pagination
input validation
rate limiting later
API docs cleanup
seed data
```

## Testing

Backend:

```text
unit tests
service tests
API tests
database integration tests
```

Frontend:

```text
component tests for forms
API mocking
basic screen tests
manual test plan
```

End-to-end later:

```text
create device
create task
complete task
verify dashboard update
```

## Observability

For backend:

```text
request latency
error rate
task completion events
document ingestion failures
background job failures
```

For mobile:

```text
API errors
screen load failures
sync failures
crashes
```

## Deployment

Simple deployment plan:

```text
Backend:
  Render, Fly.io, Azure App Service, or Azure Container Apps

Database:
  Managed Postgres

Files:
  Azure Blob or S3

Mobile:
  Expo development build
  Later TestFlight / Play Store internal testing
```

Since Azure is already familiar, a strong career-aligned deployment path would be:

```text
Azure App Service or Azure Container Apps
Azure Database for PostgreSQL
Azure Blob Storage
Application Insights
GitHub Actions
```

## Demo Data

Seed realistic home data:

```text
Home: Davidsonville House

Areas:
  Main Floor
  Second Floor
  Basement
  Exterior
  Garden

Rooms:
  Utility Room
  Kitchen
  Garage
  Back Deck
  Garden Beds

Devices:
  Water Softener
  Whole-House Filter
  Upstairs Heat Pump
  Main Floor Heat Pump
  Basement Heat Pump
  Refrigerator
  Dishwasher
  Dryer
  Router
  Garden Bed 1
  Garden Bed 2
```

## Final Demo Script

```text
1. Open dashboard
2. Show overdue filter replacement
3. Open Utility Room
4. Open Whole-House Filter
5. Show device details and maintenance history
6. Complete filter replacement
7. Add note and cost
8. Show next due date generated automatically
9. Show dashboard updated
10. Show inventory deducted
11. Upload manual
12. Ask: "What filter does this use?"
13. Show source-backed answer
14. Scan QR code and open device page
```

---

# Suggested Timeline

Assuming nights and weekends, this is best treated as a **6 to 8 week MVP**, not a weekend project.

## Week 1 — Backend Foundation

```text
Repo setup
FastAPI setup
Postgres setup
Models
Migrations
Basic CRUD
Backend tests
```

## Week 2 — Tasks and Logs

```text
MaintenanceTask model
MaintenanceLog model
Task completion endpoint
Recurrence engine
Dashboard endpoint
Tests
```

## Week 3 — Mobile Shell

```text
Expo app
Navigation
Dashboard screen
Rooms screen
Device detail screen
API client
TanStack Query setup
```

## Week 4 — Mobile Core Loop

```text
Create room
Create device
Create task
Complete task
Maintenance history
Dashboard refresh
```

At the end of Week 4, there should be a usable MVP.

## Week 5 — Inventory and Better UX

```text
Consumables
Link parts to devices/tasks
Deduct inventory
Low stock alerts
Better forms
Empty states
Loading/error states
```

## Week 6 — Documents and Photos

```text
Photo upload
Document upload
Attach documents to devices
Warranty dates
Device documents tab
```

## Week 7 — QR and Timeline

```text
QR generation
QR scanning
Deep linking
Home timeline
Search
```

## Week 8 — AI / RAG Starter

```text
Document ingestion
Text extraction
Chunking
Ask endpoint
Mobile Ask screen
Source-backed responses
```

---

# MVP Cut Line

The true MVP is done when this works:

```text
Create Home
  → Add Room
    → Add Device
      → Add Recurring Task
        → Complete Task
          → Auto-create Maintenance Log
            → Auto-generate Next Due Date
              → Dashboard Updates
```

Everything else is additive.

Do not let AI, QR, OCR, or offline sync block that loop.

---

# System Design Talking Points

This project gives strong interview material.

## Backend / System Design Concepts

```text
domain modeling
REST API design
recurrence logic
idempotent writes
background jobs
file ingestion
event logs
offline sync
conflict resolution
search
RAG
observability
```

## React / TypeScript Concepts

```text
component composition
typed API clients
forms
validation
navigation
server state
optimistic updates
loading/error states
mobile UX
```

## Python Concepts

```text
FastAPI
Pydantic validation
service-layer architecture
SQLAlchemy
Alembic migrations
pytest
background workers
document processing
RAG pipelines
```

---

# Recommended API Contract V1

```text
GET    /health

POST   /homes
GET    /homes
GET    /homes/{home_id}

POST   /homes/{home_id}/areas
GET    /homes/{home_id}/areas

POST   /homes/{home_id}/rooms
GET    /homes/{home_id}/rooms
GET    /rooms/{room_id}
PATCH  /rooms/{room_id}
DELETE /rooms/{room_id}

POST   /rooms/{room_id}/devices
GET    /homes/{home_id}/devices
GET    /devices/{device_id}
PATCH  /devices/{device_id}
DELETE /devices/{device_id}

POST   /devices/{device_id}/tasks
GET    /homes/{home_id}/tasks
GET    /devices/{device_id}/tasks
GET    /tasks/{task_id}
PATCH  /tasks/{task_id}
DELETE /tasks/{task_id}
POST   /tasks/{task_id}/complete

POST   /devices/{device_id}/logs
GET    /devices/{device_id}/logs
GET    /homes/{home_id}/logs

GET    /homes/{home_id}/dashboard
```

Later:

```text
POST   /homes/{home_id}/consumables
GET    /homes/{home_id}/consumables
PATCH  /consumables/{consumable_id}

POST   /devices/{device_id}/documents
GET    /devices/{device_id}/documents

POST   /devices/{device_id}/qr
POST   /documents/{document_id}/ingest
POST   /homes/{home_id}/ask
GET    /homes/{home_id}/timeline
GET    /homes/{home_id}/search
```

---

# Recommended Database Tables

## Start With

```text
users
homes
areas
rooms
devices
maintenance_tasks
maintenance_logs
```

## Add Next

```text
consumables
device_consumables
documents
warranties
home_events
```

## Add Later

```text
document_chunks
assistant_query_logs
sync_events
idempotency_keys
```

---

# Important Product Decisions

## Decision 1 — Room-First and System-First

Do not force everything into only rooms.

Some assets belong to systems.

Example:

```text
HVAC System
  Upstairs Heat Pump
  Main Floor Heat Pump
  Basement Heat Pump
```

But each unit can still have a room/location.

For MVP, use rooms only. Add systems later.

## Decision 2 — Device Profile Is the Center

Everything should orbit around the device:

```text
tasks
logs
documents
parts
warranties
issues
photos
timeline
```

This keeps the product intuitive.

## Decision 3 — Backend Owns Recurrence

The mobile app can preview due dates, but the backend should decide.

This prevents inconsistent behavior across clients.

## Decision 4 — Logs Are Permanent History

Tasks are current/future obligations.

Logs are historical truth.

Do not overwrite history when a task changes.

## Decision 5 — AI Should Be Grounded

The AI assistant should not be a generic chatbot.

It should answer from:

```text
structured data
logs
manuals
documents
notes
```

And it should show sources.

---

# Build Priorities

## Highest Priority

```text
Backend domain model
Task completion logic
Dashboard endpoint
Mobile dashboard
Device detail
Maintenance history
```

## Medium Priority

```text
Inventory
Documents
Photos
Warranty tracking
Search
QR
```

## Later Priority

```text
AI / RAG
Offline sync
Push notifications
Household collaboration
Contractor sharing
Advanced analytics
```

---

# What to Build First

Start with the backend, not the UI.

## Day 1 Target

```text
FastAPI app
Postgres via Docker Compose
SQLAlchemy models:
  Home
  Room
  Device
  MaintenanceTask
  MaintenanceLog
Alembic migration
GET /health
POST /homes
POST /homes/{home_id}/rooms
POST /rooms/{room_id}/devices
```

## Day 2 Target

```text
POST /devices/{device_id}/tasks
POST /tasks/{task_id}/complete
GET /homes/{home_id}/dashboard
recurrence logic
pytest tests
```

## Day 3 Target

```text
Expo app
Dashboard screen
Rooms screen
Device detail screen
Connect to FastAPI
```

---

# Final Recommendation

Build HomeOps as:

```text
React Native + Expo + TypeScript mobile app
Python + FastAPI backend
Postgres source of truth
Python workers later
RAG later
Offline sync later
```

The correct MVP is not an AI home assistant.

The correct MVP is:

```text
A reliable mobile maintenance loop:
Rooms → Devices → Tasks → Completion → Logs → Next Due Date → Dashboard
```

Once that loop works, the app becomes a strong foundation for inventory, documents, warranties, QR codes, search, RAG, offline sync, and eventually a real home operations assistant.
