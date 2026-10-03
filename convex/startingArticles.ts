import type { WithoutSystemFields } from "convex/server";
import type { Doc } from "./_generated/dataModel";

// A few placeholder articles until ticket 02 loads Northwake's full set.
export const startingArticles: WithoutSystemFields<Doc<"helpArticles">>[] = [
  {
    title: "Ordering lab supplies through a Coupa punchout",
    department: "Finance",
    system: "Coupa",
    contactTeam: "Procurement & AP",
    body: `Use a punchout catalog to buy lab supplies from Fisher Scientific, VWR, or Sigma-Aldrich at Northwake's negotiated prices.

1. In Coupa, open Shop and choose the supplier's punchout tile.
2. Add items to the cart on the supplier's site, then select Return to Coupa.
3. Check the cost center and ship-to address (Cambridge or Durham), then submit the requisition.

Northwake rules:
- Orders under $2,500 are approved by your manager. Orders of $2,500 or more also need Finance approval.
- Hazardous chemicals must ship to the receiving dock, never to a lab directly.

Questions about a punchout order go to Procurement & AP.`,
  },
  {
    title: "Submitting an expense report in Concur",
    department: "Finance",
    system: "Concur",
    contactTeam: "Procurement & AP",
    body: `Submit business expenses in Concur within 30 days of the purchase.

1. In Concur, select Create, then Start a Report, and name it after the trip or month.
2. Add each expense, choose the expense type, and attach the receipt photo.
3. Select Submit Report. Your manager approves it, and reimbursement arrives in your next payroll.

Northwake rules:
- Receipts are required for any expense of $25 or more.
- Team meals need the names of everyone who attended.

Questions about expense reports go to Procurement & AP.`,
  },
  {
    title: "Resetting your Microsoft 365 password",
    department: "IT",
    system: "Microsoft 365",
    contactTeam: "IT Service Desk",
    body: `Reset your own Northwake password without calling the Service Desk.

1. Go to the Microsoft sign-in page and select Forgot my password.
2. Enter your Northwake email and complete the verification step.
3. Choose a new password, then sign in again on your laptop and phone.

Northwake rules:
- Passwords must be at least 14 characters and can't reuse your last 5.
- Never share your password, including with IT staff.

If the reset doesn't work, contact the IT Service Desk.`,
  },
];
