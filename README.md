# yr_portfolio

Portfolio for Yangda Renaud Dimanche, a recent Master’s graduate in Information Systems and Technology. It presents three career tracks equally: IT Support/Help Desk, Administrative Assistant/Office Assistant, and Data Entry/Records/Office Clerk.

## Project Overview

The public site is a static frontend. The checked-in workflow deploys through GitHub Pages, and the shared production page observed during the audit is `https://renaud-ist.github.io/MyPortfolio/`. The frontend calls a separately deployed Cloudflare Worker API. Worker source, D1 bindings, Cloudflare account configuration, and Brevo credentials are not in this repository.

The physical workspace is still named `MyPortFolio`, and the GitHub remote is `renaud-ist/MyPortfolio`. `yr_portfolio` is the project/documentation identity; changing the GitHub repository and public URL requires a repository rename and corresponding hosting/DNS confirmation. Do not change canonical URLs until that new address is live.

## Features

- Three equal resume tracks with descriptive PDF downloads.
- Responsive portfolio with education, experience, skills, and academic project summaries.
- Project category filtering and accessible, reduced-motion-aware interactions.
- Contact form posting JSON to the Cloudflare Worker.
- Admin authentication, inbox, conversation threads, read/archive/delete actions, notifications, and replies through Worker API routes.
- Static metadata, icons, web manifest, crawler rules, and GitHub Pages workflow.

## Technology Stack

- HTML, CSS, and browser JavaScript.
- GitHub Actions and GitHub Pages for static publishing.
- Cloudflare Worker API and Cloudflare D1 are the documented external backend architecture; their configuration is maintained elsewhere and was not verifiable from this source repository.
- Brevo is described as an outbound email provider in project context, but no Brevo implementation or credential binding is present here.
- Legacy/alternate-hosting PHP, MySQL SQL, and PHP smoke-test files remain in the repository but are not part of the GitHub Pages artifact.

## Installation

No frontend package installation is needed. Requirements for local checks are Node.js 22 or later and, only for the legacy PHP tools, PHP 8.

```powershell
git clone https://github.com/renaud-ist/MyPortfolio.git yr_portfolio
cd yr_portfolio
```

The resume PDFs are currently local untracked files in the audited worktree. Add them to version control before deployment or the resume URLs will return 404 in the published site.

## Local Development

Serve the site over HTTP so browser APIs and path resolution behave like hosting:

```powershell
python -m http.server 8000
```

Open `http://127.0.0.1:8000/`. The frontend uses `http://127.0.0.1:8787` for localhost API calls. Start a compatible local Worker/API at that address if testing contact/admin flows; otherwise the form and dashboard will report request errors. Do not use the static PHP endpoints as a substitute for the documented Worker contract.

## Project Structure

```text
index.html                         Static public portfolio
index.php                          Legacy PHP wrapper; not used by Pages
assets/css/style.css               Site and admin UI styles
assets/js/script.js                Filtering, contact form, and Worker API UI
assets/php/                        Legacy PHP/MySQL handlers, excluded from Pages
images/                            Portrait and education logos
resume/                            Three role-specific PDF resumes
setup.sql                          Legacy MySQL schema, not the Worker D1 schema
tests/site-smoke.mjs               Static references and deployment regression test
tests/smoke.php                    Legacy PHP-host smoke test
.github/workflows/pages.yml        Static artifact validation and Pages deployment
README.md                          Sole project documentation file
```

## Resume Management

Keep these three files available at the exact case-sensitive paths used in `index.html`:

| Career track | File |
| --- | --- |
| IT Support / Help Desk / Technical Support | `resume/Yangda_Renaud_IT_Support_CV.pdf` |
| Administrative Assistant / Office Assistant | `resume/Yangda_Renaud_Admin_Assistant_CV.pdf` |
| Data Entry / Records Clerk / Office Clerk | `resume/Yangda_Renaud_Data_Entry_CV.pdf` |

Each has an equal card, role description, and explicit download action. The Administrative Assistant CV uses the existing `Yangda_Renaud_Admin_Assistant_CV.pdf` filename. Compare all three PDF contents before publishing: verify contact details, degree names/dates, role-specific summaries, employment/volunteer claims, and spelling. PDF presence and browser opening were checked; text-level consistency was not verified.

## Contact Form Configuration

The browser handler in `assets/js/script.js` validates name, email, subject, and message, reads a honeypot field, and POSTs JSON to:

```text
POST https://myportfolio-api-proxy.yangdarenaud893.workers.dev/api/contact
Content-Type: application/json
{ "name": "...", "email": "...", "subject": "...", "message": "..." }
```

The paired Worker responds with `saved`, `notificationCreated`, and `emailSent` booleans. The visitor UI confirms receipt only after persistence and notification creation succeed; it uses distinct copy when email delivery fails. Worker source and contract tests live in the separate `yr_portfolio-backend-cors` repository. Local tests verify D1 batch-result handling and Brevo response outcomes, but production delivery still requires a deployed Worker, configured D1, and valid Brevo credentials.

The PHP handler at `assets/php/contact.php` is a separate legacy contract: it expects form-encoded `$_POST`, uses a PHP session CSRF token, writes to MySQL, and returns a `success` property. It does not match the static page’s JSON/`ok` contract and is excluded from GitHub Pages. `setup.sql` describes this legacy MySQL schema, not Cloudflare D1.

## Brevo Email Integration

Required notification recipient: `yangdarenaud893@gmail.com`. The intended email should include sender name, sender email, subject, message, server-side submission date/time, and visitor IP when available. Email must be sent server-side by the Worker using Brevo API or SMTP; never put a Brevo API key in frontend code, HTML, or a public GitHub secret exposed to the browser.

**Verification status:** the paired Worker source configures the recipient, Brevo API request, server timestamp, and trusted Cloudflare client IP, and contract tests cover both successful and failed provider responses. Actual email delivery and sender-domain verification remain unverified without production credentials and provider logs. Do not accept an IP supplied in the request body or trust arbitrary forwarding headers.

The legacy PHP handler optionally calls generic PHP `mail()` only when `CONTACT_NOTIFICATION_EMAIL` is set. This is not a Brevo integration, suppresses mail errors, and does not include the submitted subject, timestamp, or IP in the mail body. It does not prove production email works.

## Cloudflare Configuration

The frontend calls the Worker host above. `wrangler.toml`, Worker source, D1 migrations/bindings, and the explicit CORS policy are in the paired backend repository, not this one. The shared live site uses `github.io` and the checked-in workflow targets GitHub Pages; whether Cloudflare is also proxying a custom domain must be confirmed in the Cloudflare account. Avoid enabling a second Pages deployment target without intentionally choosing one and aligning DNS, custom domain, canonical URL, and workflow.
The backend lives in the separate `yr_portfolio-backend-cors` repository and owns `wrangler.toml`, Worker source, D1 migrations, and explicit CORS policy. The Worker allowlist includes the GitHub Pages origin and local development origins; its contract tests verify allowed preflight and rejection of an unrelated origin. This does not substitute for checking the deployed Worker configuration and browser network behavior after deployment.

### Notification Verification

The frontend uses authenticated Worker routes for login, conversations, notifications, conversation read-state updates, deletion, and replies. Worker contract tests confirm unauthenticated notification read-all requests are rejected, notification read state is stored in D1, and authenticated list/read-one/read-all paths return the expected shape. The checked-in Worker uses an explicit allowlist and its contract tests cover allowlisted and rejected origins. No live production preflight or contact POST was run during this audit.

