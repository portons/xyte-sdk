# feat: Redesign XYTE SDK Landing Page

## Overview

Redesign `docs/index.html` from a functional-but-generic developer documentation portal into a modern, aesthetic, professional landing page that immediately communicates what the XYTE SDK does, who it's for, and why it matters. The page must feel like a polished product page, not a README rendered to HTML.

## Problem Statement

The current landing page (`docs/index.html`) is functional but suffers from:

- **Generic "developer docs" aesthetic**: Blue-on-dark-blue with Poppins font, standard card layouts. Looks like every other AI-generated SDK portal.
- **Doesn't explain what XYTE actually is**: Jumps straight into "Operator + Agent Documentation Portal" without establishing what problem XYTE solves, what Xyte-the-platform is, or why someone should care.
- **No visual hierarchy for storytelling**: All sections look the same weight. No narrative flow from "what is this?" to "why should I use it?" to "how do I start?".
- **Screenshots buried at bottom**: The TUI dashboard and headless frame screenshots are powerful visual proof but hidden in section 6 of 8.
- **No personality**: The page could be for any SDK. Nothing connects it to IoT fleet management, device operations, or the human/agent duality that makes XYTE unique.

## Proposed Solution

### Aesthetic Direction: **Industrial Precision**

A design language inspired by mission-control dashboards and industrial monitoring systems. Think: the aesthetics of Bloomberg Terminal meets a modern SaaS product page. This direction:

- Matches the product's domain (fleet management, device monitoring, NOC operations)
- Differentiates from generic dev-tool landing pages
- Feels authoritative and production-grade
- Provides natural contrast between "human operator" and "AI agent" workflows

### Design System

