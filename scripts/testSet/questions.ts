// The fixed Test set, written after the app was finished and kept apart from
// the history questions: none copies or closely rewords one. Prompts are never
// tuned on it. Fixing failures means writing a fresh Test set.
//
// 120 questions, run in this order: 74 answerable (2 for each of the 37 Help
// articles a new Visitor sees, 10 naming a system Northwake doesn't use), 33
// Known gap questions (3 phrasings of each of the 11 Known gaps), and 13 Off
// topic. AI wrote 100. Sebastian writes the 20 marked `bySebastian`, in his
// own words, and checks every answer key.

/** The 11 Known gaps, each with the Gap reason it should get. */
export const KNOWN_GAPS = {
  "Shipping samples between sites": "noMatch",
  "AI tools with company files": "noMatch",
  "Durham parking": "noMatch",
  "Budget transfers": "noMatch",
  "rDNA approval": "noMatch",
  "Employment verification letter": "noMatch",
  "CRO accruals": "noMatch",
  "MTA to Northwake's own site": "notCovered",
  "Carrying over time off": "notCovered",
  "Large files for a CRO": "notCovered",
  "Boston hotel rate": "notCovered",
} as const;
export type KnownGap = keyof typeof KNOWN_GAPS;

/** A question's answer key. An answerable question lists every acceptable article by title. */
export type AnswerKey =
  | { outcome: "answered"; articles: string[] }
  | { outcome: "gap"; knownGap: KnownGap }
  | { outcome: "offTopic" };

export type TestQuestion = AnswerKey & {
  text: string;
  /** Names a system Northwake doesn't use, such as Expensify for Concur. */
  wrongSystem?: true;
  bySebastian?: true;
};

const answered = (text: string, ...articles: string[]): TestQuestion => ({
  text,
  outcome: "answered",
  articles,
});
const wrongSystem = (text: string, ...articles: string[]): TestQuestion => ({
  ...answered(text, ...articles),
  wrongSystem: true,
});
const gap = (knownGap: KnownGap, text: string): TestQuestion => ({
  text,
  outcome: "gap",
  knownGap,
});
const offTopic = (text: string): TestQuestion => ({ text, outcome: "offTopic" });
/** A question Sebastian writes in his own words. The comment beside each says what to ask. */
const bySebastian = (question: TestQuestion): TestQuestion => ({
  ...question,
  bySebastian: true,
});

const PUNCHOUT = "Ordering lab supplies through a Coupa punchout";
const NOT_IN_CATALOG = "Requesting something that isn't in a Coupa catalog";
const APPROVAL_STATUS = "Checking where a Coupa requisition is waiting for approval";
const RECEIVING = "Receiving an order in Coupa";
const NEW_SUPPLIER = "Adding a new supplier in Coupa";
const EXPENSE_REPORT = "Submitting an expense report in Concur";
const MISSING_RECEIPT = "Handling a missing or lost receipt in Concur";
const HOTEL_BILL = "Itemizing a hotel bill in Concur";
const CORPORATE_CARD = "Clearing corporate card charges in Concur";
const RETURNED_REPORT = "Fixing a returned expense report in Concur";
const TIME_OFF = "Requesting time off in Workday";
const PAY = "Viewing pay stubs, tax forms, and direct deposit in Workday";
const ADDRESS = "Updating your address and emergency contacts in Workday";
const BENEFITS = "Changing your benefits after a life event in Workday";
const LEAVE = "Requesting a leave of absence in Workday";
const TRAINING = "Completing your required training in Workday";
const REFERRAL = "Referring a candidate for an open role in Workday";
const NDA = "Getting an NDA in place through Ironclad";
const MTA = "Requesting a material transfer agreement (MTA) in Ironclad";
const CONSULTING = "Setting up a consulting agreement with a scientific advisor";
const MSA_SOW = "Requesting an MSA or SOW with a CRO or CDMO";
const FIND_CONTRACT = "Finding a signed contract or checking for an existing NDA in Ironclad";
const SIGNING = "Who can sign a contract, and how to send one for signature in Ironclad";
const EQUIPMENT = "Reporting broken lab equipment or a freezer alarm";
const BADGE = "Getting badge access to a lab suite";
const GUEST = "Registering a guest at Cambridge or Durham";
const WASTE = "Arranging hazardous waste pickup";
const WORKSPACE = "Requesting a desk, chair, or workspace change";
const REQUEST_STATUS = "Checking the status of a ServiceNow request";
const PASSWORD = "Resetting your Microsoft 365 password";
const MFA = "Moving MFA to a new phone";
const ACCESS = "Requesting access to an app or SharePoint site";
const SHARING = "Sharing files with people outside Northwake";
const OUTLOOK = "Setting up an out-of-office reply or shared mailbox in Outlook";
const TEAMS_ROOM = "Fixing a conference room that won't connect to Teams";
const LAPTOP = "Getting your laptop repaired or replaced";
const CONTRACTOR_LAPTOP = "Getting a laptop for a consultant or contractor";

