# 05: Fill from IT notes

**What to build:** The IT team can fill a draft's placeholders from the IT team notes with one click. The fill uses only the notes and leaves anything the notes don't state empty for the Visitor to type. This is second on the cut list.

**Blocked by:** 02 (Northwake's Help articles and IT team notes), 04 (Draft article and approval)

**Status:** ready-for-agent

- [x] **Fill from IT notes** sends the draft and the IT team notes to a second AI call. It works on any Gap group, including a Visitor's own.
- [x] Only placeholders the notes back are filled. All others stay as [Check: …].
- [x] The rDNA approval and CRO accruals drafts keep their placeholders empty.
- [ ] If limits exist (ticket 06), each click counts as one AI call.
- [x] Tests cover a fill that uses only the notes and a placeholder left empty when the notes don't state the fact.

## Comments

**2026-10-04, implementation:** All boxes are met except the limits box, which waits on ticket 06. `convex/fillFromNotes.test.ts` covers a fill on the starting time off draft that sends only the draft and the notes, a placeholder left empty on a Visitor's own rDNA draft, and no AI call without a pending draft or placeholders. The AI call is in `convex/fillFromNotes.ts`, and the action is `draftArticles.fill`.

How it works: the model never returns the draft. For each numbered placeholder it returns a fact and the number of the note that states it, or null for both. The code puts in only facts that name a real note, so the rest of the draft can't change and a guess with no note is dropped. Filling saves the draft as the Visitor's own, like any edit. With no placeholders left, it makes no call, and the button is hidden.

For ticket 06: count `draftArticles.fill` as one AI call, but only when it reaches `fillFromNotes`' model call.

Checked against `openai/gpt-6-luna` with the real notes. The time off draft got 40 hours, January 1, and March 31. Hand-written rDNA and CRO accruals drafts, with 6 placeholders each, came back unchanged. In the browser on the dev deployment, the time off group showed "Filled 3 from the IT team notes" and Approve was enabled.

**2026-10-04, review fixes:** A fill is also dropped when the fact states a number its cited note doesn't, or contains a bracket. Facts with "$", such as "$325", are now inserted as written. The placeholder pattern lives in `convex/placeholders.ts`, shared by approval, the fill, and the UI. The action returns `filledCount` for the "Filled N" message. Two small risks remain. A slow fill overwrites anything saved to the same draft from another tab in the meantime. A fill that pushes the body past 5,000 characters fails after the AI call.

**2026-10-04, sign-off:** Sebastian ran the demo locally and confirmed that Fill from IT notes works on the time off draft and leaves the rDNA draft's placeholders empty.
