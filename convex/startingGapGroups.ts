import type { WithoutSystemFields } from "convex/server";
import type { Doc } from "./_generated/dataModel";

/**
 * An article the history cites: a starting article's title, or
 * `approvedRef(group)` for the article a starting group's draft became. A
 * revision keeps the original's title, so titles alone aren't unique.
 */
export type ArticleRef = string;
export const approvedRef = (groupTitle: string): ArticleRef =>
  `approved: ${groupTitle}`;

type Result = Omit<
  WithoutSystemFields<Doc<"suggestedQuestions">>,
  "text" | "hint" | "citedArticleIds" | "gapGroupId"
> & { cited: ArticleRef[]; gapGroup?: string };

export type StartingQuestion = Result & {
  text: string;
  didntHelp?: boolean;
  daysAgo: number;
};
export type SuggestedQuestion = Result & { text: string; hint: string };

type StartingGapGroup = {
  title: string;
  /** For a revision group, the title of the starting article it revises. */
  revises?: string;
  draft?: Omit<
    WithoutSystemFields<Doc<"draftArticles">>,
    "visitorId" | "gapGroupId" | "articleId"
  >;
};

// The seven starting Gap groups, in list order. The history adds more Open
// groups for the remaining holes. Drafts were AI-drafted and checked against
// the IT team notes.
export const startingGapGroups: StartingGapGroup[] = [
  { title: "Sending samples between Cambridge and Durham" },
  { title: "Using AI tools with company files" },
  { title: "Moving MFA to a new phone", revises: "Moving MFA to a new phone" },
  { title: "Parking at the Durham site" },
  {
    title: "Carrying over unused time off",
    revises: "Requesting time off in Workday",
    draft: {
      status: "pending",
      daysAgo: 4,
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

Unused vacation carries over into the next calendar year, up to [Check: how many unused vacation hours carry over]. Vacation above that is forfeited on [Check: the date unused vacation above the cap is forfeited]. Use carried-over vacation by [Check: the date carried-over vacation must be used by], or it's forfeited.

Northwake rules:
- Request vacation of 3 or more days at least 2 weeks in advance.
- Full-time employees earn 15 vacation days a year, accrued each pay period, and 5 sick days granted each January.
- Sick time doesn't need advance approval. Enter it in Workday when you return.

Questions about time off go to the People Team.`,
    },
  },
  {
    title: "Laptop for a consultant",
    draft: {
      status: "approved",
      daysAgo: 21,
      title: "Getting a laptop for a consultant or contractor",
      department: "IT",
      system: "ServiceNow",
      contactTeam: "IT Service Desk",
      body: `Consultants and contractors on longer contracts get a Northwake laptop, set up before their first day. The hiring manager requests it in ServiceNow.

1. Check the contract's length. Contracts of 3 months or longer qualify for a Northwake laptop.
2. In ServiceNow, open the Employee Center and select Request a Service, then Contractor laptop.
3. Enter the contractor's name, start date, contract end date, and the apps they'll need.
4. Submit the request at least 5 business days before the start date. The IT Service Desk prepares the laptop and tells you when it's ready.
5. On the contract's last day, return the laptop to the IT Service Desk.

Northwake rules:
- Contractors on contracts shorter than 3 months use their own computer with web-only Microsoft 365 access.
- The hiring manager is responsible for returning the laptop on the contract's last day.
- Contractors follow the same rules as employees for saving work to OneDrive and reporting a lost laptop.

Questions about contractor laptops go to the IT Service Desk.`,
    },
  },
  {
    title: "Badge access",
    revises: "Getting badge access to a lab suite",
    draft: {
      status: "approved",
      daysAgo: 14,
      title: "Getting badge access to a lab suite",
      department: "Ops",
      system: "ServiceNow",
      contactTeam: "Workplace & EHS",
      body: `Your badge opens the main doors at your site on your first day. Lab suites, the vivarium, and other restricted areas need access added to your badge.

1. In ServiceNow, open the Employee Center and select Request a Service, then Badge access.
2. Enter your badge number (printed on the back of your badge) and the suite or area you need, such as "Cambridge Lab 4B."
3. Submit the request. It goes to your manager to approve in ServiceNow.
4. Once your manager approves, Workplace & EHS adds the access within 1 business day and updates the request.
5. Test your badge at the suite door. If it doesn't work, add a comment to the same request.

Northwake rules:
- Your manager must approve access to every restricted area in ServiceNow. Requests sent by email aren't accepted.
- Never lend your badge or let someone follow you through a badge door. Everyone must badge in individually.
- Report a lost badge right away with the ServiceNow "Lost badge" request, which turns the old badge off. The first replacement is free, and each one after that costs $25.

Access to the Durham manufacturing floor also needs GMP gowning qualification, which the Durham Quality team arranges.

Questions about badge access go to Workplace & EHS.`,
    },
  },
];