export const testSet: TestQuestion[] = [
  // Finance: Coupa
  answered("What ship-to address should I pick for a punchout order going to the Durham lab?", PUNCHOUT),
  bySebastian(answered("", PUNCHOUT)), // Any question about ordering from Fisher, VWR, or Sigma.
  answered("I'm buying a $15,000 instrument that only one company makes. What do I attach to the request?", NOT_IN_CATALOG),
  wrongSystem("How do I submit a non-catalog purchase request in SAP Ariba for a custom antibody?", NOT_IN_CATALOG),
  answered("My Coupa requisition shows Pending next to my director's name. What does that mean, and what can I do?", APPROVAL_STATUS),
  answered("Why is my approver's manager getting copied on reminders about my requisition?", APPROVAL_STATUS),
  answered("I ordered reagents for a coworker, and she unpacked them. Which of us receives the order in Coupa?", RECEIVING),
  answered("Our supplier put us on credit hold. Could that be because of how we handle deliveries?", RECEIVING),
  answered("What do I need to explain in a new supplier request?", NEW_SUPPLIER),
  answered("How will I know when a new supplier is ready to use in Coupa?", NEW_SUPPLIER),

  // Finance: Concur
  answered("I paid for a conference registration with my own credit card. How do I get paid back?", EXPENSE_REPORT),
  bySebastian(wrongSystem("", EXPENSE_REPORT)), // Submitting an expense, naming a tool Northwake doesn't use, like Navan (the history already has Expensify).
  answered("The parking garage machine didn't print a receipt. Can I still expense it?", MISSING_RECEIPT, EXPENSE_REPORT),
  bySebastian(answered("", MISSING_RECEIPT)), // Any question about a lost or missing receipt.
  answered("Do I enter the hotel room tax separately in Concur?", HOTEL_BILL),
  answered("I watched a movie in my hotel room. How do I take it off the expense?", HOTEL_BILL, CORPORATE_CARD),
  answered("Do I have to put every corporate card charge on a report, even when I'm not owed anything?", CORPORATE_CARD),
  answered("Someone stole my corporate card. What should I do first?", CORPORATE_CARD),
  answered("After I fix a returned report, does it go straight to Procurement or back to my manager?", RETURNED_REPORT),
  answered("Do I need to explain what I changed when I resubmit a returned report?", RETURNED_REPORT),

  // HR: Workday
  wrongSystem("Where's my sick time balance in BambooHR?", TIME_OFF),
  answered("When do I get my sick days each year?", TIME_OFF),
  answered("Can I print my payslip from last March for an apartment application?", PAY),
  bySebastian(answered("", PAY)), // Any question about pay stubs, W-2s, withholding, or direct deposit.
  answered("I'm moving from Boston to Cambridge next month. Where do I change my address?", ADDRESS),
  answered("How soon after moving do I have to update my address?", ADDRESS),
  answered("My wife lost her job and her health insurance. Can I add her to my plan now?", BENEFITS),
  answered("I don't have my newborn's Social Security number yet. Can I still add her to my insurance?", BENEFITS),
  answered("I'm due in March. When should I put my maternity leave into Workday?", LEAVE),
  answered("I've only been at Northwake for 4 months. Do I get paid parental leave?", LEAVE),
  answered("My manager added a course for me. Where do I find it?", TRAINING),
  bySebastian(answered("", TRAINING)), // Any question about required training.
  answered("How long does someone I referred have to stay before I get the bonus?", REFERRAL),
  answered("I've never met this person, but a friend vouched for them. Can I refer them?", REFERRAL),

  // Legal: Ironclad
  answered("We want to talk to a startup about a partnership. What do I need before showing them our data?", NDA),
  bySebastian(wrongSystem("", NDA)), // Getting an NDA, naming a tool Northwake doesn't use, like DocuSign.
  answered("We're sending a compound to a hospital lab for testing. Can I ship it today?", MTA),
  answered("Our MTA involves patient blood samples. Is there any extra review?", MTA),
  answered("Who needs to approve a consultant who will bill $150,000 this year?", CONSULTING),
  answered("Does Legal check anything about my advisor's university before the agreement goes out?", CONSULTING),
  answered("Do I need a whole new contract for each project with a CRO we already work with?", MSA_SOW),
  answered("Our CDMO project involves clinical samples. Is there an extra review step?", MSA_SOW),
  wrongSystem("Where can I find a signed MSA in our DocuSign account?", FIND_CONTRACT, MSA_SOW),
  answered("We have an NDA with a company, but for a different project. Can I use it?", FIND_CONTRACT, NDA),
  answered("Can a director sign a $100,000 services contract?", SIGNING),
  answered("How do I check whether the other side has signed yet?", SIGNING),

  // Ops: ServiceNow
  answered("How do I mark a broken shaker so nobody uses it?", EQUIPMENT),
  bySebastian(answered("", EQUIPMENT)), // Any question about broken lab equipment or a freezer alarm.
  answered("How long after my manager approves does badge access take?", BADGE),
  answered("What does a replacement badge cost if I've lost one before?", BADGE),
  answered("A job candidate is interviewing in Cambridge on Thursday. What do I need to do?", GUEST),
  bySebastian(answered("", GUEST)), // Any question about registering a visitor.
  wrongSystem("How do I put in a Zendesk ticket to get our full sharps containers taken away?", WASTE),
  answered("Our waste bottle is getting full. When should I request a pickup?", WASTE),
  answered("My back hurts from my desk chair. What can I get?", WORKSPACE),
  answered("What day of the week do desk moves happen?", WORKSPACE),
  answered("Can I just email the team about my open request instead of using ServiceNow?", REQUEST_STATUS),
  bySebastian(wrongSystem("", REQUEST_STATUS)), // Checking on a request, naming a tool Northwake doesn't use, like Jira.

  // IT
  answered("Do I need a different password for Coupa and Workday?", PASSWORD),
  bySebastian(answered("", PASSWORD)), // Any question about a forgotten or expiring password.
  answered("My old phone broke and I can't get my sign-in code. What now?", MFA),
  answered("Can I use my desk landline for MFA?", MFA),
  answered("Why do I have to reconfirm my access to HR data every few months?", ACCESS),
  bySebastian(answered("", ACCESS)), // Any question about getting access to an app or SharePoint site.
  wrongSystem("How do I make a Box link to our slides expire after a month?", SHARING),
  answered("Our collaborator says the link I shared asks for a code. Is that normal?", SHARING),
  wrongSystem("How do I get added to the lab's group inbox in Gmail?", OUTLOOK),
  answered("Who approves adding me to a shared mailbox?", OUTLOOK),
  answered("Should I join a meeting from my laptop or the room's touch panel?", TEAMS_ROOM),
  bySebastian(wrongSystem("", TEAMS_ROOM)), // A conference room problem, naming a tool Northwake doesn't use, like Zoom.
  answered("My laptop battery dies after an hour. Can I get a new one?", LAPTOP),
  answered("Is there a way to get my files back if my laptop dies and I only saved them on the laptop?", LAPTOP),
  answered("Our contractor starts in three days. Is it too late to get them a laptop?", CONTRACTOR_LAPTOP),
  answered("A contractor will be with us for 4 months. What do I do so they have a computer on day one?", CONTRACTOR_LAPTOP),

  // Known gaps
  gap("Shipping samples between sites", "What days can I get something from our Cambridge lab down to Durham?"),
  gap("Shipping samples between sites", "I need to get a box of tissue samples to our North Carolina site. How do I book that?"),
  bySebastian(gap("Shipping samples between sites", "")), // Moving samples between Cambridge and Durham.
  gap("AI tools with company files", "Is it okay to upload a draft protocol to Claude to help me edit it?"),
  gap("AI tools with company files", "Which AI assistant are we allowed to use with work documents?"),
  bySebastian(gap("AI tools with company files", "")), // Using AI tools like ChatGPT or Copilot with work files.
  gap("Durham parking", "I drive to the Durham site. Is parking free?"),
  gap("Durham parking", "I'm driving down to Durham for a site visit. Where should I leave my car?"),
  bySebastian(gap("Durham parking", "")), // Parking at the Durham site.
  gap("Budget transfers", "We underspent on travel. Can I shift that money to my lab supplies cost center?"),
  gap("Budget transfers", "Is there a cutoff for moving money between cost centers before the quarter closes?"),
  bySebastian(gap("Budget transfers", "")), // Moving budget between cost centers.
  gap("rDNA approval", "Do I need biosafety committee sign-off before cloning a new gene into E. coli?"),
  gap("rDNA approval", "Which committee signs off on genetically modified organisms here?"),
  gap("rDNA approval", "Is there an approval process for starting genetic engineering work here?"),
  gap("Employment verification letter", "How do I request an HR letter for a visa application?"),
  gap("Employment verification letter", "My bank wants written confirmation of my job title and start date. Who provides that?"),
  gap("Employment verification letter", "Who handles employment verification calls from lenders?"),
  gap("CRO accruals", "Finance asked me for an accrual estimate on our CRO study. How do I submit it?"),
  gap("CRO accruals", "How do I record CRO costs for work done in September that won't be billed until November?"),
  gap("CRO accruals", "Who do I give month-end estimates of unbilled vendor work to?"),
  gap("MTA to Northwake's own site", "Our Durham team needs some of our plasmids. Does that go through Ironclad?"),
  gap("MTA to Northwake's own site", "Can I use the Ironclad MTA workflow when the receiving lab is our own Durham site?"),
  gap("MTA to Northwake's own site", "Our Durham colleagues asked for antibodies we make in Cambridge. What agreement do we need?"),
  gap("Carrying over time off", "I have 60 hours of vacation left in December. What happens to them?"),
  gap("Carrying over time off", "I'm saving vacation for a long trip next spring. Can I bank days from this year?"),
  bySebastian(gap("Carrying over time off", "")), // Carrying unused vacation into next year.
  gap("Large files for a CRO", "Is there a Northwake site for exchanging big datasets with a CDMO?"),
  gap("Large files for a CRO", "What's the size limit on sharing a file outside Northwake?"),
  gap("Large files for a CRO", "How do I get imaging files that are too big for email to our CRO?"),
  gap("Boston hotel rate", "I found a Back Bay hotel for $380 a night. Is that within policy?"),
  gap("Boston hotel rate", "What do I do if the only hotel near my Boston meeting costs more than the limit?"),
  gap("Boston hotel rate", "Does the travel policy set a different hotel budget for Boston than for other cities?"),

  // Off topic
  offTopic("What's the best way to quantify protein with a BCA assay?"),
  offTopic("How do I calculate molarity from a mass and a volume?"),
  offTopic("Why are my cells detaching from the flask?"),
  offTopic("Can you explain what an IC50 is?"),
  offTopic("Who's the CEO of Moderna?"),
  offTopic("What should I name my new puppy?"),
  offTopic("What's a good antibody dilution for immunofluorescence?"),
  offTopic("Give me a recipe for banana bread."),
  offTopic("How do I stain a gel with SYBR Safe?"),
  offTopic("Is coffee bad for you?"),
  bySebastian(offTopic("")), // Lab technique or small talk.
  bySebastian(offTopic("")),
  bySebastian(offTopic("")),
];
