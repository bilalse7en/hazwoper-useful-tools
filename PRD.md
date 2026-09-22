# Product Requirements Document

## Hazwoper Useful Tools — SEO, Content Quality & AdSense Readiness

**Project:** Hazwoper Useful Tools
**Current stack:** Next.js + TypeScript + Supabase
**Current deployment:** Vercel
**Primary objective:** Improve SEO, content quality, crawlability, trust, accessibility, and AdSense readiness **without changing existing tool functionality or user workflows**.

---

# 1. Executive Summary

Hazwoper Useful Tools is an existing web application containing interactive tools intended to help users with Hazwoper/safety-related tasks.

The application currently functions as a collection of interactive tools. The main issue is that some pages may provide the interactive functionality but insufficient supporting explanatory content.

The site has received the following AdSense feedback:

> Low value content
> Your site does not yet meet the criteria of use in the Google publisher network.

Google's current AdSense documentation states that sites should contain high-quality, original content that provides value to visitors and should have clear, easy-to-use navigation. Google also requires publishers to contribute original value rather than simply reproducing external content.

Therefore, this project will improve the existing application by adding a strong **content layer around the existing tools**, together with technical SEO and trust infrastructure.

The project must **not convert the application into a blog** and must **not replace the existing tools**.

The interactive tools remain the primary product.

---

# 2. Goals

## Primary goals

1. Preserve all existing tool functionality.
2. Preserve existing calculations and business logic.
3. Improve the amount and quality of useful information surrounding each tool.
4. Make every important public page understandable to search engines and users.
5. Establish a clear site information architecture.
6. Implement technical SEO correctly.
7. Improve internal linking.
8. Add appropriate structured data.
9. Add trust and legal pages.
10. Make the site ready for another AdSense review.
11. Improve accessibility and mobile usability.
12. Prevent thin/empty/non-content pages from being indexed or monetized.
13. Establish a scalable content architecture for future tools.

## Secondary goals

* Improve organic search discoverability.
* Improve click-through rates through better titles/descriptions.
* Improve user understanding of each tool.
* Increase time spent on useful pages naturally.
* Make tools easier to discover through category pages and internal links.

---

# 3. Non-Goals

The following are explicitly OUT OF SCOPE unless required by the existing application:

* Rewriting tool calculations.
* Changing existing tool behavior.
* Removing existing tools.
* Replacing Supabase.
* Replacing Vercel.
* Rebuilding the application from scratch.
* Adding unnecessary authentication.
* Creating hundreds of automatically generated articles.
* Publishing AI-generated content without human review.
* Adding advertisements merely to make the site appear monetized.
* Changing the visual identity unnecessarily.
* Creating keyword-stuffed pages.
* Creating fake reviews/testimonials.
* Creating fake authors or credentials.
* Claiming OSHA/government affiliation unless legitimately applicable.
* Guaranteeing AdSense approval.

AdSense approval cannot be guaranteed by any technical implementation. Google reviews the site against its policies and content requirements.

---

# 4. Existing Functionality Preservation Requirement

This is the highest-priority engineering requirement.

Before modifying the repository, the implementation team must create an inventory of the existing application.

For every existing route/tool:

```text
Route
Purpose
Interactive functionality
Inputs
Outputs
Validation
API calls
Supabase dependencies
Client/server behavior
Authentication requirements
Existing metadata
Existing internal links
```

No existing functionality may be removed because of SEO work.

For example:

```text
Existing:

/tools/tool-name

Interactive Tool
    ↓
User inputs data
    ↓
Existing calculation
    ↓
Existing result
```

must become:

```text
/tools/tool-name

SEO title
Description
Breadcrumbs

What is this tool?
    ↓
Interactive Tool
    ↓
Existing calculation
    ↓
Existing result

How does it work?
How to use it
Example
Important considerations
FAQ
References
Related tools
```

The interactive functionality remains unchanged.

---

# 5. Required Repository Audit

Before implementation, inspect the complete repository.

## 5.1 Inspect

```text
package.json
next.config.*
tsconfig.json
middleware.*
.env.example
src/
app/
pages/
components/
lib/
utils/
public/
supabase/
database/
```

Also identify whether the project uses:

