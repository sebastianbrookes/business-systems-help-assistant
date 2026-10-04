# Help assistant demo

A demo helpdesk assistant for Northwake Therapeutics, a fictional biotech, serving its business-support (G&A) teams. Built as a resume project.

## Language

**Employee**:
A person at the fictional company asking how to get something done in a business system.
_Avoid_: User, requester, customer

**Help article**:
A how-to document for one task in one business system, written for Employees.
_Avoid_: Doc, KB entry, documentation page

**Gap**:
An Employee question the Help articles fail to answer, because no article matches, the matching articles don't cover it, or the Employee says the answer didn't help.
_Avoid_: Miss, unanswered ticket, failure

**Gap group**:
Gaps that ask the same thing in different words. The IT team acts on a Gap group, not on single Gaps. A Gap group is Open (no action yet), Drafted (a Draft article awaits approval), or Resolved (its article is approved).
_Avoid_: Topic, cluster, category

**Off topic**:
A question that isn't about getting something done in a business system, such as a lab-technique question or small talk. It is never a Gap.
_Avoid_: Spam, invalid, irrelevant

**Draft article**:
A new Help article, or a revision of an existing one, that the assistant writes for a Gap group when the IT team asks. It goes live only after the IT team fills in anything the assistant couldn't source and approves it.
_Avoid_: Suggestion, auto-article

**IT team**:
The fictional company's G&A IT staff, who own the Help articles and act on Gaps.
_Avoid_: Admin, support, helpdesk

**IT team notes**:
Facts the IT team knows that no Help article states yet. They fill a Draft article's [Check: …] placeholders and are never used to answer Employees.
_Avoid_: Knowledge base, internal docs, wiki

## The showcase

**Visitor**:
A real person using the public demo, who plays both an Employee and the IT team.
_Avoid_: User, recruiter, guest

**Start over**:
A Visitor drops their activity from view and sees the demo as on a first visit. Their earlier activity is kept for Sebastian's review.
_Avoid_: Reset, clear history

**Suggested question**:
A pre-written question offered to Visitors, with a saved answer.
_Avoid_: Example prompt, sample question, starter

**Test set**:
A fixed list of questions with known right outcomes, kept apart from the question history and run against the starting data to measure the assistant.
_Avoid_: Eval, benchmark, sample

**Known gap**:
A hole left in the Help articles on purpose that the assistant can detect without an Employee's help, so a No match or Not covered hole that no approved article has closed.
_Avoid_: Planted gap, test gap
