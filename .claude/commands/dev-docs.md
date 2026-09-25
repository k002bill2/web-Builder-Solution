---
description: Create comprehensive dev docs for approved plan
---

Based on the approved plan, create three development documents:

1. Create `dev/active/$ARGUMENTS/[task-name]-plan.md`
   - Copy the full approved plan
   - Add timeline and phases
   - Include success metrics

2. Create `dev/active/$ARGUMENTS/[task-name]-context.md`
   - List all relevant files
   - Document key architectural decisions
   - Note any constraints or dependencies
   - Add "Next Steps" section
   - Timestamp: current date

3. Create `dev/active/$ARGUMENTS/[task-name]-tasks.md`
   - Convert plan into detailed checklist
   - Group by component/service
   - Use checkbox format [ ] / [x]
   - Add completion counts per section

$ARGUMENTS is the task name (e.g., user-dashboard).
If not provided, ask the user for the task name.