* App Router
* Pages Router
* Server Components
* Client Components
* Supabase SSR
* Supabase browser client
* API routes
* Server Actions
* dynamic routes
* static generation
* ISR
* middleware
* existing metadata utilities

---

# 6. Route Inventory

Create a route inventory.

Example:

| Route             | Type           | Index? | Content? | SEO metadata? |
| ----------------- | -------------- | -----: | -------: | ------------: |
| `/`               | Landing        |    Yes |      Yes |           Yes |
| `/tools`          | Tool directory |    Yes |      Yes |           Yes |
| `/tools/example`  | Tool           |    Yes |      Yes |           Yes |
| `/about`          | Trust          |    Yes |      Yes |           Yes |
| `/contact`        | Trust          |    Yes |      Yes |           Yes |
| `/privacy-policy` | Legal          |    Yes |      Yes |           Yes |
| `/terms`          | Legal          |    Yes |      Yes |           Yes |
| `/disclaimer`     | Legal          |    Yes |      Yes |           Yes |

The actual routes must be determined from the repository rather than assumed.

---

# 7. New Site Architecture

The target information architecture should follow this general structure:

```text
/
│
├── /tools
│   │
│   ├── /tool-1
│   ├── /tool-2
│   ├── /tool-3
│   └── ...
│
├── /guides
│   ├── /guide-1
│   ├── /guide-2
│   └── ...
│
├── /about
├── /contact
├── /privacy-policy
├── /terms
└── /disclaimer
```

The exact URLs should be based on the current repository.

Do not change existing public URLs unnecessarily.

If an existing URL is already indexed or used externally, preserve it unless there is a strong technical reason to change it.

If a URL must change:

```text
old URL
   ↓
301 redirect
   ↓
new canonical URL
```

---

# 8. Homepage Requirements

The homepage must clearly explain:

1. What Hazwoper Useful Tools is.
2. Who the tools are for.
3. What problems the tools solve.
4. What tools are available.
5. How users can start.
6. What the site is and is not.
7. Links to relevant guides/resources.
8. Trust information.

Recommended structure:

```text
Hero
│
├── Clear value proposition
├── Primary CTA
└── Secondary CTA

Featured Tools
│
├── Tool card
├── Description
└── Open Tool

What Are Hazwoper Tools?
│
└── Original explanatory content

Who Can Use These Tools?
│
└── Appropriate audience explanation

How These Tools Work
│
└── Explanation

Popular Tools
│
└── Internal links

Helpful Guides
│
└── Guide cards

FAQ
│
└── Relevant questions

About / Trust section
│
└── Site ownership and purpose

Footer
```

Do not fill sections with generic SEO text.

Every section must provide actual user value.

---

# 9. Tool Page Requirements

Every important public tool should become a complete resource page.

## Required structure

```text
Breadcrumb
    ↓
H1: Tool name
    ↓
Short original introduction
    ↓
Interactive tool
    ↓
Result
    ↓
What is [topic]?
    ↓
How does this tool work?
    ↓
How to use the tool
    ↓
Example
    ↓
Important considerations / limitations
    ↓
Frequently Asked Questions
    ↓
Related tools
    ↓
Relevant references
```

---

# 10. Tool Introduction

Each tool should have a concise original introduction.

It must explain:

* What the tool does.
* Who it is useful for.
* What type of problem it addresses.
* What the user can expect.

Avoid:

```text
This is the best OSHA calculator.
Use our amazing free calculator today.
```

Prefer factual language:

```text
This tool helps users estimate/organize/check [specific task].
Enter the required information below to generate the result.
```

The exact wording must reflect the actual tool.

---

# 11. "What Is This?" Section

Each tool should explain the underlying topic.

Example:

```text
## What is PPE?

Personal protective equipment (PPE) is equipment designed to reduce
exposure to workplace hazards when other controls cannot adequately
protect workers.

[Continue with useful, accurate explanation.]
```

The content must be:

* Original.
* Factually accurate.
* Relevant to the tool.
* Written for humans.
* Reviewed before publishing.

Do not copy OSHA or another website word-for-word.

Google explicitly expects publishers to contribute original value rather than scraped/copyrighted material.

---

# 12. How It Works

Explain the tool's actual logic at an appropriate level.

Example:

```text
## How does this tool work?

1. Enter the required information.
2. The tool evaluates the provided values.
3. The relevant calculation/rules are applied.
4. The result is displayed.
```

