import type { WithoutSystemFields } from "convex/server";
import type { Doc } from "./_generated/dataModel";

// Northwake's 36 starting Help articles. Holes are left on purpose: nothing
// here covers shipping samples between sites, AI tools, Durham parking,
// consultant laptops, budget transfers, rDNA approval, employment
// verification letters, or CRO accruals. The MTA, time off, file sharing, and
// hotel articles each leave one part out, and the MFA and badge access
// articles are out of date.
export const startingArticles: WithoutSystemFields<Doc<"helpArticles">>[] = [
  // Finance: Coupa
  {
    title: "Ordering lab supplies through a Coupa punchout",
    department: "Finance",
    system: "Coupa",
    contactTeam: "Procurement & AP",
    body: `Use a punchout catalog to buy lab supplies from Fisher Scientific, VWR, or Sigma-Aldrich at Northwake's negotiated prices. Your cart on the supplier's site comes back to Coupa as a requisition, so you never need a separate quote or purchase form.

1. In Coupa, open Shop and choose the supplier's punchout tile.
2. Search and add items to the cart on the supplier's site, then select Return to Coupa.
3. Check the quantities, the cost center, and the ship-to address (Cambridge or Durham).
4. Submit the requisition. Coupa sends it for approval and then sends the purchase order to the supplier automatically.
5. When the order arrives, receive it in Coupa so the invoice can be paid.

Northwake rules:
- Orders under $2,500 are approved by your manager. Orders of $2,500 or more also need Finance approval.
- Hazardous chemicals must ship to the receiving dock, never to a lab directly.
- Always use a punchout tile when the supplier has one. Don't buy lab supplies on a corporate card.

Questions about a punchout order go to Procurement & AP.`,
  },
  {
    title: "Requesting something that isn't in a Coupa catalog",
    department: "Finance",
    system: "Coupa",
    contactTeam: "Procurement & AP",
    body: `If an item or service isn't available through a punchout tile or catalog, request it with a free-form requisition. A buyer in Procurement reviews it before it goes for approval.

1. In Coupa, open Shop and select Write a Request.
2. Describe the item or service, and enter the supplier, the price, the quantity, and the date you need it.
3. Attach the supplier's quote, and add the cost center the purchase should be charged to.
4. Submit the request. A buyer may contact you to confirm details or find a better price.
5. Once approved, Coupa sends the purchase order to the supplier. You can follow its progress under Requisitions on your home page.

Northwake rules:
- Requests of $10,000 or more need three quotes, or a sole-source justification attached to the request.
- The supplier must already be set up in Coupa. If they aren't, add them first with a new supplier request.
- Services such as consulting or lab work also need a signed contract in Ironclad before the purchase order is sent.

Questions about free-form requisitions go to Procurement & AP.`,
  },
  {
    title: "Checking where a Coupa requisition is waiting for approval",
    department: "Finance",
    system: "Coupa",
    contactTeam: "Procurement & AP",
    body: `Every requisition follows an approval chain based on its amount and cost center. If yours seems stuck, Coupa shows exactly who it's waiting on.

1. In Coupa, select Requisitions on your home page, or search for the requisition number.
2. Open the requisition and scroll to the Approvals section.
3. The approval chain lists each approver in order. The current approver is marked Pending, and earlier approvers show the date they approved.
4. If an approver is out of office, ask your manager to approve on their behalf or contact Procurement & AP to reroute it.
5. If the requisition was rejected, read the comment, select Edit, fix the problem, and submit it again.

Northwake rules:
- Approvers have 3 business days to act. After that, Coupa sends a reminder and copies their manager.
- Requisitions charged to a cost center you don't own also need that cost center owner's approval.
- Don't create a second requisition for the same purchase while the first is pending, because duplicates delay both.

Questions about requisition approvals go to Procurement & AP.`,
  },
  {
    title: "Receiving an order in Coupa",
    department: "Finance",
    system: "Coupa",
    contactTeam: "Procurement & AP",
    body: `When an order arrives, record it as received in Coupa. Receiving tells Accounts Payable the goods arrived, so the supplier's invoice can be matched to the purchase order and paid.

1. In Coupa, open Orders, or follow the link in the "Your order has shipped" email.
2. Find the purchase order and select Receive.
3. Enter the quantity that arrived for each line. If only part of the order came, enter what you received, and receive the rest when it arrives.
4. For damaged or wrong items, enter 0 for that line and add a comment describing the problem.
5. Select Submit. The receipt appears on the purchase order's history.

Northwake rules:
- Receive orders within 5 business days of delivery. Unreceived orders hold up payment and can put a supplier on credit hold.
- The person who requested the order is responsible for receiving it, even if the receiving dock signed for the package.
- Service orders, such as equipment maintenance, are received when the work is complete.

Questions about receiving go to Procurement & AP.`,
  },
  {
    title: "Adding a new supplier in Coupa",
    department: "Finance",
    system: "Coupa",
    contactTeam: "Procurement & AP",
    body: `Before Northwake can buy from or pay a new supplier, the supplier must be set up in Coupa. You start the request, and the supplier enters their own banking and tax details.

1. In Coupa, open Requests and choose New Supplier Request.
2. Enter the supplier's name, contact person, contact email, and what Northwake will buy from them.
3. Explain why an existing supplier won't work, then submit the request.
4. Procurement reviews it and sends the supplier an invitation to the Coupa Supplier Portal.
5. The supplier fills in their banking, tax, and insurance information. Coupa emails you when the supplier is active.

Northwake rules:
- Search Coupa's supplier list first. Requests for a supplier that already exists are closed.
- Never collect bank details by email or phone. Suppliers enter them only in the Coupa Supplier Portal, and Procurement & AP verifies changes by calling a known contact.
- Suppliers who will handle Northwake's confidential information need a signed NDA before they're activated.

Questions about supplier setup go to Procurement & AP.`,
  },

  // Finance: Concur
  {
    title: "Submitting an expense report in Concur",
    department: "Finance",
    system: "Concur",
    contactTeam: "Procurement & AP",
    body: `Submit business expenses in Concur so you're reimbursed for what you paid personally, and so corporate card charges are accounted for.

1. In Concur, select Create, then Start a Report, and name it after the trip or the month.
2. Add each expense. Corporate card charges appear under Available Expenses, and you can add out-of-pocket expenses with Add Expense.
3. Choose the expense type, and attach a receipt photo to each expense. Receipts emailed to receipts@concur.com from your Northwake address appear automatically.
4. Check that the cost center is correct, then select Submit Report.
5. Your manager approves the report, and Procurement & AP audits it. Reimbursement arrives in your next payroll.

Northwake rules:
- Submit expenses within 30 days of the purchase.
- Receipts are required for any expense of $25 or more.
- Team meals need the names of everyone who attended, added under Attendees.

Questions about expense reports go to Procurement & AP.`,
  },
  {
    title: "Handling a missing or lost receipt in Concur",
    department: "Finance",
    system: "Concur",
    contactTeam: "Procurement & AP",
    body: `If you lost a receipt or never got one, you can still submit the expense in Concur with a missing receipt declaration in place of the receipt.

1. First, try to get a copy. Most hotels, airlines, and ride services can resend a receipt from your booking or account.
2. If you can't get one, open the expense in your Concur report.
3. Select Receipt Options, then Missing Receipt Declaration.
4. Read the declaration, describe what you bought and why, and select Accept & Create. The declaration is attached in place of the receipt.
5. Submit the report as usual. Your manager sees that a declaration was used.

Northwake rules:
- A credit card statement or bank statement isn't a receipt. It only shows the amount, not what was bought.
- Missing receipt declarations are allowed for expenses up to $250. Above that, contact Procurement & AP before submitting.
- More than three declarations in a calendar year are flagged for review with your manager.

Questions about missing receipts go to Procurement & AP.`,
  },
  {
    title: "Itemizing a hotel bill in Concur",
    department: "Finance",
    system: "Concur",
    contactTeam: "Procurement & AP",
    body: `Concur requires hotel bills to be itemized night by night, so the room rate, taxes, and any other charges each land in the right category.

1. In your report, open the hotel charge, or add a new expense with the type Hotel.
2. Enter the check-in and check-out dates, the hotel's name, and its city.
3. Select Itemize Nightly. Enter the room rate and room tax for one night, and Concur copies them to every night of the stay.
4. Add other charges from the folio as separate items, such as parking, Wi-Fi, or a business meal, each with its own expense type.
5. Make sure the itemized total matches the total on the hotel bill, then attach the itemized folio as the receipt.

Northwake rules:
- Attach the itemized folio from the hotel, not just the credit card slip.
- Movies, minibar, spa, and other personal charges aren't reimbursed. Itemize them with the type Personal so they're taken out of the total.
- Book hotels for Northwake travel through Concur Travel so the stay is covered by Northwake's travel insurance.

Questions about hotel expenses go to Procurement & AP.`,
  },
  {
    title: "Clearing corporate card charges in Concur",
    department: "Finance",
    system: "Concur",
    contactTeam: "Procurement & AP",
    body: `Charges on your Northwake corporate card flow into Concur automatically. Each one must be added to an expense report, even if nothing is owed back to you.

1. In Concur, open Expenses and look under Available Expenses. New card charges usually appear 1 to 3 days after the purchase.
2. Select the charges for a trip or month and choose Add to Report.
3. Pick the expense type and attach a receipt to each charge.
4. Submit the report. Northwake pays the card company directly, so you aren't reimbursed for card charges.
5. If a charge is personal or made by mistake, itemize it as Personal. The amount is deducted from your next paycheck unless you repay it first.

Northwake rules:
- Card charges must be submitted within 30 days of the transaction date.
- Charges older than 60 days that haven't been submitted can lead to your card being suspended.
- If a charge hasn't appeared after 5 days, or one you don't recognize appears, contact Procurement & AP. Report a lost or stolen card to the card company right away.

Questions about corporate card charges go to Procurement & AP.`,
  },
  {
    title: "Fixing a returned expense report in Concur",
    department: "Finance",
    system: "Concur",
    contactTeam: "Procurement & AP",
    body: `If your manager or Procurement & AP sends an expense report back, Concur emails you and the report's status changes to Returned. You fix it and submit the same report again.

1. In Concur, open Expenses and find the report marked Returned.
2. Select the report's history, or View Comments, to read why it was returned.
3. Fix each problem. Common fixes are attaching a missing receipt, changing the expense type, adding attendees, or correcting the cost center.
4. Add a comment explaining what you changed.
5. Select Submit Report. It goes back through the approval chain from the beginning.

Northwake rules:
- Resubmit a returned report within 10 business days, or it's closed and you'll need to start a new one.
- Don't delete a returned report and create a new one, because doing so loses the approval history.
- If you disagree with the reason for the return, reply to the reviewer in the report's comments before resubmitting.

Questions about returned reports go to Procurement & AP.`,
  },

  // HR: Workday
  {
    title: "Requesting time off in Workday",
    department: "HR",
    system: "Workday",
    contactTeam: "People Team",
    body: `Request vacation, sick time, and personal days in Workday. Your manager approves each request, and your balance updates automatically.

1. In Workday, select the Time Off and Leave app, then Request Time Off.
2. Select the days on the calendar and choose Request Time Off.
3. Choose the type, such as Vacation, Sick, or Personal, and check the hours for each day. Partial days are allowed.
4. Add a comment if it helps your manager, then select Submit.
5. Your manager approves or denies the request, and Workday emails you the result.

To check your balance, open the Time Off and Leave app and select Time Off Balance. Balances include requests that are approved but not yet taken.

Northwake rules:
- Request vacation of 3 or more days at least 2 weeks in advance.
- Full-time employees earn 15 vacation days a year, accrued each pay period, and 5 sick days granted each January.
- Sick time doesn't need advance approval. Enter it in Workday when you return.

Questions about time off go to the People Team.`,
  },
  {
    title: "Viewing pay stubs, tax forms, and direct deposit in Workday",
    department: "HR",
    system: "Workday",
    contactTeam: "People Team",
    body: `Your pay stubs, tax forms, and direct deposit settings are all in Workday's Pay app.

Northwake pays employees twice a month, on the 15th and the last business day of the month.

1. To see a pay stub, open the Pay app and select Payslips. Choose a pay date to view or print it.
2. To find your W-2, select Tax Documents in the Pay app. W-2s are posted by January 31 for the year before.
3. To change your tax withholding, select Withholding Elections, update your federal W-4 or state form, and submit it.
4. To change direct deposit, select Payment Elections, then Edit. Add the new account's routing and account numbers, and choose how much goes to each account.

Northwake rules:
- Direct deposit changes made by the 5th or the 20th of the month take effect on the next pay date. Later changes take effect one pay date after.
- Northwake will never ask for bank details by email or phone. Make changes only in Workday.
- Opt in to electronic W-2s under Tax Documents to get yours sooner.

Questions about pay or tax forms go to the People Team.`,
  },
  {
    title: "Updating your address and emergency contacts in Workday",
    department: "HR",
    system: "Workday",
    contactTeam: "People Team",
    body: `Keep your home address, phone number, and emergency contacts current in Workday. Payroll uses your address for tax forms and state taxes, and Workplace & EHS uses your emergency contacts if something happens at work.

1. In Workday, select your profile picture, then View Profile.
2. Select Contact, then Edit.
3. Update your home address, personal email, or phone number, and select Submit.
4. To change emergency contacts, select Contact, then Emergency Contacts, then Edit.
5. Add or update each contact's name, relationship, and phone number. Mark one as Primary, then submit.

Northwake rules:
- Update your address within 30 days of moving. A move to a different state changes your tax withholding, so also check Withholding Elections in the Pay app.
- Everyone who works in a lab or at the Durham manufacturing site must have at least one emergency contact on file.
- Legal name changes need a document, such as a marriage certificate or court order, uploaded with the change.

Questions about personal information go to the People Team.`,
  },
  {
    title: "Changing your benefits after a life event in Workday",
    department: "HR",
    system: "Workday",
    contactTeam: "People Team",
    body: `Outside open enrollment, you can change your benefits only after a qualifying life event, such as having or adopting a baby, getting married, or losing other coverage.

1. In Workday, open the Benefits app and select Change Benefits.
2. Choose the life event type, such as Birth/Adoption or Marriage, and enter the date it happened.
3. Upload proof, such as a birth certificate, hospital record, or marriage certificate.
4. Add your new dependent, with their name, date of birth, and relationship, and enroll them in each plan they should join.
5. Review your new costs per paycheck and select Submit. The People Team approves the event, and coverage starts on the date of the event.

Northwake rules:
- You have 30 days from the event to make changes in Workday. After that, you must wait for open enrollment in November.
- Dependents' Social Security numbers can be added later, but must be entered within 90 days.
- Northwake pays 90% of the medical premium for employees and 75% for dependents.

Questions about benefits go to the People Team.`,
  },
  {
    title: "Requesting a leave of absence in Workday",
    department: "HR",
    system: "Workday",
    contactTeam: "People Team",
    body: `A leave of absence covers longer time away, such as parental leave, medical leave, or caring for a family member. It's separate from regular time off.

1. Talk to your manager about the dates first, when you can.
2. In Workday, open the Time Off and Leave app and select Request Leave of Absence.
3. Choose the leave type, such as Parental, Medical, or Family Care, and enter the expected first and last days.
4. Select Submit. The People Team contacts you within 2 business days to explain your pay, benefits, and any state paid-leave program that applies.
5. Upload any documents the People Team asks for, such as a doctor's certification.

Northwake rules:
- Request a planned leave at least 30 days before it starts. For unexpected leave, request it as soon as you can.
- Northwake offers 16 weeks of fully paid parental leave to every parent after 6 months of employment.
- Your benefits continue during an approved leave, and your premiums are deducted from any pay you receive.

To return early or extend your leave, contact the People Team. Questions about leaves go to the People Team.`,
  },
  {
    title: "Completing your required training in Workday",
    department: "HR",
    system: "Workday",
    contactTeam: "People Team",
    body: `Workday assigns your required training based on your role and site. It tracks what you've finished and what's due.

1. In Workday, open the Learning app and select My Learning.
2. Under Required, you'll see each assigned course and its due date.
3. Select a course and choose Start. Online courses run in your browser and save your progress.
4. For in-person sessions, select a session date and choose Enroll.
5. When you finish, the course moves to Completed and your transcript updates automatically.

Every employee completes Code of Conduct and Information Security training each year. Lab staff also complete Lab Safety Basics before starting lab work, and Durham manufacturing staff complete GMP training on their site's schedule.

Northwake rules:
- New hires must finish their required training within 30 days of their start date.
- Workday emails you and your manager when training is 7 days overdue.
- Your manager can assign extra courses. They appear under Required with their own due dates.

Questions about training assignments go to the People Team.`,
  },
  {
    title: "Referring a candidate for an open role in Workday",
    department: "HR",
    system: "Workday",
    contactTeam: "People Team",
    body: `Know someone who'd be great at Northwake? Refer them in Workday, so a recruiter reviews them and you're credited for the referral.

1. In Workday, open the Jobs Hub and select Find Jobs to see open roles.
2. Open the role and select Refer a Candidate.
3. Enter the candidate's name and email, and attach their resume if you have it.
4. Explain how you know them and why they'd be a good fit, then select Submit.
5. Workday emails the candidate an invitation to apply. You can follow their progress under My Referrals.

Northwake rules:
- You earn a $3,000 referral bonus when your referral is hired and completes 90 days. Hiring managers and recruiters aren't eligible for referral bonuses for their own roles.
- The first employee to submit a candidate in Workday is credited. Referrals sent to a recruiter by email don't count.
- Only refer people you know and have spoken to about the role.

Questions about referrals go to the People Team.`,
  },

  // Legal: Ironclad
  {
    title: "Getting an NDA in place through Ironclad",
    department: "Legal",
    system: "Ironclad",
    contactTeam: "Legal Operations",
    body: `Put a nondisclosure agreement (NDA) in place before sharing confidential information with a vendor, academic lab, or potential partner. Ironclad generates Northwake's standard NDA from a short form.

1. In Ironclad, select New, then Start a Workflow, and choose NDA.
2. Fill in the other party's legal name, address, and signer, and choose Mutual or One-way (Northwake disclosing).
3. Describe the purpose, such as "evaluate a collaboration on lipid nanoparticle delivery."
4. Select Create. If you chose standard terms, Ironclad sends the NDA for signature right away.
5. If the other party wants to use their own paper or change terms, upload their draft. The workflow routes to Legal Operations for review instead.

Northwake rules:
- Never share confidential information, including unpublished data, sequences, or plans, before the NDA is fully signed.
- Use Northwake's template whenever possible. Reviews of the other party's paper take about 5 business days, and standard NDAs are usually signed within 1 day.
- NDAs run for 3 years. Check Ironclad for an existing NDA before starting a new one.

Questions about NDAs go to Legal Operations.`,
  },
  {
    title: "Requesting a material transfer agreement (MTA) in Ironclad",
    department: "Legal",
    system: "Ironclad",
    contactTeam: "Legal Operations",
    body: `A material transfer agreement (MTA) sets the terms for moving research materials, such as cell lines, plasmids, antibodies, or compounds, between Northwake and an outside organization like a university, hospital, or another company.

1. In Ironclad, select New, then Start a Workflow, and choose Material Transfer Agreement.
2. Choose whether Northwake is sending or receiving the material.
3. Enter the other organization, its scientist, the material, and what it will be used for.
4. If the other organization offers the UBMTA or its own template, upload it. Otherwise, Ironclad uses Northwake's template.
5. Submit the workflow. Legal Operations reviews it and sends it for signature.

Northwake rules:
- No material may be shipped or accepted until the MTA is fully signed in Ironclad.
- Materials involving human samples or patient data also need review by Northwake's Privacy team, which Legal Operations arranges.
- Expect about 10 business days for an MTA on the other organization's template, and 3 business days on the UBMTA.

Questions about MTAs go to Legal Operations.`,
  },
  {
    title: "Setting up a consulting agreement with a scientific advisor",
    department: "Legal",
    system: "Ironclad",
    contactTeam: "Legal Operations",
    body: `Scientific advisors and other consultants need a signed consulting agreement before they start work or receive confidential information.

1. In Ironclad, select New, then Start a Workflow, and choose Consulting Agreement.
2. Enter the consultant's name and email, their institution if they're an academic, and a short description of the services.
3. Enter the rate, the expected hours or a fixed fee, and the start and end dates.
4. Select Submit. Legal Operations checks for conflicts, such as rules at the consultant's university, and sends the agreement for signature.
5. After it's signed, create a Coupa requisition for the fees so the consultant can be paid.

Northwake rules:
- Every consulting agreement includes Northwake's confidentiality and invention assignment terms. These can't be removed.
- Consulting fees above $500 an hour, or more than $100,000 a year, need approval from the Chief Scientific Officer.
- Former employees can't be engaged as consultants within 6 months of leaving without People Team approval.

Questions about consulting agreements go to Legal Operations.`,
  },
  {
    title: "Requesting an MSA or SOW with a CRO or CDMO",
    department: "Legal",
    system: "Ironclad",
    contactTeam: "Legal Operations",
    body: `Work with a contract research organization (CRO) or contract development and manufacturing organization (CDMO) needs a master services agreement (MSA). Each project under it gets its own statement of work (SOW).

1. In Ironclad, check whether Northwake already has an MSA with the provider. Search the repository by their name.
2. If there's no MSA, select New, then Start a Workflow, and choose Master Services Agreement. Legal Operations negotiates it with the provider.
3. For each project, start a Statement of Work workflow and link it to the MSA.
4. Upload the provider's proposal and budget, and enter the cost center and project code.
5. Submit the workflow. After the SOW is signed, create a Coupa requisition for the SOW amount.

Northwake rules:
- SOWs over $250,000 need approval from the department's VP and the CFO before signature.
- Any work involving patients or clinical samples needs a Quality review, which Ironclad adds automatically.
- Change orders that raise an SOW's budget by more than 10% go through a new Change Order workflow in Ironclad.

Questions about CRO and CDMO agreements go to Legal Operations.`,
  },
  {
    title: "Finding a signed contract or checking for an existing NDA in Ironclad",
    department: "Legal",
    system: "Ironclad",
    contactTeam: "Legal Operations",
    body: `Every contract Northwake signs is stored in Ironclad's repository. Check there before starting a new agreement, because there may already be one in place.

1. In Ironclad, open Repository.
2. Search by the other party's name. Try short versions too, like "Broad" rather than "The Broad Institute of MIT and Harvard."
3. Filter by Contract Type, such as NDA, MTA, or MSA, and by Status, to show only active agreements.
4. Open a record to see its key terms, such as the effective date, expiration date, and signers, and to download the signed PDF.
5. If you can't see a contract you expected, it may be restricted. Ask Legal Operations for access.

Northwake rules:
- An NDA covers only the purpose it states. If your project is different, start a new NDA even if one exists.
- Don't save signed contracts on SharePoint or email them around. Share the Ironclad link instead.
- Contracts signed outside Ironclad must be uploaded to the repository within 5 business days.

Questions about finding contracts go to Legal Operations.`,
  },
  {
    title: "Who can sign a contract, and how to send one for signature in Ironclad",
    department: "Legal",
    system: "Ironclad",
    contactTeam: "Legal Operations",
    body: `Only certain people can sign contracts for Northwake. Ironclad routes each contract to the right signer automatically, based on its value.

1. Finish the contract's workflow in Ironclad and get any needed approvals.
2. Select Send for Signature. Ironclad adds Northwake's signer based on the signature authority rules below.
3. Check the other party's signer name and email, then send. Ironclad emails both signers.
4. Track status on the workflow page. You can resend the email or change the other party's signer until they sign.
5. If you sent the wrong version, select Cancel Signature, fix the document, and send it again.

Northwake rules:
- Directors can sign NDAs and MTAs on Northwake's templates. VPs can sign contracts up to $250,000. The CFO or CEO signs anything above that.
- Employees without signature authority must never sign a contract for Northwake, even an online click-through agreement.
- Every contract must be signed through Ironclad, so the signed copy lands in the repository.

Questions about signatures go to Legal Operations.`,
  },

  // Ops: ServiceNow
  {
    title: "Reporting broken lab equipment or a freezer alarm",
    department: "Ops",
    system: "ServiceNow",
    contactTeam: "Workplace & EHS",
    body: `Report broken lab equipment, building problems, and equipment alarms in ServiceNow so Workplace & EHS can send the right technician.

For an alarming freezer or incubator holding samples, call the Workplace & EHS on-call line on the label of the unit first, then file the request. Don't wait for an email reply.

1. In ServiceNow, open the Employee Center and select Report a Problem, then Lab Equipment.
2. Enter the equipment's asset tag, found on the silver sticker on the unit, and its location.
3. Describe what's wrong and when it started, and attach a photo of any error message.
4. Set the urgency. Choose High if samples or experiments are at risk.
5. Submit the request. A technician contacts you, and you can follow progress in My Requests.

Northwake rules:
- If a -80°C freezer rises above -60°C, move the samples to the backup freezer listed on the unit's label.
- Don't call equipment vendors directly. Workplace & EHS manages service contracts and warranties.
- Tag broken equipment with a red Out of Service tag so no one else uses it.

Questions about equipment repairs go to Workplace & EHS.`,
  },
  {
    title: "Getting badge access to a lab suite",
    department: "Ops",
    system: "ServiceNow",
    contactTeam: "Workplace & EHS",
    body: `Your badge opens the main doors at your site on your first day. Lab suites, the vivarium, and other restricted areas need access added to your badge.

1. Email Facilities with your name, your badge number (printed on the back of your badge), and the suite or area you need, such as "Cambridge Lab 4B."
2. Copy your manager on the email and ask them to reply approving the access.
3. Facilities programs your badge, usually within 2 business days, and replies when it's done.
4. Test your badge at the suite door. If it doesn't work, reply to the same email thread.

Northwake rules:
- Your manager must approve access to every restricted area. Facilities can't add access without the manager's reply.
- Never lend your badge or let someone follow you through a badge door. Everyone must badge in individually.
- Report a lost badge to Facilities right away, so the badge can be turned off. Replacement badges are picked up at your site's front desk.

Access to the Durham manufacturing floor also needs GMP gowning qualification, which the Durham Quality team arranges.

Questions about badge access go to Workplace & EHS.`,
  },
  {
    title: "Registering a guest at Cambridge or Durham",
    department: "Ops",
    system: "ServiceNow",
    contactTeam: "Workplace & EHS",
    body: `Register every guest ahead of time in ServiceNow, including candidates, vendors, and collaborators. Front desk staff print a guest badge from the registration when they arrive.

1. In ServiceNow, open the Employee Center and select Register a Guest.
2. Choose the site, Cambridge or Durham, and the date and time of the visit.
3. Enter each guest's name, company, and email. ServiceNow emails them the address and check-in instructions.
4. Say whether the guest will enter a lab or the manufacturing floor.
5. Submit the registration. The front desk messages you on Teams when your guest checks in.

Northwake rules:
- Register guests at least 1 business day ahead. Unregistered guests wait at the front desk until their host comes down.
- Guests must be escorted by their host at all times, and can't enter a lab without safety glasses and a lab coat from the front desk.
- Guests from outside Northwake who will discuss confidential work need a signed NDA before the visit. Check Ironclad.

Questions about guests go to Workplace & EHS.`,
  },
  {
    title: "Arranging hazardous waste pickup",
    department: "Ops",
    system: "ServiceNow",
    contactTeam: "Workplace & EHS",
    body: `Chemical, biological, and sharps waste must be collected by Workplace & EHS. Never pour chemicals down the drain or put biohazard waste in regular trash.

1. Collect waste in the right container. Chemical waste goes in labeled bottles in your lab's satellite accumulation area. Biological waste goes in red biohazard bags inside a rigid bin. Sharps go in a sharps container.
2. Label each chemical waste container with its full contents. Don't use abbreviations or formulas.
3. When a container is three-quarters full, open ServiceNow and select Request a Service, then Hazardous Waste Pickup.
4. Enter the lab, the waste type, and the number and size of containers.
5. Submit the request. Workplace & EHS picks it up within 2 business days.

Northwake rules:
- Chemical waste containers must stay closed except when adding waste.
- Satellite accumulation areas can't hold more than 55 gallons of chemical waste. Request a pickup sooner if you're close.
- Unknown or unlabeled chemicals need a special pickup. Note it in the request, and don't try to identify them yourself.

Questions about hazardous waste go to Workplace & EHS.`,
  },
  {
    title: "Requesting a desk, chair, or workspace change",
    department: "Ops",
    system: "ServiceNow",
    contactTeam: "Workplace & EHS",
    body: `Request a desk move, ergonomic equipment, or furniture changes in ServiceNow. Workplace & EHS handles workspace requests at both sites.

1. In ServiceNow, open the Employee Center and select Request a Service, then Workspace.
2. Choose the request type: Ergonomic Assessment, Furniture or Equipment, or Desk Move.
3. Enter your site, floor, and desk number, and describe what you need.
4. For a desk move, add your manager as an approver and give your preferred move date.
5. Submit the request. Workplace & EHS schedules the work and updates the request when it's done.

Northwake rules:
- Anyone can request a free ergonomic assessment. Equipment it recommends, such as a sit-stand converter or a different chair, is provided at no cost to you.
- Desk moves happen on Fridays after 3 p.m. Pack your belongings in the crates Workplace & EHS delivers. IT reconnects your monitors.
- Don't move furniture yourself or bring in your own chairs or space heaters, for safety reasons.

Questions about workspace requests go to Workplace & EHS.`,
  },
  {
    title: "Checking the status of a ServiceNow request",
    department: "Ops",
    system: "ServiceNow",
    contactTeam: "Workplace & EHS",
    body: `Every request you submit in ServiceNow, such as an equipment repair, a workspace change, or an access request, gets a number and a status you can follow.

1. In ServiceNow, open the Employee Center and select My Requests in the top menu.
2. Find your request by its number (it starts with REQ or INC) or by its title.
3. Open it to see its current state, such as New, In Progress, Awaiting Info, or Resolved, and the team working on it.
4. If the state is Awaiting Info, read the latest comment and reply in the request's activity stream. The clock pauses until you answer.
5. To add details or ask for an update, write a comment in the activity stream. The assigned team is notified.

Northwake rules:
- Reply in ServiceNow, not by email or Teams, so the whole history stays in one place.
- Requests in Awaiting Info for 5 business days without a reply are closed automatically.
- If a resolved request isn't actually fixed, select Reopen within 7 days instead of filing a new one.

Questions about a Workplace request go to Workplace & EHS.`,
  },

  // IT
  {
    title: "Resetting your Microsoft 365 password",
    department: "IT",
    system: "Microsoft 365",
    contactTeam: "IT Service Desk",
    body: `Reset your own Northwake password at any time without calling the IT Service Desk. Your Microsoft 365 password also signs you in to Workday, Coupa, Concur, Ironclad, and ServiceNow.

1. Go to the Microsoft sign-in page and select Forgot my password, or Can't access your account.
2. Enter your Northwake email and the characters shown, then select Next.
3. Complete the verification step with your registered sign-in method.
4. Choose a new password and confirm it.
5. Sign in again on your laptop, phone, and any other devices so they pick up the new password. On your laptop, connect to the office network or VPN first.

Northwake rules:
- Passwords must be at least 14 characters and can't reuse your last 5.
- Passwords expire every 365 days. Microsoft 365 warns you 14 days before.
- Never share your password, including with IT staff. The IT Service Desk will never ask for it.

If the reset doesn't work or your account is locked, contact the IT Service Desk.`,
  },
  {
    title: "Moving MFA to a new phone",
    department: "IT",
    system: "Microsoft 365",
    contactTeam: "IT Service Desk",
    body: `Northwake uses text message (SMS) codes for multifactor authentication (MFA). When you get a new phone or a new number, add it to your account before you give up the old one.

1. On your laptop, go to My Sign-Ins (mysignins.microsoft.com) and sign in with your Northwake account.
2. Select Security info, then Add sign-in method, and choose Phone.
3. Enter your new mobile number and choose Text me a code.
4. Enter the 6-digit code sent to your new phone and select Next.
5. Set the new number as your default sign-in method, then delete the old number.

If you keep the same number on your new phone, you don't need to change anything. Codes will arrive on the new phone.

Northwake rules:
- Keep at least one working phone number on your account at all times.
- Use a mobile number that you control. Landlines and shared phones aren't allowed.
- If you already lost access to your old number, contact the IT Service Desk to have your MFA reset.

Questions about MFA go to the IT Service Desk.`,
  },
  {
    title: "Requesting access to an app or SharePoint site",
    department: "IT",
    system: "ServiceNow",
    contactTeam: "IT Service Desk",
    body: `Request access to Northwake software, shared drives, and SharePoint sites in ServiceNow. The owner of the app or site approves each request.

1. In ServiceNow, open the Employee Center and select Request Access.
2. Search for the app or SharePoint site, such as "Benchling" or "Finance SharePoint."
3. Choose the access level you need, such as Read or Edit, and explain why you need it.
4. Submit the request. It goes to your manager first, and then to the app or site owner.
5. When access is granted, ServiceNow emails you. Sign out and back in if you don't see the app right away.

For a SharePoint site, you can also select Request access on the site's "You need permission" page. That sends the request straight to the site owner.

Northwake rules:
- Request only the access your work needs. Access to sensitive systems, such as finance or HR data, is reviewed every quarter.
- Never share your account to give someone access. Ask them to request their own.
- Access is removed automatically when you change roles, so request it again for your new team's apps.

Questions about access go to the IT Service Desk.`,
  },
  {
    title: "Sharing files with people outside Northwake",
    department: "IT",
    system: "Microsoft 365",
    contactTeam: "IT Service Desk",
    body: `Share documents such as slides, reports, and drafts with outside collaborators from OneDrive or SharePoint. Don't attach confidential files to email.

1. In OneDrive or SharePoint, select the file or folder and choose Share.
2. Select the link settings and choose Specific people. Links that work for anyone are turned off at Northwake.
3. Enter the collaborator's email address. They'll get a code by email to open the file.
4. Choose Can view, or Can edit if they need to make changes.
5. Set an expiration date for the link, then select Send.

To stop sharing, open Manage Access on the file and remove the person or the link.

Northwake rules:
- External links expire after 90 days at most. Choose a shorter expiration when you can.
- Confidential information may be shared only with organizations that have a signed NDA in Ironclad.
- Share from a Teams or SharePoint site, not your personal OneDrive, for anything your team will need after the project ends.

Questions about sharing files go to the IT Service Desk.`,
  },
  {
    title: "Setting up an out-of-office reply or shared mailbox in Outlook",
    department: "IT",
    system: "Microsoft 365",
    contactTeam: "IT Service Desk",
    body: `Use automatic replies in Outlook to let people know you're away, and use shared mailboxes for team inboxes such as a lab group or a department.

To set an out-of-office reply:
1. In Outlook, open Settings, then Mail, then Automatic replies.
2. Turn on automatic replies and set the start and end times.
3. Write one message for people inside Northwake and, if you like, a shorter one for outside senders.
4. Select Save.

To get added to a shared mailbox:
1. In ServiceNow, select Request Access and search for Shared Mailbox.
2. Enter the mailbox's address and submit the request. The mailbox owner approves it.
3. The mailbox appears in Outlook within a few hours. Restart Outlook if it doesn't.

Northwake rules:
- Out-of-office replies should name a backup contact for urgent questions, but never your personal phone number.
- Your replies to outside senders shouldn't say where you're traveling or for how long.
- New shared mailboxes need a named owner who reviews membership every year.

Questions about Outlook go to the IT Service Desk.`,
  },
  {
    title: "Fixing a conference room that won't connect to Teams",
    department: "IT",
    system: "Microsoft 365",
    contactTeam: "IT Service Desk",
    body: `Every Northwake conference room has a Microsoft Teams Room system: a touch panel on the table, a room camera, and the wall screen. Most connection problems take one of the fixes below.

1. Check that the touch panel shows your meeting. If it doesn't, invite the room's mailbox to the meeting in Outlook, such as "CAM-3 Charles River," and wait one minute.
2. Join from the touch panel, not your laptop. If you also join from your laptop, mute it and turn its speaker off to stop echo.
3. To share your screen, plug in the HDMI cable on the table, or share from Teams on your laptop with "Include computer sound" off.
4. If the screen stays blank, press the power button on the remote, then check that the screen's input is set to the Teams Room.
5. If the panel is frozen, select Settings, then Restart, on the touch panel. It takes about 2 minutes.

Northwake rules:
- Don't unplug or reconnect cables behind the screen. Report the problem instead.
- Book rooms through Outlook so they show up in Teams. Paper sign-up sheets aren't used.

If none of these steps work, report the room to the IT Service Desk with the room name.`,
  },
  {
    title: "Getting your laptop repaired or replaced",
    department: "IT",
    system: "Microsoft 365",
    contactTeam: "IT Service Desk",
    body: `If your Northwake laptop is broken, very slow, or due for a refresh, request a repair or replacement in ServiceNow.

1. Restart the laptop and install any pending updates. Many slowness problems clear up after an update.
2. In ServiceNow, open the Employee Center and select Report a Problem, then Laptop.
3. Describe the problem, and include the laptop's asset tag, found on the sticker on the bottom.
4. Submit the request. The IT Service Desk contacts you to troubleshoot remotely or set up a swap.
5. For a replacement, IT prepares a new laptop with your apps installed. Your files sync back from OneDrive when you sign in.

Northwake rules:
- Laptops are replaced every 4 years. Earlier replacement needs a repair that isn't worth doing, as decided by the IT Service Desk.
- Save your work to OneDrive, not just the laptop. IT can't recover files saved only on a broken laptop.
- Report a lost or stolen laptop to the IT Service Desk within 24 hours, so it can be locked and wiped remotely.

Questions about laptops go to the IT Service Desk.`,
  },
];