**Typography:**
- Display font: `"Geist"` (Vercel's open-source font) or `"DM Sans"` for headings - geometric, modern, authoritative
- Mono font: `"Geist Mono"` or `"IBM Plex Mono"` for code blocks and terminal UI
- Body: Same as display, lighter weight

**Color Palette:**
- Background: Near-black with subtle warm undertone (`#0c0d0f` base, not pure black)
- Primary accent: Electric cyan/teal (`#06d6a0` or `#00e5a0`) - evokes monitoring dashboards, status-ok signals
- Secondary accent: Warm amber (`#f0a030`) - for CTAs, warnings, badges
- Text: Off-white (`#e8e8e8`) with muted gray (`#888`) for secondary
- Surface cards: Subtle glass-morphism with `backdrop-filter: blur` and fine borders (`rgba(255,255,255,0.06)`)
- Code surfaces: Slightly warmer dark (`#141518`)

**Spatial Composition:**
- Full-width hero with asymmetric layout
- Generous whitespace between sections (80-120px)
- Cards with subtle depth via box-shadow and border
- Overlapping elements (screenshots breaking out of their containers)

**Motion:**
- CSS-only animations: staggered fade-in on scroll via `@keyframes` + `animation-delay`
- Smooth hover transitions on interactive elements (0.2s ease)
- Subtle gradient shifts on hero background
- Terminal typing effect for the hero code block (CSS-only with `steps()`)

### Page Structure (Top to Bottom)

#### 1. Navigation Bar (sticky)
- XYTE logo + "XYTE SDK" wordmark (left)
- Nav links: Features | Screenshots | Use Cases | Get Started | Docs (center-right)
- GitHub link + "Get Started" CTA button (right)
- Frosted glass background on scroll

#### 2. Hero Section
**This is the most critical section.** Must answer in 5 seconds: "What is this and why should I care?"

- **Eyebrow**: `TypeScript SDK + CLI + TUI`
- **Headline**: `Fleet operations for humans and AI agents.` (large, bold, max 2 lines)
- **Subheadline** (1-2 sentences): `One SDK to manage IoT devices across tenants. Interactive TUI for operators, headless JSON for agents, MCP tools for orchestration. Install once, run xyte, paste your API key.`
- **Two CTA buttons**: "Get Started" (primary) | "View on GitHub" (secondary/outline)
- **Hero visual** (right side): An actual screenshot of the TUI dashboard, presented in a stylized terminal window frame with a glow effect. NOT a code snippet - the screenshot is the visual proof that this is a real, working product.
- **Trust badges below hero**: `Read-only by default` | `Guarded writes` | `Schema-locked outputs` | `MCP tools built in`

#### 3. "What is XYTE?" Explanation Section
**For the first-time visitor who has never heard of Xyte.**

A brief, clear explanation block:
- "Xyte is an IoT device management platform. The XYTE SDK gives you programmatic access to the entire platform: devices, spaces, incidents, tickets, and fleet analytics."
- Three capability columns with icons:
  - **For Operators**: Interactive TUI with 8 screens. Inspect fleets, triage incidents, manage tickets. Generate PDF reports.
  - **For Developers**: TypeScript SDK with typed namespaces. Call any endpoint safely with built-in guards for writes and deletes.
  - **For AI Agents**: Headless JSON mode, versioned machine contracts, MCP tool server. Deterministic, parseable, schema-validated outputs.

#### 4. Feature Grid
Six feature cards in a 3x2 grid (2x3 on mobile):

| Feature | Description | Visual Element |
|---------|-------------|----------------|
| Multi-Tenant Profiles | Switch between tenants and API key slots. Secure keychain storage. | Small terminal snippet showing `xyte tenant use acme` |
| Interactive TUI | 8 operational screens: dashboard, spaces, devices, incidents, tickets, copilot, setup, config. | Cropped screenshot of TUI tabs |
| Headless Mode | JSON-only NDJSON frames for agent consumption. Schema-versioned contracts. | Code block showing `xyte.headless.frame.v1` |
| Fleet Analytics | `inspect fleet` and `deep-dive` with configurable time windows. PDF report generation. | Example output snippet |
| MCP Server | `xyte mcp serve` exposes 7 tools for external agent orchestration. | Tool list with icons |
| Guarded Mutations | Read-only by default. `--allow-write` for mutations. `--confirm` for destructive ops. | Visual showing guard levels: Read > Write > Delete |

#### 5. Screenshots Section (Visual Proof)
**Elevated from the bottom to mid-page.** Two large screenshots side-by-side:

- **Left**: TUI Dashboard (`tui-dashboard-synthetic.png`)
  - Presented in a styled terminal chrome frame
  - Caption: "Interactive TUI dashboard - KPIs, incidents, tickets at a glance"
  - Label badge: `OPERATOR`

- **Right**: Headless JSON Frame (`headless-frame-synthetic.png`)
  - Presented in a styled terminal chrome frame
  - Caption: "Headless JSON frame - deterministic, schema-validated output for agents"
  - Label badge: `AGENT`

#### 6. Code Examples Section
**Two side-by-side panels** with real, copy-paste-ready code:

**Panel 1: "Operator Workflow"** (badge: HUMAN)
```bash
# Install and onboard
npm install && npm run build
xyte

# Inspect fleet health
xyte inspect fleet --tenant acme --format ascii

# Generate PDF report
xyte inspect deep-dive --tenant acme --window 24 --format json > /tmp/deep-dive.json
xyte report generate --tenant acme --input /tmp/deep-dive.json --out /tmp/report.pdf

# Open interactive dashboard
xyte tui --tenant acme
```

**Panel 2: "Agent Workflow"** (badge: MACHINE)
```bash
# Verify readiness
xyte setup status --tenant acme --format json
xyte config doctor --tenant acme --format json

# Call endpoint with envelope
xyte call organization.devices.getDevices \
  --tenant acme --output-mode envelope --strict-json

# Headless snapshot
xyte tui --headless --screen dashboard --format json --once --tenant acme

# Start MCP server
xyte mcp serve
```

#### 7. SDK Usage (TypeScript)
Brief code block showing programmatic usage:
```ts
import { createXyteClient } from '@xyte/sdk';

const client = createXyteClient();
const devices = await client.organization.getDevices({ tenantId: 'acme' });
const tickets = await client.call('partner.tickets.getTickets', { tenantId: 'acme' });
```

#### 8. Use Cases Section
Four use-case cards, each with a title, 2-3 bullet points, and a relevant icon/emoji stand-in:

1. **MSP / NOC Daily Operations** - Fleet health checks, PDF reports, guided remediation
2. **Manufacturer Reliability** - Incident tracking, telemetry analysis, remote commands
3. **Enterprise AV/IT** - Space monitoring, incident-ticket correlation, management reporting
4. **AI Agent Integration** - Headless frames, schema validation, MCP tool server

#### 9. CLI Command Reference (Compact Table)
Condensed version of the current API table. Sorted by workflow stage:
Setup > Discover > Read > Write > Inspect > Report > Headless > MCP

#### 10. Schema Contracts
Brief section showing the 5 versioned contracts with links to JSON schema files. Compact, not prominent.

#### 11. Get Started / Quickstart
Four-step flow (same as current but redesigned):
1. Install (`npm install && npm run build`)
2. Run (`xyte` - guided onboarding)
3. Verify (`xyte setup status`)
4. Operate (inspect / report / headless / MCP)

With a final large CTA: "Start building with XYTE SDK" linking to GitHub.

#### 12. Footer
- XYTE logo
- Links: GitHub | Documentation | Schemas | README
- "All screenshots use synthetic data"
- Copyright notice

### Technical Constraints

- **Single HTML file** with all CSS inlined in `<style>` tags
- **No external JS frameworks** - CSS-only animations, no React/Vue
- **External fonts loaded via Google Fonts** (or similar CDN) - acceptable
- **Responsive**: 3 breakpoints (mobile <640px, tablet <1040px, desktop)
- **Existing assets**: Must reference `./media/xyte-logo.png`, `./media/tui-dashboard-synthetic.png`, `./media/headless-frame-synthetic.png`
- **Accessibility**: Semantic HTML, ARIA labels, proper heading hierarchy, keyboard navigable
- **File size**: Keep under 50KB (HTML + CSS, excluding images)

## Acceptance Criteria

### Visual & Aesthetic
- [ ] Page has a distinct visual identity that does NOT look like generic AI-generated UI
- [ ] Typography uses distinctive fonts (not Inter/Roboto/Arial/system defaults)
- [ ] Color palette is cohesive with intentional accent usage
- [ ] Generous whitespace and clear visual hierarchy
- [ ] Screenshots are prominently featured with styled terminal chrome
- [ ] Code blocks are syntax-highlighted with a custom color scheme
- [ ] Smooth CSS animations on page load (staggered reveals)
- [ ] Hover states on all interactive elements

### Content & Communication
- [ ] A first-time visitor understands what XYTE SDK does within 5 seconds of landing
- [ ] The hero clearly states: TypeScript SDK for IoT fleet management, for humans AND agents
- [ ] "What is XYTE?" section explains the platform context
- [ ] Three audience segments are clearly addressed: Operators, Developers, AI Agents
- [ ] Real, working CLI commands are shown (copy-paste ready)
- [ ] SDK TypeScript usage is demonstrated
- [ ] All 4 use cases are presented
- [ ] Quickstart flow is clear and actionable

### Technical
- [ ] Single `index.html` file with inline `<style>`
- [ ] Responsive at 3 breakpoints (mobile/tablet/desktop)
- [ ] All existing screenshots referenced correctly
- [ ] XYTE logo used in navigation
- [ ] Semantic HTML with proper ARIA labels
- [ ] All internal links work (schema files, doc pages)
- [ ] Page loads fast (<2s on 3G, <50KB HTML)

### Screenshots & Visuals
- [ ] TUI dashboard screenshot shown in a styled terminal window frame
- [ ] Headless JSON screenshot shown in a styled terminal window frame
- [ ] Both screenshots are above the fold on desktop (or very close)
- [ ] Screenshots have descriptive captions
- [ ] Screenshots have audience badges (OPERATOR / AGENT)

## Implementation Notes

### File to modify
- `docs/index.html` - Complete rewrite of the existing file

### Files to reference (read-only)
- `docs/media/xyte-logo.png` - XYTE logo
- `docs/media/tui-dashboard-synthetic.png` - TUI screenshot
- `docs/media/headless-frame-synthetic.png` - Headless screenshot
- `README.md` - Source of truth for all CLI commands, SDK usage, features

### Font Loading
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### CSS Custom Properties (Design Tokens)
```css
:root {
  --bg-base: #0c0d0f;
  --bg-card: #141518;
  --bg-elevated: #1a1b20;
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-hover: rgba(255, 255, 255, 0.12);
  --text-primary: #e8e8e8;
  --text-secondary: #888;
  --text-muted: #555;
  --accent-primary: #06d6a0;    /* teal/green - status-ok, features */
  --accent-secondary: #f0a030;  /* amber - CTAs, badges */
  --accent-blue: #4da6ff;       /* links, code highlights */
  --shadow-card: 0 4px 24px rgba(0,0,0,0.3);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
}
```

### Scroll-triggered Animations (CSS-only)
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-in {
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
}

/* Stagger with animation-delay per section */
```

Note: For true scroll-triggered animations without JS, use `animation-timeline: view()` (CSS Scroll-Driven Animations) which has good browser support in 2026. Fallback: all elements visible by default, animation is progressive enhancement.

## References

### Internal
- Current landing page: `docs/index.html`
- README with all features/commands: `README.md`
- Screenshots: `docs/media/tui-dashboard-synthetic.png`, `docs/media/headless-frame-synthetic.png`
- Logo: `docs/media/xyte-logo.png`
- Schema files: `docs/schemas/*.schema.json`
- Documentation pages: `docs/setup.md`, `docs/tui.md`, `docs/headless-visuals.md`, `docs/endpoints.md`, `docs/config.md`, `docs/llm-providers.md`

### Design Inspiration (direction, not copy)
- Vercel's developer documentation: clean typography, generous spacing, dark theme done right
- Linear's landing page: smooth animations, clear value proposition, product screenshots as heroes
- Raycast's landing page: terminal-aesthetic product pages, command palette UI
- Stripe's developer docs: code examples as first-class content, clear API surface presentation