If the tool uses a formula, explain it where appropriate.

Example:

```text
Input
   ↓
Validation
   ↓
Calculation
   ↓
Result
```

Do not expose secrets, API keys, internal database details, or security-sensitive implementation details.

---

# 13. How to Use

Each tool should contain a clear practical guide.

Example:

```text
## How to use this tool

1. Enter [input].
2. Select [option].
3. Review [result].
4. Use the result as described.
```

This section should describe the actual UI.

It must never describe controls that don't exist.

---

# 14. Example Section

Where appropriate, add a realistic example.

Example:

```text
## Example

Suppose a user enters:

Input A: ...
Input B: ...

The tool produces:

Result: ...

This example demonstrates how the calculation works.
```

Examples should help users understand the tool rather than exist purely to increase word count.

---

# 15. Limitations / Important Information

Where relevant:

```text
## Important considerations

This tool provides [estimate/calculation/reference].

It should not be treated as a substitute for applicable regulations,
qualified professional judgment, employer procedures, or official
regulatory guidance.
```

The exact disclaimer depends on what the tool actually does.

Do not use unnecessarily broad legal/safety disclaimers.

---

# 16. FAQ

Each tool should have a small set of genuinely useful FAQs.

Potential question types:

```text
What does this tool calculate?

Who can use this tool?

What information do I need?

How is the result calculated?

Can I use the result for compliance?

What should I do if my situation is different?
```

Only include questions that are actually relevant.

Do not create dozens of nearly identical questions.

---

# 17. Related Tools

Every tool page should link to genuinely related tools.

Example:

```text
Related tools

[Tool A]
[Tool B]
[Tool C]
```

This creates a strong internal linking structure.

Avoid unrelated links.

---

# 18. Guides / Educational Content

Create a `/guides` section only where it adds genuine value.

The guides should answer useful questions related to the existing tools.

Examples:

```text
Hazwoper Training Guide
PPE Basics
Understanding Workplace Safety Requirements
Hazard Assessment Basics
Using Safety Calculators
```

The exact topics must be determined from the actual tools.

Do NOT create 100 generic AI articles.

Quality is more important than page count.

Google's AdSense guidance specifically emphasizes unique, relevant, useful content rather than simply increasing the amount of content.

---

# 19. Content Quality Rules

All new content must satisfy:

```text
Original
Relevant
Accurate
Useful
Readable
Human-reviewed
Non-duplicative
Not keyword stuffed
Not artificially inflated
```

Do not publish:

```text
AI-generated filler
Repeated paragraphs
Keyword lists
Search-engine-only paragraphs
Copied government text
Copied competitor text
Automatically generated FAQs
Automatically generated statistics
Fake expert claims
```

AI may assist drafting, but content must be reviewed and corrected before publication.

---

# 20. Author / Trust Information

Because the subject relates to workplace safety, the site should clearly communicate:

* Who operates the website.
* Purpose of the website.
* What the tools are intended to do.
* Whether the site is affiliated with any government agency.
* Appropriate limitations.

Never imply:

```text
Official OSHA tool
Government-approved calculator
OSHA-certified tool
```

unless this is genuinely true and documented.

---

# 21. About Page

Create:

```text
/about
```

The page should explain:

```text
What is Hazwoper Useful Tools?

Why was the site created?

What types of tools are available?

Who are the tools designed to help?

How is information reviewed?

What are the limitations?

Who operates the website?

How can users contact the site owner?
```

The content must reflect reality.

---

# 22. Contact Page

Create:

```text
/contact
```

Include a working contact mechanism.

Possible implementation:

```text
Contact form
    ↓
Validation
    ↓
Server-side submission
    ↓
Email / Supabase / existing infrastructure
```

Do not create a fake contact form that doesn't actually deliver messages.

---

# 23. Privacy Policy

Create:

```text
/privacy-policy
```

The policy must accurately describe:

* Cookies.
* Analytics.
* Ad technology when applicable.
* Supabase/data storage.
* Contact form information.
* Any authentication.
* Any third-party services.
* Data retention where applicable.
* User rights where applicable.

Google states that publishers using Google advertising cookies need a privacy policy that discloses relevant cookie/ad practices.

Do not copy another site's privacy policy without adapting it to the actual application.

---

# 24. Terms Page