An `OPTIONS /api/contact` probe returned `204` for both the GitHub Pages origin and an unrelated origin, with no `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, or `Access-Control-Allow-Headers` exposed to the browser. Browser CORS permission is **not verified**; cross-origin JSON POST may fail preflight. The `/api/contact` GET probe returned `404`, which is not a valid POST test. Do not treat these probes as proof that submissions work.

| Component | Evidence from this audit | Status |
| --- | --- | --- |
| Form submission path | Frontend posts JSON to Worker `/api/contact`; contract tests verify saved, notification, and email outcome flags. No production POST was sent to avoid creating test data. | Local contract verified; live delivery unverified |
| Worker contact endpoint | Source validates and rate-limits, inserts conversation/message/notification in D1 batch, and sends Brevo email after persistence. | Contract tests pass; deployed D1 behavior unverified |
| Admin routes | Worker authenticates notification, inbox, and reply operations with bearer tokens. | Auth and read mutation contract tests pass; production credentials unverified |
| Unread count | Dashboard badge uses Worker's persisted `unread_count`; one/all read controls call their notification endpoints. | Local UI/API contract covered; live reload persistence unverified |
| Email | Brevo helper targets `yangdarenaud893@gmail.com` and includes name, email, subject, message, timestamp, and available Cloudflare IP. | Payload/provider outcomes tested; actual delivery unverified |
| Spam protection | Worker rate-limits contact submissions by a digest of Cloudflare IP and user agent; frontend also validates and uses a honeypot. | Source and rate-limit path identified; production effectiveness unmeasured |
| CORS | Worker explicitly allows the GitHub Pages origin and local development origins, and rejects unrelated Origin values. | Contract tests pass; deployed preflight unverified |

The notification bell/nav badge now uses the Worker's persisted `unread_count`; each notification's “Mark notification read” action calls authenticated `PATCH /api/notifications?id=...`, and “Mark all notifications read” calls `POST /api/notifications/read-all`. Conversation read state remains a separate inbox feature. The Worker contract tests exercise persistent read-one and read-all mutations; reload persistence in the deployed D1 database remains a staging/production verification task.

Recommended Worker notification model:

1. Validate and rate-limit the contact request; reject honeypot submissions without creating records.
2. Insert the contact message and notification record in D1 before returning success. Include `name`, `email`, `subject`, `message`, server timestamp, trusted visitor IP if available, and `read_at`/`is_read` state.
3. Send the Brevo email as a separate side effect. Return a response that distinguishes message persistence from notification delivery, or enqueue reliable email delivery. An email failure must not silently discard the persisted contact message.
4. Implement authenticated notification list, read-state update, and delete endpoints. Return persisted state after mutation; apply authorization and ownership checks on every request.
5. Use an explicit CORS allowlist containing the exact production site origin and local development origin; answer OPTIONS with matching allowed origin/method/header values and add `Vary: Origin`. Reject unrelated origins.

Expected CORS shape for the Worker (adapt to the Worker framework; do not copy into browser code):

```js
const allowedOrigins = new Set([
	'https://renaud-ist.github.io',
	'http://127.0.0.1:8000',
]);

function corsHeaders(request) {
	const origin = request.headers.get('Origin');
	if (!origin || !allowedOrigins.has(origin)) return null;
	return {
		'Access-Control-Allow-Origin': origin,
		'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Authorization, Content-Type',
		'Access-Control-Max-Age': '86400',
		'Vary': 'Origin',
	};
}
```

The Worker should return a clear `403` for disallowed origins and include the allowlisted headers on preflight and actual API responses. Re-test preflight from the live page and an unrelated origin after updating Worker code.

Do not add a second storage system before checking the Worker project. If D1 is already bound as described, use it for durable messages, notification state, and unread counts. KV is better suited to ephemeral cache/rate limits than the authoritative inbox record. If there is no configured durable store, provision D1 and migrations with the Worker rather than attempting persistence in browser storage.

## GitHub Deployment

`.github/workflows/pages.yml` validates the site and stages only `index.html`, static CSS/JS, icons, images, resumes, `robots.txt`, and `site.webmanifest`. It excludes PHP, SQL, environment files, extraction utilities, and tests from the uploaded artifact. GitHub Pages must be configured to use **GitHub Actions** as the publishing source. The PDFs and workflow must be committed for them to be included in a deployment.

The public URL currently observed is `https://renaud-ist.github.io/MyPortfolio/`; that live page still served the older “Tech Strategist” content during the last browser check. After publishing, verify the workflow completes, the page shows the three-track Resume section, and each PDF download returns the correct file. If the GitHub repository is renamed to `yr_portfolio`, verify the resulting Pages URL first, then update canonical/Open Graph/JSON-LD URLs, deployment links, and custom-domain redirects as one change.

## Testing and Validation

Run static regression checks:

```powershell
node tests/site-smoke.mjs
node --check assets/js/script.js
```

The smoke test checks unique HTML IDs, the single main landmark, metadata, the Worker origin, three exact resume paths and cards, local assets, fragment links, and the Pages staging allowlist. The Pages workflow runs it before upload. Legacy PHP syntax checks can be run with `php -l` on the PHP files; `tests/smoke.php` only applies to a separately running PHP/MySQL host and is not evidence of Worker behavior.

Browser checks covered 320, 390, 768, 980, and 1280 CSS pixel widths without horizontal overflow; the resume layout becomes one column on small/tablet screens and three columns on desktop. The local PDFs opened, but content comparison remains outstanding. Production contact POST, authenticated inbox mutations, D1 persistence, CORS, and Brevo delivery have not been proven. Run real integration tests against the Worker and check its D1 rows and Brevo delivery logs.

