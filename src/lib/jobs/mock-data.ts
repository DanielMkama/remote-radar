/**
 * Mock Remotive-shaped job data.
 *
 * Stands in for the real Remotive ingestion (lib/sources/remotive.ts, a
 * later phase). Covers the cases the filtering system needs to prove out:
 * worldwide vs. country-restricted, above/below the salary window, hourly
 * and yearly pay that needs normalizing, target design categories, and a
 * couple of irrelevant (non-design) listings.
 */

import { buildSalaryInfo } from "./salary";
import { computeMatchScore } from "./filters";
import type { Job, JobCategory, JobType, SalaryCurrency, SalaryPeriod } from "./types";

interface RawMockJob {
  externalId: string;
  title: string;
  company: string;
  companyLogo: string | null;
  url: string;
  description: string;
  location: string;
  isWorldwide: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: SalaryCurrency;
  salaryPeriod: SalaryPeriod | null;
  jobType: JobType;
  category: JobCategory;
  tags: string[];
  postedAt: string;
  isActive?: boolean;
}

const now = new Date();
/** Helper: N days before "now", as an ISO string, for realistic postedAt values. */
function daysAgo(n: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const RAW_JOBS: RawMockJob[] = [
  {
    externalId: "remotive-1001",
    title: "Senior UI Designer",
    company: "Pixelcraft Studio",
    companyLogo: null,
    url: "https://remotive.com/remote-jobs/design/senior-ui-designer-1001",
    description:
      "Pixelcraft Studio is looking for a Senior UI Designer to lead the visual language of our design system across web and mobile products. You'll work closely with product and engineering across time zones, so this role is open worldwide.\n\nResponsibilities:\n- Own our component library in Figma\n- Design polished, accessible interfaces for our SaaS dashboard\n- Partner with engineers on implementation details\n\nRequirements:\n- 4+ years of UI design experience\n- Strong portfolio of shipped product work\n- Comfortable working async across time zones",
    location: "Worldwide",
    isWorldwide: true,
    salaryMin: 1200,
    salaryMax: 1800,
    salaryCurrency: "USD",
    salaryPeriod: "month",
    jobType: "full-time",
    category: "ui-design",
    tags: ["Figma", "Design Systems", "SaaS"],
    postedAt: daysAgo(1),
  },
  {
    externalId: "remotive-1002",
    title: "Product Designer",
    company: "Nimbus Health",
    companyLogo: null,
    url: "https://remotive.com/remote-jobs/design/product-designer-1002",
    description:
      "Nimbus Health builds remote patient monitoring tools. We're hiring a Product Designer, paid hourly, to help us redesign our patient-facing mobile app. Fully remote, open to candidates anywhere in the world.\n\nYou'll run lightweight user research, wireframe flows, and ship high-fidelity screens in Figma.",
    location: "Anywhere",
    isWorldwide: true,
    salaryMin: 12,
    salaryMax: 12,
    salaryCurrency: "USD",
    salaryPeriod: "hour",
    jobType: "contract",
    category: "product-design",
    tags: ["Mobile", "Healthtech", "Figma"],
    postedAt: daysAgo(2),
  },
  {
    externalId: "remotive-1003",
    title: "UX Researcher & Designer",
    company: "Wanderly",
    companyLogo: null,
    url: "https://remotive.com/remote-jobs/design/ux-researcher-designer-1003",
    description:
      "Wanderly is a travel-planning startup hiring a part-time UX Designer/Researcher. Work from anywhere, we're a fully distributed team spanning 12 countries.\n\nYou'll conduct user interviews, synthesize findings, and turn them into wireframes and prototypes.",
    location: "Remote - Work From Anywhere",
    isWorldwide: true,
    salaryMin: 600,
    salaryMax: 900,
    salaryCurrency: "USD",
    salaryPeriod: "month",
    jobType: "contract",
    category: "ux-design",
    tags: ["User Research", "Prototyping"],
    postedAt: daysAgo(3),
  },
  {
    externalId: "remotive-1004",
    title: "Graphic Designer",
    company: "BrightMark",
    companyLogo: null,
    url: "https://remotive.com/remote-jobs/design/graphic-designer-1004",
    description:
      "BrightMark is a marketing agency hiring a full-time Graphic Designer to produce campaign assets, social creative, and presentation decks for enterprise clients. Salary is stated annually. Open worldwide.",
    location: "Worldwide",
    isWorldwide: true,
    salaryMin: 40000,
    salaryMax: 40000,
    salaryCurrency: "USD",
    salaryPeriod: "year",
    jobType: "full-time",
    category: "graphic-design",
    tags: ["Branding", "Social Media", "Adobe Creative Suite"],
    postedAt: daysAgo(4),
  },
  {
    externalId: "remotive-1005",
    title: "UI/UX Designer",
    company: "Alpine Robotics",
    companyLogo: null,
    url: "https://remotive.com/remote-jobs/design/ui-ux-designer-1005",
    description:
      "Alpine Robotics builds industrial automation software. This role is remote but restricted to candidates authorized to work in the United States due to export-control requirements.",
    location: "United States Only",
    isWorldwide: false,
    salaryMin: 1500,
    salaryMax: 1500,
    salaryCurrency: "USD",
    salaryPeriod: "month",
    jobType: "full-time",
    category: "ui-design",
    tags: ["B2B", "Industrial", "Figma"],
    postedAt: daysAgo(5),
  },
  {
    externalId: "remotive-1006",
    title: "Junior Brand Designer",
    company: "Loopline",
    companyLogo: null,
    url: "https://remotive.com/remote-jobs/design/junior-brand-designer-1006",
    description:
      "Loopline is a small worldwide-remote studio hiring a part-time Junior Brand Designer to help refresh client brand kits: logos, color systems, and style guides.",
    location: "Worldwide",
    isWorldwide: true,
    salaryMin: 400,
    salaryMax: 400,
    salaryCurrency: "USD",
    salaryPeriod: "month",
    jobType: "part-time",
    category: "brand-design",
    tags: ["Branding", "Logo Design", "Junior"],
    postedAt: daysAgo(6),
  },
  {
    externalId: "remotive-1007",
    title: "Visual Designer",
    company: "Kreisel GmbH",
    companyLogo: null,
    url: "https://remotive.com/remote-jobs/design/visual-designer-1007",
    description:
      "Kreisel GmbH is a Berlin-based manufacturer. This remote role is restricted to candidates residing in Germany for payroll and tax reasons.",
    location: "Germany Only",
    isWorldwide: false,
    salaryMin: 1000,
    salaryMax: 1000,
    salaryCurrency: "EUR",
    salaryPeriod: "month",
    jobType: "full-time",
    category: "visual-design",
    tags: ["Manufacturing", "Print", "Digital"],
    postedAt: daysAgo(7),
  },
  {
    externalId: "remotive-1008",
    title: "Web Designer",
    company: "Driftwood Collective",
    companyLogo: null,
    url: "https://remotive.com/remote-jobs/design/web-designer-1008",
    description:
      "Driftwood Collective is a freelance network building marketing sites for indie founders. Paid hourly, fully async, open globally, work from anywhere with a laptop and an internet connection.",
    location: "Global / Anywhere",
    isWorldwide: true,
    salaryMin: 9,
    salaryMax: 9,
    salaryCurrency: "USD",
    salaryPeriod: "hour",
    jobType: "freelance",
    category: "web-design",
    tags: ["Webflow", "Landing Pages", "Freelance"],
    postedAt: daysAgo(8),
  },
  {
    externalId: "remotive-1009",
    title: "Marketing Designer",
    company: "Northstar Growth",
    companyLogo: null,
    url: "https://remotive.com/remote-jobs/design/marketing-designer-1009",
    description:
      "Northstar Growth is a performance marketing agency hiring a Marketing Designer to produce ad creative, email templates, and landing pages for e-commerce clients. Fully remote, worldwide team.",
    location: "Worldwide",
    isWorldwide: true,
    salaryMin: 1800,
    salaryMax: 1800,
    salaryCurrency: "USD",
    salaryPeriod: "month",
    jobType: "full-time",
    category: "marketing-design",
    tags: ["Performance Marketing", "Ad Creative", "Email"],
    postedAt: daysAgo(9),
  },
  {
    externalId: "remotive-1010",
    title: "Creative Director / Designer",
    company: "Vantage Creative",
    companyLogo: null,
    url: "https://remotive.com/remote-jobs/design/creative-director-designer-1010",
    description:
      "Vantage Creative is hiring a senior Creative Designer to set creative direction across campaigns for multiple brand clients. Open worldwide, generous senior-level compensation.",
    location: "Worldwide",
    isWorldwide: true,
    salaryMin: 2500,
    salaryMax: 2500,
    salaryCurrency: "USD",
    salaryPeriod: "month",
    jobType: "full-time",
    category: "creative-design",
    tags: ["Creative Direction", "Campaigns", "Senior"],
    postedAt: daysAgo(10),
  },
  {
    externalId: "remotive-1011",
    title: "Content Designer",
    company: "Fernwood Media",
    companyLogo: null,
    url: "https://remotive.com/remote-jobs/design/content-designer-1011",
    description:
      "Fernwood Media is a digital publisher hiring a Content Designer to shape UX writing, content structure, and editorial design across our reader apps. Salary stated annually. Remote, open anywhere.",
    location: "Anywhere",
    isWorldwide: true,
    salaryMin: 18000,
    salaryMax: 18000,
    salaryCurrency: "USD",
    salaryPeriod: "year",
    jobType: "contract",
    category: "content-design",
    tags: ["UX Writing", "Editorial", "Content Strategy"],
    postedAt: daysAgo(11),
  },
  {
    externalId: "remotive-1012",
    title: "Backend Engineer",
    company: "Corebase Systems",
    companyLogo: null,
    url: "https://remotive.com/remote-jobs/software-dev/backend-engineer-1012",
    description:
      "Corebase Systems is hiring a Backend Engineer to work on our distributed data platform. Fully remote, worldwide. (Not a design role — included to verify irrelevant listings are filtered out.)",
    location: "Worldwide",
    isWorldwide: true,
    salaryMin: 3000,
    salaryMax: 3000,
    salaryCurrency: "USD",
    salaryPeriod: "month",
    jobType: "full-time",
    category: "other",
    tags: ["Backend", "Distributed Systems", "Go"],
    postedAt: daysAgo(12),
  },
  {
    externalId: "remotive-1013",
    title: "Customer Support Specialist",
    company: "Helpdesk Plus",
    companyLogo: null,
    url: "https://remotive.com/remote-jobs/customer-support/customer-support-specialist-1013",
    description:
      "Helpdesk Plus is hiring a Customer Support Specialist to handle tier-1 tickets during UK business hours. Restricted to candidates based in the United Kingdom. (Not a design role.)",
    location: "United Kingdom Only",
    isWorldwide: false,
    salaryMin: 1400,
    salaryMax: 1400,
    salaryCurrency: "GBP",
    salaryPeriod: "month",
    jobType: "full-time",
    category: "other",
    tags: ["Support", "Customer Success"],
    postedAt: daysAgo(13),
  },
  {
    externalId: "remotive-1014",
    title: "Freelance UX/UI Designer",
    company: "Sable & Co",
    companyLogo: null,
    url: "https://remotive.com/remote-jobs/design/freelance-ux-ui-designer-1014",
    description:
      "Sable & Co is a design consultancy hiring a freelance UI Designer for a high-end client engagement. Paid hourly at a senior rate, fully remote, open worldwide.",
    location: "Worldwide",
    isWorldwide: true,
    salaryMin: 30,
    salaryMax: 30,
    salaryCurrency: "USD",
    salaryPeriod: "hour",
    jobType: "freelance",
    category: "ui-design",
    tags: ["Consultancy", "Senior", "Freelance"],
    postedAt: daysAgo(14),
  },
  {
    externalId: "remotive-1015",
    title: "Product Designer (Part-Time)",
    company: "Modulo Labs",
    companyLogo: null,
    url: "https://remotive.com/remote-jobs/design/product-designer-part-time-1015",
    description:
      "Modulo Labs is an early-stage dev-tools startup hiring a part-time Product Designer to help shape our onboarding flow and marketing site. Remote, work from anywhere.",
    location: "Remote - Work From Anywhere",
    isWorldwide: true,
    salaryMin: 500,
    salaryMax: 500,
    salaryCurrency: "USD",
    salaryPeriod: "month",
    jobType: "part-time",
    category: "product-design",
    tags: ["Dev Tools", "Early Stage", "Onboarding"],
    postedAt: daysAgo(15),
  },
  {
    externalId: "remotive-1016",
    title: "Illustrator / Graphic Designer",
    company: "Quietroom Studio",
    companyLogo: null,
    url: "https://remotive.com/remote-jobs/design/illustrator-graphic-designer-1016",
    description:
      "Quietroom Studio is a boutique illustration studio hiring a freelance Graphic Designer for editorial illustration work. Worldwide, project-based — rate to be discussed per project, not disclosed upfront.",
    location: "Worldwide",
    isWorldwide: true,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "USD",
    salaryPeriod: null,
    jobType: "freelance",
    category: "graphic-design",
    tags: ["Illustration", "Editorial", "Project-Based"],
    postedAt: daysAgo(16),
  },
];

/** Build the full Job objects (with normalized salary + match score) once, at module load. */
export const MOCK_JOBS: Job[] = RAW_JOBS.map((raw) => {
  const salary = buildSalaryInfo({
    min: raw.salaryMin,
    max: raw.salaryMax,
    currency: raw.salaryCurrency,
    period: raw.salaryPeriod,
  });

  const base = {
    id: raw.externalId,
    externalId: raw.externalId,
    source: "remotive" as const,
    title: raw.title,
    company: raw.company,
    companyLogo: raw.companyLogo,
    url: raw.url,
    description: raw.description,
    location: raw.location,
    salary,
    jobType: raw.jobType,
    category: raw.category,
    tags: raw.tags,
    postedAt: raw.postedAt,
    collectedAt: now.toISOString(),
    isWorldwide: raw.isWorldwide,
    isActive: raw.isActive ?? true,
    createdAt: raw.postedAt,
    updatedAt: now.toISOString(),
  };

  return {
    ...base,
    matchScore: computeMatchScore(base),
  };
});