Create:

```text
/terms
```

The terms should accurately describe:

* Website usage.
* Tool usage.
* Intellectual property.
* Limitations.
* Prohibited misuse.
* Changes to service.
* Contact information.

Obtain appropriate legal review where required.

---

# 25. Disclaimer Page

Create:

```text
/disclaimer
```

Explain the intended use and limitations of the tools.

This is especially important where calculations/information relate to workplace safety.

Do not make the disclaimer so broad that it undermines the usefulness of the site.

---

# 26. Navigation

The primary navigation should expose the important public sections.

Recommended:

```text
Home
Tools
Guides
About
Contact
```

Footer:

```text
Tools
Guides
About
Contact
Privacy Policy
Terms
Disclaimer
```

Do not hide important public pages behind JavaScript-only interactions.

Google's AdSense guidance specifically recommends clear, easy-to-use navigation.

---

# 27. Breadcrumbs

Public content pages should have breadcrumbs.

Example:

```text
Home
  >
Tools
  >
PPE Calculator
```

For guides:

```text
Home
  >
Guides
  >
PPE Guide
```

Breadcrumbs should use actual links.

Where appropriate, implement BreadcrumbList structured data.

---

# 28. Technical SEO

Implement the following.

## 28.1 Page titles

Every indexable page requires a unique title.

Bad:

```text
Hazwoper Useful Tools
```

for every page.

Good:

```text
PPE Calculator | Hazwoper Useful Tools
```

```text
Hazwoper Training Guide | Hazwoper Useful Tools
```

Titles must accurately describe the page.

---

# 29. Meta descriptions

Every indexable page should have a unique description.

Example:

```text
Use our PPE calculator to [accurate description of function].
Learn how the calculation works and how to interpret the result.
```

Do not keyword stuff.

Do not use the same description on every page.

---

# 30. Canonical URLs

Every indexable page should have a canonical URL.

Example:

```text
https://example.com/tools/ppe-calculator
```

The canonical must use the production domain.

Avoid canonical URLs pointing to:

```text
vercel.app
localhost
preview deployments
```

---

# 31. Production Domain

Once the custom domain is selected:

```text
https://example.com
```

becomes the canonical production origin.

The Vercel URL:

```text
https://hazwoper-useful-tools.vercel.app
```

should not remain the preferred canonical domain.

Configure the production domain in Vercel and ensure the canonical metadata, sitemap, Open Graph URLs, and structured data use the production domain.

---

# 32. Redirect Strategy

If appropriate:

```text
www.example.com
        ↓
301
        ↓
example.com
```

or the reverse, but choose exactly one preferred host.

Likewise:

```text
old public URL
       ↓
301
       ↓
new URL
```

Do not create redirect chains.

---

# 33. Sitemap

Create a dynamic:

```text
/sitemap.xml
```

The sitemap should include indexable public pages.

Include:

```text
Homepage
Tool directory
Public tool pages
Guide directory
Public guide pages
About
Contact
```

Do not include:

```text
login
signup
dashboard
account
admin
private pages
temporary pages
duplicate URLs
noindex pages
```

Google recommends submitting a sitemap and ensuring important pages are crawlable.

---

# 34. Robots.txt

Create:

```text
/robots.txt
```

Allow normal public crawling.

Block private application areas where applicable.

Example concept:

```text
User-agent: *
Allow: /

Disallow: /dashboard/
Disallow: /account/
Disallow: /admin/
```

The exact rules must match the actual application routes.

Do not block:

```text
/css
/js
/images
public tool pages
```

unless there is a specific reason.

---

# 35. Noindex Strategy

Use `noindex` where appropriate for pages that provide little independent search value.

Potential examples:

```text
login
signup
account
dashboard
temporary results
internal search results
private pages
```

Do not blindly `noindex` tool pages.

Public tools are core content and should generally remain indexable if they provide genuine standalone value.

---

# 36. Dynamic / Query URLs

Avoid creating large numbers of duplicate URLs such as:

```text
/tools/tool?x=1
/tools/tool?x=2
/tools/tool?x=3
```

where the content is essentially identical.

The canonical public tool URL should remain:

```text
/tools/tool
```

---

# 37. Open Graph

Every public page should have appropriate Open Graph metadata.

At minimum:

```text
og:title
og:description
og:url
og:type
og:image
```