## Accessibility Features

- Language declaration, one main landmark, skip link, semantic sections, and heading hierarchy.
- Explicit contact labels, browser autocomplete, and polite live submission status.
- Keyboard-visible focus, reduced-motion support, and responsive controls.
- Descriptive, role-specific PDF link names.

These are implemented improvements, not a WCAG conformance certification. Still run HTML validation, contrast checks, keyboard-only testing, and screen-reader checks. Ensure disabled notification actions have a clear accessible state.

## SEO Features

- Descriptive title/meta description, canonical URL, Open Graph and Twitter card metadata.
- Person JSON-LD with education and role-relevant topics.
- Semantic headings and project/education content.
- Static web manifest and crawler rules.

Canonical and social URLs currently target the observed `/MyPortfolio/` address. Update them only after a repository/custom-domain rename is live; verify the social image is fetchable by external preview crawlers.

## Security Notes

- Do not commit `.env` secrets, Brevo keys, Worker credentials, or admin passwords. The repository ignores `.env` variants; secret-bearing files were not opened during review.
- The Pages artifact is allowlisted, but artifact exclusion does not remove secrets or sensitive files from git history. Review public repository history if a secret was ever committed; rotate any exposed credential.
- Keep admin tokens short-lived, use HTTPS, authenticate every inbox operation, escape rendered content, rate-limit login/contact endpoints, and avoid logging message bodies or secrets unnecessarily.
- Use CSRF protection if using cookie-authenticated endpoints. The current browser UI uses bearer tokens.
- For cross-origin calls, configure explicit CORS allowlists and test preflight from both allowed and disallowed origins. Current probes did not verify successful CORS.
- The PHP/MySQL handlers are legacy and are not protected by the GitHub Pages allowlist at the repository source level; `.htaccess` only helps Apache hosting. Keep them off public source hosting if they are no longer needed.
- Contact messages and IP addresses are personal data. Publish a retention/privacy notice and minimize IP retention.

## Troubleshooting

| Symptom | Likely cause and check |
| --- | --- |
| Resume download 404 | Confirm exact filename/case under `resume/`, commit the PDFs, and confirm the Pages artifact includes them. |
| Contact submit fails before reaching Worker | Check DevTools Network for `OPTIONS`; configure Worker CORS for the exact frontend origin and JSON `content-type`. |
| Contact succeeds but no inbox entry | Confirm Worker writes the message and notification to durable D1 before returning `{ok:true}`; inspect D1 and Worker logs. |
| Inbox badge is zero or incorrect | Confirm conversation list returns `is_read` or nullable `read_at` consistently and refreshes after mutations. |
| Email is missing | Check Worker Brevo secret binding, verified sender/domain, recipient, provider response, and delivery logs; frontend cannot verify delivery. |
| Old portfolio appears after push | Check the GitHub Actions Pages workflow and publishing source; the shared site was stale during the audit. |
| Admin APIs return 401 | Sign in again and inspect Worker token expiry/revocation; notifications require authentication. |
| PHP smoke test fails | It requires a separately running PHP/MySQL deployment and does not test the production Worker/D1 backend. |

## Change Log

- Consolidated audit and deployment documentation into this README.
- Added equal IT Support, Administrative Assistant, and Data Entry resume tracks with canonical PDF names.
- Added site smoke validation to the GitHub Pages workflow and restricted the static artifact.
- Improved responsive layout, accessibility, SEO metadata, and project-focused copy.
- Changed admin session storage to session-scoped storage and made notification counts reflect persisted unread conversations.
- Added a notification row action to mark its linked conversation read.
- Reworked the CV extraction utility to accept a document path rather than depend on a hard-coded project path/deleted document.

## Future Improvements

- Verify and, if necessary, fix Worker CORS, D1 message/notification writes, read/delete endpoint persistence, and Brevo delivery to `yangdarenaud893@gmail.com`.
- Add an integration test against a staging Worker that verifies a submission creates one durable message, an unread notification, and an email with all requested fields; test provider failure independently.
- Confirm the preferred deployment platform and rename the remote repository/workspace deliberately if `yr_portfolio` must also be the physical/repository name.
- Compare CV content for role-specific consistency; add verified project repository/demo links and outcome evidence.
- Add privacy/retention language, then run formal HTML, WCAG, and social-preview validation.
- Optimize oversized raster assets only after measuring their current transfer size and visual quality.