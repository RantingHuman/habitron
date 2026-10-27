# Habitron

A personal habit tracker, inspired by Loop Habit Tracker, for recording which habits you kept each day and how consistently you keep them over time.

## Language

### Habits

**Habit**:
Something the user intends to do on a recurring schedule, tracked day by day.
_Avoid_: Goal, task

**Yes/no habit**:
A habit whose check-ins only say whether it was done.
_Avoid_: Boolean habit, checkbox habit

**Measurable habit**:
A habit whose check-ins record an amount in the habit's unit, such as glasses or minutes, judged against its target. A habit's kind (yes/no or measurable) is fixed when it is created.
_Avoid_: Numeric habit, quantity habit

**Target**:
The amount a measurable habit aims for each due day: either at least or at most that many units. A target change applies from the day it is made; earlier days are judged against the target they had.
_Avoid_: Goal, threshold

**Schedule**:
The rule that decides a habit's due days: every day, chosen weekdays, or every N days. A schedule change applies from the day it is made; earlier days keep the schedule they had.
_Avoid_: Frequency

**Start date**:
The first day a habit counts. It moves earlier when the user records a check-in on a day before it.
_Avoid_: Created date

**Due day**:
A day the habit's schedule expects it to be done, on or after its start date, outside any pause, and while the habit is not archived.
_Avoid_: Scheduled day

**Pause**:
A period during which a habit has no due days and takes no check-ins, so it neither builds nor breaks a streak. A pause may cover past or future days but not days before the start date, and pausing days removes any check-ins on them. A pause either ends on the day the habit resumed or is still open. Pauses never overlap. A pause can be changed or removed afterwards; that brings back due days but not the check-ins it removed.

**Archived habit**:
A habit the user has stopped doing but whose history is kept. While archived it is hidden, has no due days, and cannot take check-ins; it can be restored. Deleting a habit is different: it permanently removes the habit and its check-ins.
_Avoid_: Inactive

### Check-ins

**Check-in**:
The record of what happened with a habit on one day: done or skipped, or for a measurable habit, the amount recorded.
_Avoid_: Log, completion, entry, repetition

**Done**:
A day that meets the habit: for a yes/no habit, a check-in marked done; for a measurable habit, an amount that meets its target. For an at-most habit an empty day counts as zero and so is done. A measurable amount short of an at-least target is partial progress, not done.

**Skip**:
A check-in marking a due day as excused: it neither counts towards nor breaks a streak. There is no limit on skips.

**Missed day**:
A due day that has passed with no check-in. Missing is never recorded explicitly; it is implied by the empty day. At-most habits have no missed days, because an empty day is done.

**Failed day**:
A due day that has passed without being done or skipped: a missed day, partial progress short of an at-least target, or an amount over an at-most limit.

**Bonus check-in**:
A check-in on a day that is not a due day. It raises the strength score (a measurable amount in proportion to its target) but never counts towards a streak. At-most habits are not judged on days that are not due.

**Reminder**:
A notification at the habit's chosen time on a due day that is not yet done or skipped. At-most habits have no reminders, because their days are done until the limit is passed.

### Progress

**Strength score**:
How established a habit is, from 0 to 100%, weighting recent due days most. Done days and bonus check-ins raise it, failed days lower it, partial progress counts as that fraction of a done day, and skips and pauses leave it unchanged. It is per habit; there is no overall score.
_Avoid_: Habit score, completion rate

**Streak**:
The number of consecutive due days, ending today or yesterday, that are done, passing over skips. Today does not break a streak until it has passed.