Use page-specific images where practical.

---

# 38. Twitter/X Metadata

Where appropriate:

```text
twitter:card
twitter:title
twitter:description
twitter:image
```

Do not make this a high-priority dependency if the existing project does not need it.

---

# 39. Structured Data

Implement structured data only when the page actually qualifies.

Potential types:

```text
WebSite
Organization
BreadcrumbList
Article
FAQPage
```

Do not add structured data simply to increase the amount of JSON-LD.

The structured data must accurately describe visible page content.

Google recommends validating structured data and ensuring the relevant page is crawlable and not blocked by `robots.txt`, `noindex`, or authentication.

---

# 40. Organization / Website Schema

The global site may expose appropriate structured information such as:

```json
{
  "@type": "WebSite"
}
```

and, where appropriate:

```json
{
  "@type": "Organization"
}
```

Only use organization information that is real and verifiable.

---

# 41. Breadcrumb Schema

For:

```text
Home > Tools > Tool
```

generate appropriate BreadcrumbList structured data.

The structured data must match the visible breadcrumb.

---

# 42. FAQ Structured Data

FAQ structured data should only be used where the page actually contains the corresponding visible FAQ content and where the markup is appropriate under Google's current rich-result guidelines.

Do not add hidden FAQs only for search engines.

---

# 43. Article Structured Data

Guide pages may use Article structured data when they genuinely represent articles/guides.

Include accurate:

```text
headline
description
datePublished
dateModified
author
publisher
image
```

Do not invent author credentials.

---

# 44. Semantic HTML

Use proper HTML structure:

```html
<header>
<nav>
<main>
<section>
<article>
<footer>
```

Use:

```html
<h1>
<h2>
<h3>
```

in logical hierarchy.

Each public page should have one meaningful primary H1.

---

# 45. Accessibility

Improve:

* keyboard navigation
* form labels
* button labels
* focus states
* image alt text
* color contrast
* semantic HTML
* screen-reader support
* error messages

Do not sacrifice accessibility for visual design.

---

# 46. Mobile UX

Every tool must work properly on:

```text
Mobile
Tablet
Desktop
```

Tool inputs should not overflow horizontally.

Results should remain readable.

Navigation should remain accessible.

---

# 47. Performance

SEO improvements must not make the application unnecessarily slow.

Use Next.js capabilities appropriately:

* Server Components where possible.
* Optimized images.
* `next/image` where appropriate.
* Lazy-load non-critical content.
* Avoid unnecessary client components.
* Avoid shipping large JavaScript bundles.
* Avoid duplicate API calls.
* Avoid loading analytics unnecessarily early if it harms performance.

Do not convert interactive components to Server Components if that breaks functionality.

---

# 48. Content Rendering Requirement

Important SEO content must exist in the rendered page content in a crawlable form.

Avoid making all explanatory content dependent on:

```text
click "Read more"
```

or JavaScript-only rendering.

Interactive behavior can remain client-side.

The explanatory content should be part of the actual page.

---

# 49. Internal Linking

Create a deliberate internal linking graph.

Example:

```text
Homepage
   ↓
Tools
   ↓
Tool A
   ↓
Related Tool B
   ↓
Guide
   ↓
Tool C
```

Each important page should be reachable through normal navigation or internal links.

Avoid orphan pages.

---

# 50. Tool Directory

Create/improve:

```text
/tools
```

The directory should contain:

```text
H1: Hazwoper Tools

Introductory explanation

Tool categories

Tool cards
  ├── Name
  ├── Short description
  └── Open Tool
```

Each card must explain what the tool actually does.

Avoid cards containing only:

```text
Tool Name
Open
```

---

# 51. Tool Categorization

If the existing tools support categories, organize them logically.

Example:

```text
Safety Calculators
Training Tools
Compliance Resources
Planning Tools
Reference Tools
```

Only use categories that correspond to the actual tools.

---

# 52. Search

If the existing application has search functionality, preserve it.

Improve:

* accessible labels
* search result titles
* descriptions
* empty states
* internal linking

Do not make search result pages automatically indexable if they create low-value duplicate pages.

---

# 53. Error Pages

Create useful:

```text
404
500
```

pages.

404 should contain:

```text
Page not found

Search tools
Browse tools
Return home
```

