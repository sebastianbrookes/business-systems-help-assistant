import type { WithoutSystemFields } from "convex/server";
import type { Doc } from "./_generated/dataModel";

// Facts no Help article states. They cover every hole except rDNA approval and
// CRO accruals, and they're never sent to the answer call.
export const startingItTeamNotes: WithoutSystemFields<Doc<"itTeamNotes">>[] = [
  // Shipping samples between Cambridge and Durham
  "Samples move between Cambridge and Durham on the internal courier, which runs Tuesdays and Thursdays. Book a spot with a ServiceNow \"Inter-site sample shipment\" request by noon the day before.",
  "Inter-site shipments on dry ice or with hazardous materials are packed by Workplace & EHS. The person shipping must have finished the Dangerous Goods Shipping course in Workday within the last 2 years.",
  "Samples moving between Northwake's own sites don't need an MTA. MTAs are only for transfers with outside organizations.",
  "Internal transfers between Cambridge and Durham need the Sample Transfer Form attached to the ServiceNow shipment request, listing each sample and its storage temperature.",
  // Using AI tools with company files
  "Microsoft 365 Copilot is the only AI tool approved for Northwake files. Sign in with your Northwake account so prompts and files stay inside Northwake's Microsoft 365.",
  "Putting Northwake files, sequences, or patient data into ChatGPT or any other public AI tool isn't allowed. To get a new AI tool approved, submit a ServiceNow \"Software request\". IT and Legal review it within 10 business days.",
  "Copilot licenses are assigned on request through a ServiceNow \"Software request\" for Microsoft 365 Copilot, with manager approval.",
  // Parking at the Durham site
  "Durham employees park free in Lot B, behind the manufacturing building. Pick up a parking hang tag at the Durham front desk on your first day.",
  "Guests at Durham park in the marked guest spaces by the main entrance and don't need a tag. Lot A is reserved for shift workers on the manufacturing floor.",
  // Laptop for a consultant
  "Consultants and contractors get a Northwake laptop only if their contract runs 3 months or longer. The hiring manager submits a ServiceNow \"Contractor laptop\" request at least 5 business days before the start date.",
  "Contractors on contracts shorter than 3 months use their own computer with web-only Microsoft 365 access. Contractor laptops go back to the IT Service Desk on the contract's last day, and the hiring manager is responsible for the return.",
  // Moving budget between cost centers
  "To move budget between cost centers, submit the Budget Transfer form on the Finance SharePoint site. Both cost center owners approve it, and FP&A posts it within 5 business days.",
  "Budget transfers over $50,000 also need the CFO's approval. FP&A doesn't accept transfers in the last 5 business days of a quarter.",
  // Employment verification letter
  "Employment verification letters are requested from the People Team with a ServiceNow \"HR letter request\". They're ready within 3 business days.",
  "Verification letters confirm dates of employment and job title. Salary is included only if the Employee asks for it in the request. Lenders and landlords who call are directed to The Work Number.",
  // Carrying over unused time off
  "Up to 40 hours of unused vacation carry over into the next calendar year. Anything above 40 hours is forfeited on January 1.",
  "Carried-over vacation must be used by March 31 or it's forfeited. Unused sick time doesn't carry over, because the 5 sick days are granted fresh each January.",
  // Sharing large files with a CRO
  "OneDrive and SharePoint sharing links to people outside Northwake fail for files over 10 GB.",
  "Large datasets for CROs and other partners go through the Partner Exchange SharePoint site. Request a partner folder with a ServiceNow \"External data share\" request. It's ready within 2 business days, and only partners with a signed agreement in Ironclad can get one.",
  // Maximum hotel rate in Boston
  "The maximum nightly hotel rate, before taxes, is $325 in Boston and Cambridge, $200 in Durham and Research Triangle Park, and $275 elsewhere in the US.",
  "Hotel rates above the cap need VP approval before booking. Attach the approval email to the hotel expense in Concur.",
  // Moving MFA to a new phone (the article is out of date)
  "Northwake turned off SMS codes for sign-in in June 2026. Every account now uses the Microsoft Authenticator app with number matching.",
  "To move Authenticator to a new phone, keep the old phone, sign in to My Sign-Ins, add Authenticator on the new phone, then delete the old one. If the old phone is gone, the IT Service Desk resets MFA after checking your identity on a Teams video call.",
  // Badge access (the article is out of date)
  "Badge access is now requested in ServiceNow with the \"Badge access\" request, not by emailing Facilities. Your manager approves it in ServiceNow, and access is added within 1 business day.",
  "Lost badges are now reported with the ServiceNow \"Lost badge\" request, which turns the old badge off right away. The first replacement is free, and each one after that costs $25.",
].map((text) => ({ text }));
