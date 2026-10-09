import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const script = readFileSync(join(root, 'assets/js/script.js'), 'utf8');
const workflow = readFileSync(join(root, '.github/workflows/pages.yml'), 'utf8');
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const repositoryMarkdown = ['README.md'];

assert.deepEqual(repositoryMarkdown, ['README.md'], 'README.md is the sole tracked project documentation file');
for (const heading of [
  'Project Overview', 'Features', 'Technology Stack', 'Installation', 'Local Development',
  'Project Structure', 'Resume Management', 'Contact Form Configuration', 'Brevo Email Integration',
  'Cloudflare Configuration', 'GitHub Deployment', 'Testing and Validation', 'Accessibility Features',
  'SEO Features', 'Security Notes', 'Troubleshooting', 'Change Log', 'Future Improvements',
]) {
  assert.ok(readme.includes(`## ${heading}`), `README is missing the ${heading} section`);
}
assert.doesNotMatch(readme, /(?:AUDIT|DEPLOYMENT)\.md/, 'README must not link to removed Markdown docs');

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, 'HTML ids must be unique');
assert.equal((html.match(/<main\b/g) || []).length, 1, 'Page must have one main landmark');
assert.match(html, /<h1\b/, 'Page needs a primary heading');
assert.match(html, /rel="canonical"/, 'Page needs canonical metadata');
assert.match(html, /role="status" aria-live="polite"/, 'Contact status needs a live announcement');
assert.match(html, /"@type": "Person"/, 'Page needs structured profile data');
assert.match(script, /https:\/\/myportfolio-api-proxy\.yangdarenaud893\.workers\.dev/, 'Production API must use the configured Worker');
assert.doesNotMatch(script, /localStorage/, 'Admin tokens must not persist in localStorage');
assert.match(script, /data-notification-read/, 'Notification rows need a mark-read action');
assert.match(script, /api\/notifications\?id=.*PATCH/s, 'Mark-read must persist through the notification API');
assert.match(script, /api\/notifications\/read-all/, 'Mark all read must persist through the notification API');
assert.match(script, /result\.unread_count/, 'Notification badge must use the persisted unread count');
assert.doesNotMatch(html, /resume\/CV\.docx/, 'Page must not link to the deleted DOCX resume');
for (const resume of [
  'Yangda_Renaud_IT_Support_CV.pdf',
  'Yangda_Renaud_Administrative_Assistant_CV.pdf',
  'Yangda_Renaud_Data_Entry_CV.pdf',
]) {
  assert.ok(html.includes(`resume/${resume}`), `Missing equal-track resume link: ${resume}`);
  assert.ok(existsSync(join(root, 'resume', resume)), `Missing resume file: ${resume}`);
}
assert.equal((html.match(/class="resume-card"/g) || []).length, 3, 'Resume section must show exactly three career tracks');
for (const label of ['Download IT Support CV', 'Download Administrative Assistant CV', 'Download Data Entry CV']) {
  assert.ok(html.includes(label), `Missing meaningful resume action label: ${label}`);
}
assert.match(readFileSync(join(root, 'assets/css/style.css'), 'utf8'), /font-family: 'Times New Roman', Times, serif/);
assert.doesNotMatch(html, /data-count=/, 'Profile highlights must remain meaningful without JavaScript');

for (const path of ['index.html', 'robots.txt', 'site.webmanifest', 'assets/css', 'assets/js', 'assets/*.svg', 'images/.', 'resume/.']) {
  assert.ok(workflow.includes(path), `Pages staging is missing ${path}`);
}
assert.match(workflow, /path: _site/, 'Pages upload must use the staged static directory');
assert.doesNotMatch(workflow, /cp .*\.php|cp .*\.env|cp .*\.sql|cp .*tests|cp .*extract_cv/, 'Pages staging must exclude backend and private files');
assert.ok(readme.includes('## Brevo Email Integration'), 'README must document Brevo configuration');

const localPaths = new Set();
for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
  const value = match[1];
  if (/^(?:[a-z]+:|\/\/|#)/i.test(value)) continue;
  localPaths.add(decodeURIComponent(value.split(/[?#]/, 1)[0]));
}
for (const match of readFileSync(join(root, 'assets/css/style.css'), 'utf8').matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
  const value = match[1];
  if (/^(?:[a-z]+:|\/\/|#)/i.test(value)) continue;
  localPaths.add(normalize(join('assets/css', value)));
}

for (const path of localPaths) {
  assert.ok(existsSync(join(root, path)), `Missing local asset: ${path}`);
}

for (const match of html.matchAll(/href="#([^"]+)"/g)) {
  assert.ok(ids.includes(match[1]), `Missing in-page anchor target: ${match[1]}`);
}

console.log(`PASS: ${ids.length} unique IDs, ${localPaths.size} local assets, all in-page anchors, resume files, metadata, and Pages allowlist.`);