Do not make error pages indexable.

---

# 54. Loading States

Loading states should remain functional.

However, public SEO content should not exist only inside a loading state.

Where possible:

```text
HTML content
+
interactive enhancement
```

rather than:

```text
empty HTML
↓
JavaScript loads everything
```

---

# 55. Authentication / Private Areas

If the application has authentication:

```text
/login
/signup
/dashboard
/account
```

these are application functionality and should remain unchanged.

They should generally not be included in the public SEO sitemap.

Private pages must not expose user information to search engines.

---

# 56. Supabase Considerations

Do not change the database architecture solely for SEO.

Public content should be fetched efficiently.

If content is stored in Supabase:

```text
Supabase
   ↓
server-side query
   ↓
Next.js page
   ↓
HTML
```

should be preferred where appropriate for public content.

Do not expose private Supabase keys or service-role credentials to client-side code.

---

# 57. Content Data Model

If the project already has a database-backed content model, reuse it.

If a content model is necessary, consider:

```text
ContentPage

id
slug
title
metaTitle
metaDescription
intro
content
status
publishedAt
updatedAt
canonicalUrl
```

Do not create a new CMS if the current application does not need one.

For a small hobby project, static/local content may be preferable.

---

# 58. SEO Metadata Architecture

Create a reusable metadata system.

Example conceptual API:

```text
createPageMetadata({
  title,
  description,
  path,
  image
})
```

This prevents every page from implementing SEO differently.

---

# 59. Global Metadata

Global defaults should include:

```text
site name
default description
production URL
default OG image
robots defaults
```

Individual pages should override:

```text
title
description
canonical
OG image
```

---

# 60. Content Template

Create a reusable tool-content layout.

Conceptually:

```text
<ToolPageLayout>

  <Breadcrumbs />

  <ToolHeader />

  <Tool />

  <ToolExplanation />

  <HowItWorks />

  <HowToUse />

  <Example />

  <ImportantConsiderations />

  <FAQ />

  <RelatedTools />

  <References />

</ToolPageLayout>
```

The implementation must adapt to the existing component architecture.

---

# 61. Content Requirements Per Tool

Before marking a tool page complete:

```text
[ ] Unique H1
[ ] Unique title
[ ] Unique meta description
[ ] Introductory explanation
[ ] Tool works correctly
[ ] Explanation of subject
[ ] Explanation of tool
[ ] How-to section
[ ] Example where useful
[ ] Limitations/considerations where useful
[ ] Relevant FAQ
[ ] Related tools
[ ] Breadcrumb
[ ] Canonical URL
[ ] Structured data where appropriate
[ ] Mobile responsive
[ ] Accessible
```

---

# 62. Content Quality Gate

A page must NOT be considered complete simply because it contains more words.

The reviewer should ask:

```text
Does this page answer the user's actual question?

Does it explain the tool?

Does it provide information unavailable from the interface alone?

Is the content original?

Is it accurate?

Is it easy to understand?

Would a user bookmark or share this page because it is useful?

Does the content naturally support the tool?
```

Google's own AdSense guidance emphasizes unique and interesting content, clear navigation, and actual value to visitors.

---

# 63. Avoid Thin Content

Do not create:

```text
H1
50 words
Tool
100 words
FAQ copied from another page
```

just to satisfy an artificial word count.

There is no guaranteed "1,000 words per page" rule.

The objective is **useful completeness**, not word count.

---

# 64. Avoid Duplicate Content

Do not duplicate the same explanatory text across every tool.

For example, avoid:

```text
What is Hazwoper?
[Same 500 words]
```

on 20 pages.

Instead:

```text
Tool-specific explanation
```

with links to a more comprehensive guide where appropriate.

---

# 65. References

Where factual/regulatory information is used, include appropriate references.

For example:

```text
References

Official regulatory guidance
Relevant technical documentation
Applicable standards
```

Use accurate links.

Do not claim that the website itself is an authority when it is simply presenting information.

---

# 66. External Links

External references should:

* Be relevant.
* Be trustworthy.
* Help users verify information.
* Open normally.
* Not be excessive.

Avoid link farms.

---

# 67. AdSense Placement Readiness

The site should be designed so that advertisements, when approved, can appear without destroying the UX.

Do not place ads:

```text
inside important tool controls
over form buttons
where users may accidentally click them
between every paragraph
on empty pages
```

Google's policies prohibit ads on non-content-based pages and pages with insufficient content, and require sites showing ads to be easy to navigate.

---

# 68. No AdSense on Thin Application Screens

Do not place advertisements on:

```text
Login
Signup
Dashboard
Account
Private results
Utility-only screens
Error pages
```

unless the page genuinely meets applicable content/policy requirements.

---

# 69. AdSense Integration

After content and technical work are complete:

```text
AdSense
   ↓
Production domain
   ↓
Site verification
   ↓
AdSense code
   ↓
Review
```

The site must be live and contain enough content for Google to evaluate it. Google also requires publishers to place the provided code correctly when connecting the site.

Do not treat AdSense approval as a development test that can be guaranteed.

---

# 70. Analytics

If appropriate, integrate Google Analytics.

Track:

```text
page views
tool usage
tool completion
errors
navigation
traffic sources
```

Do not collect unnecessary personal information.

The existing analytics solution, if any, should be reused rather than duplicated.

Google itself recommends Analytics as a way for publishers to understand traffic and optimize their sites.

---

# 71. Google Search Console

After the production domain is available:

```text
Google Search Console
       ↓
Add domain/property
       ↓
Verify ownership
       ↓
Submit sitemap
       ↓
Inspect important URLs
       ↓
Request indexing where appropriate
```

Do not repeatedly request indexing for every page.

---

# 72. Crawlability Test

For every important public URL verify:

```text
HTTP 200
No accidental noindex
No robots block
Canonical correct
Content visible
Title exists
Description exists
H1 exists
Internal links work
```

---

# 73. SEO QA

Run tests for:

### Metadata

```text
[ ] Unique title
[ ] Unique description
[ ] Canonical
[ ] OG metadata
```

### Crawlability

```text
[ ] robots.txt
[ ] sitemap.xml
[ ] no accidental noindex
[ ] public pages accessible
```

### Content

```text
[ ] H1
[ ] meaningful introduction
[ ] tool explanation
[ ] how-to
[ ] useful FAQ
[ ] related tools
```

### UX

```text
[ ] mobile
[ ] desktop
[ ] keyboard
[ ] readable
[ ] no broken links
```

---

# 74. Performance QA

Check:

```text
LCP
CLS
INP
TTFB
JavaScript bundle size
image size
font loading
```

Use real measurements rather than assuming performance is good.

---

# 75. Security QA

Verify:

```text
No Supabase service role key in browser
No secret API keys in client bundle
No private user data indexed
No unsafe HTML rendering
Forms validated
Environment variables correctly separated
```

---

# 76. URL QA

Verify:

```text
Production domain
HTTPS
Canonical domain
www/non-www consistency
No accidental localhost URLs
No Vercel preview URLs in metadata
No duplicate trailing-slash problems
```

---

# 77. Content Publishing Workflow

For every new guide/tool:

```text
Draft
 ↓
Technical review
 ↓
Content accuracy review
 ↓
SEO metadata
 ↓
Internal links
 ↓
Mobile QA
 ↓
Publish
 ↓
Search Console inspection
```

---

# 78. Recommended Implementation Order

## Phase 1 — Repository audit

No code changes initially.

Create:

```text
route inventory
component inventory
tool inventory
SEO inventory
content inventory
```

---

## Phase 2 — Preserve existing behavior

Create regression checks for every tool.

Record:

```text
inputs
expected outputs
validation
edge cases
```

---

## Phase 3 — SEO foundation

Implement:

```text
metadata architecture
canonical URLs
robots.txt
sitemap.xml
Open Graph
structured data infrastructure
404
```

---

## Phase 4 — Site architecture

Implement/improve:

```text
/tools
/guides
/about
/contact
/privacy-policy
/terms
/disclaimer
```

while preserving existing routes.

---

## Phase 5 — Tool content

Update each public tool page:

```text
Introduction
Tool
What is it?
How it works
How to use
Example
Considerations
FAQ
Related tools
References
```

---

## Phase 6 — Internal linking

Connect:

```text
Homepage
↕
Tools
↕
Tool pages
↕
Guides
```

---

## Phase 7 — UX/accessibility

Improve:

```text
mobile
keyboard
forms
semantic HTML
loading states
error states
navigation
```

---

## Phase 8 — Performance

Optimize:

```text
images
JavaScript
server/client boundaries
fonts
data fetching
```

---

## Phase 9 — Search Console

Configure:

```text
production domain
Search Console
sitemap
URL inspection
```

---

## Phase 10 — AdSense readiness review

Perform a complete human review.

Check:

```text
Original content
Useful tools
Clear navigation
Trust pages
Privacy disclosures
No thin pages
No duplicate content
No broken links
No misleading claims
Mobile UX
Desktop UX
```

Only after this should the site be submitted for another AdSense review.

---

# 79. Acceptance Criteria

The project is complete when:

### Functionality

* [ ] Every existing tool still works.
* [ ] Existing calculations are unchanged.
* [ ] Existing inputs/outputs are preserved.
* [ ] Existing authentication behavior is preserved.
* [ ] Existing Supabase functionality is preserved.

### SEO

* [ ] Every important public page has unique metadata.
* [ ] Canonical URLs use the production domain.
* [ ] Sitemap works.
* [ ] Robots works.
* [ ] Open Graph metadata exists.
* [ ] Appropriate structured data exists.
* [ ] No accidental `noindex`.
* [ ] No accidental Vercel URLs in production metadata.

### Content

* [ ] Homepage clearly explains the product.
* [ ] Tool directory explains available tools.
* [ ] Every important tool has meaningful supporting content.
* [ ] Tool pages explain the problem being solved.
* [ ] Tool pages explain how the tool works.
* [ ] Tool pages explain how to use the tool.
* [ ] Relevant examples exist.
* [ ] Relevant FAQs exist.
* [ ] Related tools are linked.
* [ ] Content is original and human-reviewed.
* [ ] No mass-produced filler content exists.

### Trust

* [ ] About page exists.
* [ ] Contact page works.
* [ ] Privacy policy exists.
* [ ] Terms exist.
* [ ] Disclaimer exists.
* [ ] Site ownership/purpose is clear.
* [ ] No false government/OSHA affiliation is implied.

### UX

* [ ] Mobile works.
* [ ] Desktop works.
* [ ] Keyboard navigation works.
* [ ] Forms have labels.
* [ ] Error states are understandable.
* [ ] Navigation is clear.

### AdSense

* [ ] Public pages provide meaningful content.
* [ ] No ads are planned for private/non-content screens.
* [ ] Privacy disclosures account for advertising technology.
* [ ] AdSense code can be placed in the production HTML.
* [ ] Production site is live.
* [ ] Site is ready for another review.

---

# 80. Important AdSense Expectation

This implementation is designed to address the issues associated with the reported:

> Low value content

message.

However:

```text
SEO implementation
        ≠
guaranteed Google ranking

Content improvements
        ≠
guaranteed AdSense approval
```

Google reviews the entire site and its policies. Its official documentation explicitly says sites should contain original, interesting, relevant content and provide a good user experience.

The objective is therefore to make the website genuinely useful rather than attempting to satisfy an artificial AdSense checklist.

---

# 81. Final Target Architecture

The final public experience should conceptually look like:

```text
                         DOMAIN
                           │
                           ▼
                  hazwoper-tools.com
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
         Next.js                    Supabase
             │                           │
      ┌──────┼──────┐                    │
      │      │      │                    │
      ▼      ▼      ▼                    ▼
    Home   Tools   Guides             Database
             │
       ┌─────┼─────┐
       ▼     ▼     ▼
     Tool   Tool   Tool
       │     │     │
       ▼     ▼     ▼
   Explanation
   How it works
   How to use
   Example
   FAQ
   Related tools
   References
       │
       ▼
   Search engines
       │
       ▼
 Google Search Console
       │
       ▼
    AdSense Review
```

---

# 82. Developer Rule

**Do not implement this PRD blindly.**

First inspect the existing repository and map:

```text
PRD requirement
       ↓
Existing implementation
       ↓
Required change
       ↓
Potential regression
```

If the current project already implements a requirement, reuse it.

If an existing implementation is functionally correct but technically weak for SEO, improve it without changing its user-facing behavior.

If a proposed change could alter a tool's calculation or workflow, stop and treat it as a separate change.

The primary principle is:

> **Improve discoverability, content quality, trust, and crawlability while keeping the existing product functionality intact.**
