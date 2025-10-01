# OverlayApp UX/UI Strategy
## Comprehensive Design System & User Experience Guide

**Version:** 1.0.0
**Date:** October 2025
**Target Users:** Surveyors, GIS Professionals, Field Workers

---

## 1. Design System Foundation

### 1.1 Component Library Recommendation

**Chosen Framework: Shadcn/ui + Radix UI + Tailwind CSS**

**Rationale:**
- **Shadcn/ui**: Modern, accessible, customizable components built on Radix UI
- **Radix UI**: Unstyled, accessible primitives - perfect for custom branding
- **Tailwind CSS**: Utility-first CSS for rapid, consistent development
- **Framer Motion**: Smooth animations and transitions
- **React Aria**: Accessibility patterns for complex interactions

**Alternative Considerations:**
- Material-UI: Too opinionated for custom branding
- Ant Design: Better for internal tools, not field-focused apps
- Chakra UI: Good alternative, but less momentum than Shadcn

### 1.2 Color Palette

```css
/* Primary - Professional Blue (Trust, Technology) */
--color-primary-50: #eff6ff;
--color-primary-100: #dbeafe;
--color-primary-200: #bfdbfe;
--color-primary-300: #93c5fd;
--color-primary-400: #60a5fa;
--color-primary-500: #3b82f6;  /* Main brand color */
--color-primary-600: #2563eb;
--color-primary-700: #1d4ed8;
--color-primary-800: #1e40af;
--color-primary-900: #1e3a8a;
--color-primary-950: #172554;

/* Secondary - Earth Tones (GIS/Mapping Context) */
--color-secondary-50: #fafaf9;
--color-secondary-100: #f5f5f4;
--color-secondary-200: #e7e5e4;
--color-secondary-300: #d6d3d1;
--color-secondary-400: #a8a29e;
--color-secondary-500: #78716c;
--color-secondary-600: #57534e;
--color-secondary-700: #44403c;
--color-secondary-800: #292524;
--color-secondary-900: #1c1917;

/* Accent - Vibrant Orange (Action, Highlight) */
--color-accent-50: #fff7ed;
--color-accent-100: #ffedd5;
--color-accent-200: #fed7aa;
--color-accent-300: #fdba74;
--color-accent-400: #fb923c;
--color-accent-500: #f97316;  /* Main accent */
--color-accent-600: #ea580c;
--color-accent-700: #c2410c;
--color-accent-800: #9a3412;
--color-accent-900: #7c2d12;

/* Semantic Colors */
--color-success: #10b981;
--color-warning: #f59e0b;
--color-error: #ef4444;
--color-info: #3b82f6;

/* Neutral Grays */
--color-gray-50: #fafafa;
--color-gray-100: #f4f4f5;
--color-gray-200: #e4e4e7;
--color-gray-300: #d4d4d8;
--color-gray-400: #a1a1aa;
--color-gray-500: #71717a;
--color-gray-600: #52525b;
--color-gray-700: #3f3f46;
--color-gray-800: #27272a;
--color-gray-900: #18181b;
--color-gray-950: #09090b;

/* Dark Mode Palette */
--color-dark-bg-primary: #0a0a0a;
--color-dark-bg-secondary: #141414;
--color-dark-bg-tertiary: #1f1f1f;
--color-dark-border: #2a2a2a;
--color-dark-text-primary: #ededed;
--color-dark-text-secondary: #a1a1aa;
```

### 1.3 Typography System

```css
/* Font Families */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'Fira Code', 'Consolas', 'Monaco', monospace;

/* Font Sizes (Type Scale - 1.250 Major Third) */
--text-xs: 0.75rem;      /* 12px - Small labels, captions */
--text-sm: 0.875rem;     /* 14px - Secondary text, descriptions */
--text-base: 1rem;       /* 16px - Body text */
--text-lg: 1.125rem;     /* 18px - Large body, callouts */
--text-xl: 1.25rem;      /* 20px - H6 */
--text-2xl: 1.5rem;      /* 24px - H5 */
--text-3xl: 1.875rem;    /* 30px - H4 */
--text-4xl: 2.25rem;     /* 36px - H3 */
--text-5xl: 3rem;        /* 48px - H2 */
--text-6xl: 3.75rem;     /* 60px - H1 */

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;

/* Line Heights */
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;

/* Letter Spacing */
--tracking-tight: -0.025em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
```

### 1.4 Spacing & Layout Grid

```css
/* Spacing Scale (4px base unit) */
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */

/* Container Widths */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;

/* Layout Grid (12-column) */
--grid-columns: 12;
--grid-gap: 1.5rem;     /* 24px */
--grid-gap-sm: 1rem;    /* 16px mobile */

/* Border Radius */
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.375rem;  /* 6px */
--radius-lg: 0.5rem;    /* 8px */
--radius-xl: 0.75rem;   /* 12px */
--radius-2xl: 1rem;     /* 16px */
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

### 1.5 Iconography

**Primary Icon Library: Lucide React**

**Rationale:**
- Modern, consistent design language
- Tree-shakeable (only import icons you use)
- Perfect stroke width for technical applications
- Excellent React support

**Icon Sizes:**
```css
--icon-xs: 12px;
--icon-sm: 16px;
--icon-md: 20px;
--icon-lg: 24px;
--icon-xl: 32px;
--icon-2xl: 48px;
```

**Key Icons for OverlayApp:**
- `Map`: Main map view
- `FileUp`: PDF upload
- `Layers`: Overlay management
- `MapPin`: Georeferencing points
- `Navigation`: Location services
- `Download`: Export functionality
- `Settings`: Configuration
- `Users`: Team management
- `CreditCard`: Billing
- `Wifi/WifiOff`: Online/offline status

### 1.6 Dark Mode Support

**Implementation Strategy:**

```css
/* CSS Variables approach with data-theme attribute */
html[data-theme="light"] {
  --bg-primary: var(--color-gray-50);
  --bg-secondary: #ffffff;
  --text-primary: var(--color-gray-900);
  --text-secondary: var(--color-gray-600);
  --border-primary: var(--color-gray-200);
}

html[data-theme="dark"] {
  --bg-primary: var(--color-dark-bg-primary);
  --bg-secondary: var(--color-dark-bg-secondary);
  --text-primary: var(--color-dark-text-primary);
  --text-secondary: var(--color-dark-text-secondary);
  --border-primary: var(--color-dark-border);
}

/* Auto-detect system preference */
@media (prefers-color-scheme: dark) {
  html:not([data-theme]) {
    /* Apply dark mode variables */
  }
}
```

**Map Considerations:**
- Dark mode map tiles (Mapbox Dark, CartoDB Dark Matter)
- Adjusted overlay opacity for visibility
- High-contrast georeferencing markers
- Dimmed UI elements that don't interfere with map reading

---

## 2. User Workflows

### 2.1 Onboarding Flow

```
┌────────────────────────────────────────────────────────────┐
│                     Welcome Screen                         │
│                                                            │
│   [OverlayApp Logo]                                        │
│                                                            │
│   Professional PDF Overlay Management                     │
│   for Surveyors & GIS Professionals                       │
│                                                            │
│   ┌──────────────────┐  ┌──────────────────┐             │
│   │  Sign Up Free    │  │  Sign In         │             │
│   └──────────────────┘  └──────────────────┘             │
│                                                            │
│   ✓ 14-day free trial  ✓ No credit card    ✓ 500MB free │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│                  Account Creation (Step 1/4)               │
│                                                            │
│   Create Your Account                                     │
│   ┌────────────────────────────────────────────┐         │
│   │ Email                                      │         │
│   └────────────────────────────────────────────┘         │
│   ┌────────────────────────────────────────────┐         │
│   │ Password                                   │         │
│   └────────────────────────────────────────────┘         │
│   ┌────────────────────────────────────────────┐         │
│   │ Company Name (Optional)                    │         │
│   └────────────────────────────────────────────┘         │
│                                                            │
│   [○ ○ ○ ○]  Progress indicators                         │
│   [Skip Tour]                    [Continue →]             │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│                  Role Selection (Step 2/4)                 │
│                                                            │
│   What's your primary use case?                           │
│                                                            │
│   ┌─────────────────┐  ┌─────────────────┐               │
│   │    📐           │  │    🗺️           │               │
│   │   Surveyor      │  │  GIS Analyst    │               │
│   │                 │  │                 │               │
│   └─────────────────┘  └─────────────────┘               │
│                                                            │
│   ┌─────────────────┐  ┌─────────────────┐               │
│   │    🏗️           │  │    👥           │               │
│   │  Field Worker   │  │  Team Manager   │               │
│   │                 │  │                 │               │
│   └─────────────────┘  └─────────────────┘               │
│                                                            │
│   [● ○ ○ ○]                                               │
│   [← Back]                       [Continue →]             │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│              Interactive Tutorial (Step 3/4)               │
│                                                            │
│   ┌────────────────────────────────────────┐             │
│   │                                        │             │
│   │     [Map Preview with Overlay]         │             │
│   │                                        │             │
│   │     👆 Drag & drop your first PDF      │             │
│   │                                        │             │
│   │     or click to upload                │             │
│   │                                        │             │
│   └────────────────────────────────────────┘             │
│                                                            │
│   💡 Tip: Upload site plans, survey maps, or              │
│   construction drawings in PDF format                     │
│                                                            │
│   [● ● ○ ○]                                               │
│   [← Back]                       [Try Sample →]           │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│              Quick Georeferencing Demo (Step 4/4)          │
│                                                            │
│   Georeference in 3 Easy Steps:                           │
│                                                            │
│   1️⃣ Upload PDF → 2️⃣ Pin 3 Points → 3️⃣ View Overlay      │
│                                                            │
│   [Interactive animation showing the process]             │
│                                                            │
│   ┌────────────────────────────────────────┐             │
│   │  Video: 45-second georeferencing demo  │             │
│   │  ▶️ [Play walkthrough]                  │             │
│   └────────────────────────────────────────┘             │
│                                                            │
│   [● ● ● ○]                                               │
│   [← Back]                       [Start Using App →]      │
└────────────────────────────────────────────────────────────┘
                           ↓
                  [Dashboard Home]
```

**Key Principles:**
- **Progressive disclosure**: Don't overwhelm with features
- **Skip option**: Power users can bypass tutorial
- **Contextual help**: Tooltips appear on first feature use
- **Sample data**: Pre-loaded example overlay for exploration

### 2.2 PDF Upload & Georeferencing Wizard

```
┌────────────────────────────────────────────────────────────┐
│  Upload PDF Overlay                              [✕ Close] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Step 1: Upload File                    [○ ● ○ ○ ○]       │
│  ───────────────────────────────────────────────────      │
│                                                            │
│  ┌────────────────────────────────────────────────┐       │
│  │                                                │       │
│  │        📄  Drag & Drop PDF Here                │       │
│  │                                                │       │
│  │        or click to browse files                │       │
│  │                                                │       │
│  │        Supported: PDF up to 50MB              │       │
│  │                                                │       │
│  └────────────────────────────────────────────────┘       │
│                                                            │
│  Recent uploads:                                          │
│  • site-plan-rev3.pdf  (2 days ago)  [Use this]          │
│  • boundary-survey.pdf (1 week ago)  [Use this]          │
│                                                            │
│  [Cancel]                              [Next: Preview →]  │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│  Upload PDF Overlay                              [✕ Close] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Step 2: Preview & Metadata             [○ ○ ● ○ ○]       │
│  ───────────────────────────────────────────────────      │
│                                                            │
│  ┌─────────────────────────┐  ┌──────────────────┐       │
│  │                         │  │ Overlay Name:    │       │
│  │   [PDF Thumbnail]       │  │ Site Plan Rev 3  │       │
│  │                         │  │                  │       │
│  │   Pages: 1              │  │ Description:     │       │
│  │   Size: 2.4 MB          │  │ [Optional...]    │       │
│  │   Format: PDF 1.7       │  │                  │       │
│  │                         │  │ Tags:            │       │
│  │                         │  │ #survey #site    │       │
│  └─────────────────────────┘  │                  │       │
│                                │ Folder:          │       │
│  📊 Processing: ████████░░ 80% │ ▼ Projects/2025  │       │
│  Extracting pages...           │                  │       │
│                                │ Visibility:      │       │
│                                │ ◉ Team  ○ Private│       │
│                                └──────────────────┘       │
│                                                            │
│  [← Back]                    [Next: Georeference →]       │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│  Georeference Overlay                            [✕ Close] │
├────────────────────────────────────────────────────────────┤
│  Step 3: Place Reference Points         [○ ○ ○ ● ○]       │
│  ───────────────────────────────────────────────────      │
│                                                            │
│  ┌──────────────────────┬──────────────────────┐         │
│  │  [PDF Preview]       │  [Map View]          │         │
│  │                      │                      │         │
│  │   📍 Point 1 (red)   │   📍 Point 1 (red)   │         │
│  │   📍 Point 2 (blue)  │   📍 Point 2 (blue)  │         │
│  │   📌 Point 3 (green) │   📍 Point 3 (green) │         │
│  │                      │                      │         │
│  │   [PDF content]      │   [Basemap]          │         │
│  │                      │                      │         │
│  └──────────────────────┴──────────────────────┘         │
│                                                            │
│  Instructions:                                            │
│  1. Click a recognizable point on the PDF (left)         │
│  2. Click the same location on the map (right)           │
│  3. Repeat for at least 3 points for accuracy            │
│                                                            │
│  Points placed: 2/3 minimum                               │
│  Estimated accuracy: --                                   │
│                                                            │
│  💡 Tip: Choose corners, intersections, or landmarks      │
│                                                            │
│  [← Back]  [Reset Points]      [Next: Review →]          │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│  Georeference Overlay                            [✕ Close] │
├────────────────────────────────────────────────────────────┤
│  Step 4: Review & Adjust                [○ ○ ○ ○ ●]       │
│  ───────────────────────────────────────────────────      │
│                                                            │
│  ┌────────────────────────────────────────────────┐       │
│  │                                                │       │
│  │       [Live Overlay Preview on Map]            │       │
│  │                                                │       │
│  │   📄 Transparency: [■■■■■■■■░░] 75%           │       │
│  │                                                │       │
│  │   Accuracy: ✓ Good (RMS error: 1.2m)          │       │
│  │                                                │       │
│  └────────────────────────────────────────────────┘       │
│                                                            │
│  Adjustments:                                             │
│  ┌──────────────┬──────────────┬──────────────┐          │
│  │ Rotation     │ Scale        │ Position     │          │
│  │ [+ 0.5° -]   │ [+ 100% -]   │ [↑↓←→]       │          │
│  └──────────────┴──────────────┴──────────────┘          │
│                                                            │
│  ☐ Fine-tune with manual adjustments                      │
│                                                            │
│  [← Back]                    [✓ Save Overlay →]           │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│  Success!                                        [✕ Close] │
├────────────────────────────────────────────────────────────┤
│  Step 5: Ready to Use                   [○ ○ ○ ○ ○]       │
│  ───────────────────────────────────────────────────      │
│                                                            │
│         ✓  Overlay saved successfully!                     │
│                                                            │
│  Your overlay "Site Plan Rev 3" is now available          │
│  on the map and ready to share with your team.            │
│                                                            │
│  Next steps:                                              │
│  • [View on Map]  - See your overlay in action           │
│  • [Share]        - Invite team members                   │
│  • [Export]       - Download georeferenced file           │
│  • [Upload Another] - Add more overlays                   │
│                                                            │
│  💡 Quick tip: Use the layer panel to toggle             │
│  visibility and adjust transparency.                      │
│                                                            │
│                                [Done]                      │
└────────────────────────────────────────────────────────────┘
```

**Wizard Features:**
- **Auto-save drafts**: Never lose progress
- **Smart suggestions**: AI-detected reference points
- **Validation**: Real-time accuracy feedback
- **Undo/redo**: Easy correction of mistakes
- **Keyboard shortcuts**: Power user efficiency

### 2.3 Map Interaction Patterns

**Desktop Interactions:**
```
┌────────────────────────────────────────────────────────────┐
│  OverlayApp                         👤 Profile  [Settings] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [📁 Layers]                          [Map View]          │
│   ├─ 📂 Projects                                          │
│   │   ├─ 🏗️ Site A                  ┌─────────────┐      │
│   │   │   ├─ ☑ Plan v3 (75%)        │             │      │
│   │   │   ├─ ☐ Survey               │   [MAP]     │      │
│   │   │   └─ ☐ Utilities            │             │      │
│   │   └─ 🏠 Site B                   │             │      │
│   └─ 📂 Archives                     └─────────────┘      │
│                                                            │
│  Base Maps:                          [Tools]              │
│  ◉ Satellite                         • 📏 Measure         │
│  ○ Street                            • 📍 Add Marker      │
│  ○ Topo                              • ✏️ Draw           │
│                                      • 📷 Screenshot      │
│  [+ Upload PDF]                                           │
└────────────────────────────────────────────────────────────┘

Mouse Interactions:
- Click + Drag       → Pan map
- Scroll wheel       → Zoom in/out
- Shift + Drag       → Rotate map (if enabled)
- Ctrl + Click       → Open context menu
- Double-click       → Zoom to location
- Right-click overlay → Overlay options menu

Keyboard Shortcuts:
- Space + Drag       → Pan (alternative)
- +/- keys           → Zoom
- [ / ]              → Decrease/increase overlay opacity
- 1-9                → Toggle layer 1-9
- Ctrl+Z/Y           → Undo/redo
- M                  → Toggle measure tool
- Esc                → Cancel current action
```

**Mobile Interactions:**
```
┌──────────────────────┐
│ ☰  OverlayApp    ⚙️  │
├──────────────────────┤
│                      │
│                      │
│     [MAP VIEW]       │
│                      │
│       📍             │
│                      │
│                      │
├──────────────────────┤
│  [🗺️] [📂] [+] [•••] │
└──────────────────────┘

Touch Gestures:
- Single tap         → Select feature
- Double tap         → Zoom in
- Two-finger tap     → Zoom out
- Pinch              → Zoom in/out
- Two-finger drag    → Pan
- Two-finger rotate  → Rotate map
- Long press         → Open context menu
- Swipe up (bottom)  → Open layer panel
- Swipe down (top)   → Close panels

Bottom Navigation:
🗺️  Map - Main map view
📂  Layers - Overlay management
+   Add - Quick upload
•••  More - Settings/profile
```

### 2.4 Mobile vs Desktop UX Differences

**Desktop (1024px+):**
- Persistent left sidebar for layers
- Multi-panel layouts
- Hover tooltips and interactions
- Keyboard shortcuts prominent
- Drag-and-drop file uploads
- Split-screen georeferencing
- Advanced editing tools visible

**Tablet (768px-1023px):**
- Collapsible left sidebar
- Tablet-optimized touch targets
- Simplified toolbars
- Modal-based workflows
- Touch-friendly controls
- Hybrid mouse/touch support

**Mobile (< 768px):**
- Bottom sheet navigation
- Full-screen map focus
- Swipe gestures primary
- Essential tools only
- Step-by-step wizards
- Camera integration for field use
- Offline-first design

### 2.5 Offline Mode Indicators

```
┌────────────────────────────────────────────────────────────┐
│  Online Mode (Default)                                     │
│  ────────────────────────────────────────────────────────  │
│  [🟢 Connected]  Last synced: 2 minutes ago                │
│                                                            │
│  • Full feature access                                    │
│  • Real-time collaboration                                │
│  • Auto-save to cloud                                     │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Offline Mode (Limited Connectivity)                       │
│  ────────────────────────────────────────────────────────  │
│  [🟡 Working Offline]  Changes saved locally               │
│                                                            │
│  • Cached overlays available                              │
│  • Offline basemap active                                 │
│  • Will sync when connection restored                     │
│                                                            │
│  [View 3 pending changes]                                 │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  No Connection (Offline)                                   │
│  ────────────────────────────────────────────────────────  │
│  [🔴 No Internet]  Last synced: 2 hours ago                │
│                                                            │
│  • Viewing cached content only                            │
│  • New uploads queued for sync                            │
│  • Limited feature access                                 │
│                                                            │
│  [Retry Connection]  [View Offline Help]                  │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Syncing...                                                │
│  ────────────────────────────────────────────────────────  │
│  [⟳ Syncing]  Uploading 2 overlays, downloading 1 update  │
│                                                            │
│  Progress: ██████░░░░ 60% (2.4 MB / 4.0 MB)               │
│                                                            │
│  • site-plan-v4.pdf ✓ Uploaded                            │
│  • survey-2025.pdf ⟳ Uploading...                         │
│  • team-update.pdf ⬇ Downloading...                       │
└────────────────────────────────────────────────────────────┘
```

**Offline Capabilities:**
- Cached overlays (last 10 viewed)
- Offline basemap tiles
- Local editing with sync queue
- Conflict resolution on reconnect
- Background sync when available

---

## 3. Key Screens (Wireframes)

### 3.1 Dashboard/Home

```
┌──────────────────────────────────────────────────────────────────────┐
│  OverlayApp           🔍 Search overlays...        👤 User  🔔 [3]  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Welcome back, Michael! 👋                        [🟢 All systems ✓] │
│                                                                      │
│  ┌─────────────────┬─────────────────┬─────────────────┐           │
│  │ Total Overlays  │ Storage Used    │ Team Members    │           │
│  │      127        │   3.2 GB / 10GB │       12        │           │
│  │  ↗ +12 this mo  │   [████░░░] 32% │  ↗ +2 this mo   │           │
│  └─────────────────┴─────────────────┴─────────────────┘           │
│                                                                      │
│  Quick Actions:                                                     │
│  ┌───────────────┬───────────────┬───────────────┬──────────────┐  │
│  │ [+ Upload]    │ [🗺️ New Map]  │ [👥 Invite]    │ [📊 Reports] │  │
│  │   PDF         │   Project     │   Team        │   Analytics  │  │
│  └───────────────┴───────────────┴───────────────┴──────────────┘  │
│                                                                      │
│  Recent Overlays                           [View All →]             │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  📄 Site Plan Rev 3                      🟢 Published   │        │
│  │  Updated 2 hours ago • Projects/Site A                 │        │
│  │  [👁️ View] [✏️ Edit] [⋯ More]                           │        │
│  ├────────────────────────────────────────────────────────┤        │
│  │  📄 Boundary Survey - Lot 42             🟡 Draft       │        │
│  │  Updated yesterday • Projects/Subdivisions             │        │
│  │  [👁️ View] [✏️ Edit] [⋯ More]                           │        │
│  ├────────────────────────────────────────────────────────┤        │
│  │  📄 Utility As-Built                     🟢 Published   │        │
│  │  Updated 3 days ago • Archives/2024                    │        │
│  │  [👁️ View] [✏️ Edit] [⋯ More]                           │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                      │
│  Activity Feed                             [See All Activity →]     │
│  • Sarah updated "Highway Expansion Plan" - 30 min ago              │
│  • Mike shared "Zoning Map 2025" with you - 1 hour ago              │
│  • System: Weekly backup completed - 2 hours ago                    │
│  • Team: New member John joined - Yesterday                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 PDF Overlay List/Gallery

```
┌──────────────────────────────────────────────────────────────────────┐
│  Overlays                                    👤 User  🔔 [3]        │
├──────────────────────────────────────────────────────────────────────┤
│  [← Back]  All Overlays (127)                                       │
│                                                                      │
│  🔍 [Search by name, tag, or project...]                            │
│                                                                      │
│  Filters: [📁 All Projects ▼] [🏷️ All Tags ▼] [📅 Date ▼] [Clear] │
│  View: [◫ Grid] [≡ List]   Sort: [📅 Recent ▼]                     │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Grid View (3 columns desktop, 1 mobile)                    │   │
│  ├─────────────────┬─────────────────┬─────────────────────────┤   │
│  │ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────────────────┐ │   │
│  │ │  [Thumb]    │ │ │  [Thumb]    │ │ │      [Thumb]        │ │   │
│  │ │             │ │ │             │ │ │                     │ │   │
│  │ └─────────────┘ │ └─────────────┘ │ └─────────────────────┘ │   │
│  │ Site Plan v3    │ Boundary Survey │ Utility As-Built        │   │
│  │ Updated 2h ago  │ Updated 1d ago  │ Updated 3d ago          │   │
│  │ 🟢 Published    │ 🟡 Draft        │ 🟢 Published            │   │
│  │ #survey #site   │ #boundary #lot  │ #utilities #asbuilt     │   │
│  │ [View] [Edit]   │ [View] [Edit]   │ [View] [Edit]           │   │
│  ├─────────────────┼─────────────────┼─────────────────────────┤   │
│  │ [More overlays in 3-column grid layout...]                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  [Load More] or [Infinite Scroll]                                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**List View Alternative:**
```
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  List View                                                 │   │
│  ├────────────────────────────────────────────────────────────┤   │
│  │  ☐ [Thumb] Site Plan Rev 3                 🟢 Published    │   │
│  │     Projects/Site A • Updated 2 hours ago                  │   │
│  │     2.4 MB • 1 page • #survey #site                        │   │
│  │     [👁️ View] [✏️ Edit] [⤓ Download] [⋯ More]              │   │
│  ├────────────────────────────────────────────────────────────┤   │
│  │  ☐ [Thumb] Boundary Survey - Lot 42        🟡 Draft        │   │
│  │     Projects/Subdivisions • Updated yesterday              │   │
│  │     1.8 MB • 2 pages • #boundary #lot                      │   │
│  │     [👁️ View] [✏️ Edit] [⤓ Download] [⋯ More]              │   │
│  └────────────────────────────────────────────────────────────┘   │
```

### 3.3 Map Viewer with Overlays

```
┌──────────────────────────────────────────────────────────────────────┐
│  [☰] OverlayApp - Map View            🔍 Search      👤  🔔  ⚙️     │
├──────────────────────────────────────────────────────────────────────┤
│ [Left Panel]           │        [Main Map]                 │ [Right] │
│                        │                                   │         │
│ 📂 Layers (5/8)       │                                   │ Tools   │
│ ├─ ☑ Site Plan v3     │         ┌───────────────┐         │ ┌─────┐ │
│ │  Opacity: ██░ 75%  │         │               │         │ │  📏 │ │
│ │  [⚙️] [👁️] [🗑️]      │         │     MAP       │         │ │  📍 │ │
│ │                    │         │   CONTENT     │         │ │  ✏️ │ │
│ ├─ ☐ Survey Map      │         │               │         │ │  📷 │ │
│ │  [⚙️] [👁️] [🗑️]      │         │  [Overlays]   │         │ │  📐 │ │
│ │                    │         │   visible     │         │ │  ⤢  │ │
│ ├─ ☐ Utilities       │         │   on map]     │         │ └─────┘ │
│ │  [⚙️] [👁️] [🗑️]      │         │               │         │         │
│ │                    │         └───────────────┘         │ Legend  │
│ └─ 📂 More (3)       │                                   │ ┌─────┐ │
│                        │  [Zoom] [+][-]                   │ │ ─── │ │
│ Base Maps:             │  [My Location 📍]                 │ │ ─── │ │
│ ◉ Satellite            │  [Fullscreen ⤢]                  │ │ ─── │ │
│ ○ Streets              │  [Compass 🧭]                     │ └─────┘ │
│ ○ Topo                 │                                   │         │
│                        │  Status: [🟢 Connected]           │ [↑]    │
│ [+ Upload PDF]         │  Scale: 1:1000                    │         │
│                        │  Coords: 34.05° N, 118.24° W      │ [↓]    │
└────────────────────────────────────────────────────────────────────────┘
```

**Mobile Map View:**
```
┌──────────────────────┐
│ ☰  Map        🔍  ⚙️ │
├──────────────────────┤
│                      │
│                      │
│                      │
│      [MAP VIEW]      │
│                      │
│       📍 You         │
│                      │
│                      │
│                      │
│  [+]  [My Loc 📍]    │
│  [-]  [⤢ Full]       │
├──────────────────────┤
│  Site Plan v3   75%  │
│  [☑] [━━━━━░░] [⚙️]  │
└──────────────────────┘
[Swipe up for layers]
```

### 3.4 PDF Georeferencing Interface

```
┌──────────────────────────────────────────────────────────────────────┐
│  Georeference: Site Plan Rev 3.pdf                   [✕ Close]      │
├──────────────────────────────────────────────────────────────────────┤
│  Progress: [● ● ● ● ○] Step 4 of 5: Place Control Points            │
│                                                                      │
│  ┌────────────────────────────────┬────────────────────────────────┐│
│  │  PDF View                      │  Map View                      ││
│  │  ┌──────────────────────────┐  │  ┌──────────────────────────┐ ││
│  │  │                          │  │  │                          │ ││
│  │  │  [PDF Content]           │  │  │  [Basemap]               │ ││
│  │  │                          │  │  │                          │ ││
│  │  │   📍1 (NW corner)        │  │  │   📍1 (matched)          │ ││
│  │  │                          │  │  │                          │ ││
│  │  │          📍2 (center)    │  │  │          📍2 (matched)    │ ││
│  │  │                          │  │  │                          │ ││
│  │  │               📍3 (SE)   │  │  │               📍3 (...)   │ ││
│  │  │                          │  │  │                          │ ││
│  │  └──────────────────────────┘  │  └──────────────────────────┘ ││
│  │  [Fit] [Zoom +] [Zoom -]      │  [Fit] [Zoom +] [Zoom -]      ││
│  └────────────────────────────────┴────────────────────────────────┘│
│                                                                      │
│  Control Points:                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ #  │ PDF (X, Y)      │ Map (Lat, Lon)        │ Error  │ [X]  │  │
│  ├────┼─────────────────┼───────────────────────┼────────┼──────┤  │
│  │ 1  │ (120, 85)       │ 34.0522°N, 118.2437°W │ 0.8m   │ [X]  │  │
│  │ 2  │ (650, 420)      │ 34.0518°N, 118.2429°W │ 1.1m   │ [X]  │  │
│  │ 3  │ (980, 720)      │ Placing...            │ --     │ [X]  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Instructions:                                                      │
│  💡 Click a point on the PDF (left), then click the same location   │
│     on the map (right). Repeat for at least 3 points.               │
│                                                                      │
│  Accuracy: ⚠️ Needs improvement (RMS error: 2.4m)                   │
│  Status: 2 points placed • Need 1 more for minimum accuracy         │
│                                                                      │
│  [← Back] [Reset All Points] [Skip for Now]    [Next: Review →]    │
└──────────────────────────────────────────────────────────────────────┘
```

**Smart Assist Mode (AI-powered):**
```
│  🤖 Smart Assist: [ON] │ OFF                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                      │
│  AI Suggestions:                                                    │
│  ✓ Detected 5 potential control points:                             │
│    • Building corner (NW) - 95% confidence                          │
│    • Road intersection (Center) - 92% confidence                    │
│    • Property corner (SE) - 88% confidence                          │
│    [Accept All] [Review Each]                                       │
│                                                                      │
│  Coordinate System: Auto-detected NAD83 / UTM Zone 11N              │
│  [Change CRS]                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.5 Settings and Account Management

```
┌──────────────────────────────────────────────────────────────────────┐
│  Settings                                          [✕ Close]         │
├──────────────────────────────────────────────────────────────────────┤
│  [← Back]                                                            │
│                                                                      │
│  ┌────────────────┐  ┌─────────────────────────────────────────┐   │
│  │  Sidebar       │  │  Account                                │   │
│  │                │  │  ─────────────────────────────────────  │   │
│  │ • Account      │  │                                         │   │
│  │ • Profile      │  │  Profile Information                    │   │
│  │ • Preferences  │  │  ┌────────────────────────────────────┐│   │
│  │ • Security     │  │  │ Name:     Michael Johnson          ││   │
│  │ • Team         │  │  │ Email:    michael@company.com      ││   │
│  │ • Billing      │  │  │ Company:  Acme Surveying Inc.      ││   │
│  │ • Usage        │  │  │ Role:     Administrator            ││   │
│  │ • Integrations │  │  │ Joined:   Jan 15, 2024             ││   │
│  │ • API          │  │  └────────────────────────────────────┘│   │
│  │ • Help         │  │  [Edit Profile]                         │   │
│  │ • About        │  │                                         │   │
│  │                │  │  Avatar                                 │   │
│  │                │  │  ┌─────┐                               │   │
│  │ [Logout]       │  │  │ 👤  │  [Change Avatar]               │   │
│  │                │  │  └─────┘  [Remove]                     │   │
│  │                │  │                                         │   │
│  │                │  │  Email Notifications                    │   │
│  │                │  │  ☑ New overlays shared with me         │   │
│  │                │  │  ☑ Team member activities              │   │
│  │                │  │  ☑ Weekly usage reports                │   │
│  │                │  │  ☐ Marketing updates                   │   │
│  │                │  │                                         │   │
│  │                │  │  Danger Zone                            │   │
│  │                │  │  [Export All Data]                      │   │
│  │                │  │  [Delete Account]                       │   │
│  └────────────────┘  └─────────────────────────────────────────┘   │
│                                                                      │
│                                [Save Changes]                        │
└──────────────────────────────────────────────────────────────────────┘
```

**Preferences Tab:**
```
│  Preferences                                                        │
│  ─────────────────────────────────────────────────────────────     │
│                                                                      │
│  Appearance                                                         │
│  Theme: ◉ Auto (System)  ○ Light  ○ Dark                           │
│  Accent Color: [🔵 Blue ▼]                                          │
│                                                                      │
│  Map Defaults                                                       │
│  Default Base Map: [Satellite ▼]                                    │
│  Default Zoom Level: [12 ▼]                                         │
│  Show Scale Bar: [ON]                                               │
│  Show Compass: [ON]                                                 │
│                                                                      │
│  Uploads                                                            │
│  Default Upload Folder: [Projects/Current ▼]                        │
│  Auto-Georeference: ☑ Enable AI-assisted georeferencing             │
│  Default Overlay Opacity: [■■■■■■■░░░] 75%                         │
│                                                                      │
│  Units                                                              │
│  Distance: ◉ Meters  ○ Feet                                         │
│  Coordinates: [Decimal Degrees ▼]                                   │
│                                                                      │
│  Offline Mode                                                       │
│  ☑ Enable offline mode                                              │
│  Cache Size Limit: [2 GB ▼]                                         │
│  Cache Last Viewed: [10 overlays ▼]                                 │
│  [Clear Cache Now]                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.6 Team Management

```
┌──────────────────────────────────────────────────────────────────────┐
│  Team Management                                   [✕ Close]         │
├──────────────────────────────────────────────────────────────────────┤
│  [← Back to Settings]                                                │
│                                                                      │
│  Team: Acme Surveying Inc.                    [⚙️ Team Settings]    │
│  Members: 12 / 25 (Pro Plan)                                        │
│                                                                      │
│  [+ Invite Members]                                                  │
│                                                                      │
│  🔍 [Search members...]                                              │
│  Filter: [All Roles ▼]  [All Status ▼]                              │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ Name              Role          Status    Last Active    [⋯]   ││
│  ├────────────────────────────────────────────────────────────────┤│
│  │ 👤 You            Admin         🟢 Active  2 min ago     [⋯]   ││
│  │ Michael Johnson                                                ││
│  │ michael@company.com                                            ││
│  ├────────────────────────────────────────────────────────────────┤│
│  │ 👤 Sarah Chen     Admin         🟢 Active  15 min ago    [⋯]   ││
│  │ sarah.chen@company.com                                         ││
│  ├────────────────────────────────────────────────────────────────┤│
│  │ 👤 John Smith     Editor        🟢 Active  1 hour ago    [⋯]   ││
│  │ john.smith@company.com                                         ││
│  ├────────────────────────────────────────────────────────────────┤│
│  │ 👤 Emily Davis    Viewer        🟡 Away    Yesterday     [⋯]   ││
│  │ emily.davis@company.com                                        ││
│  ├────────────────────────────────────────────────────────────────┤│
│  │ 📧 Tom Wilson     Editor        ⏳ Invited  Pending      [⋯]   ││
│  │ tom.wilson@company.com          [Resend Invite]                ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  Roles & Permissions:                                               │
│  • Admin: Full access, billing, team management                     │
│  • Editor: Create, edit, delete overlays                            │
│  • Viewer: View and download only                                   │
│  [Manage Custom Roles →]                                            │
└──────────────────────────────────────────────────────────────────────┘
```

**Invite Modal:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  Invite Team Members                               [✕ Close]         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Email addresses (one per line):                                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ sarah@example.com                                              │ │
│  │ john@example.com                                               │ │
│  │ emily@example.com                                              │ │
│  │                                                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  Role for new members: [Editor ▼]                                   │
│                                                                      │
│  Personal message (optional):                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Join our team on OverlayApp! We're using it for the             │ │
│  │ Highland Park project.                                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  [Cancel]                                      [Send 3 Invitations] │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.7 Billing and Usage

```
┌──────────────────────────────────────────────────────────────────────┐
│  Billing & Usage                                   [✕ Close]         │
├──────────────────────────────────────────────────────────────────────┤
│  [← Back to Settings]                                                │
│                                                                      │
│  Current Plan: Professional                      [Upgrade Plan]     │
│  Billing Cycle: Monthly ($49/month)              Next: Nov 1, 2025  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Usage This Month (Oct 2025)                               │   │
│  │                                                             │   │
│  │  Storage:        [████████░░] 3.2 GB / 10 GB (32%)         │   │
│  │  Team Members:   [████░░░░░░] 12 / 25 (48%)                │   │
│  │  API Calls:      [██░░░░░░░░] 1,247 / 10,000 (12%)         │   │
│  │  Map Loads:      [█████░░░░░] 5,423 / Unlimited ✓          │   │
│  │                                                             │   │
│  │  Estimated Cost: $49.00                                     │   │
│  │  (No overage charges this period)                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Payment Method                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  💳 Visa ending in 4242                                    │    │
│  │  Expires: 12/2026                                           │    │
│  │  [Update Card]  [Add Payment Method]                       │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Billing History                                 [Download Invoice] │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Date        Description          Amount    Status  [↓]    │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │  Oct 1, 2025  Pro Plan - Monthly  $49.00   ✓ Paid  [↓]    │    │
│  │  Sep 1, 2025  Pro Plan - Monthly  $49.00   ✓ Paid  [↓]    │    │
│  │  Aug 1, 2025  Pro Plan - Monthly  $49.00   ✓ Paid  [↓]    │    │
│  │  Jul 1, 2025  Upgrade to Pro      $49.00   ✓ Paid  [↓]    │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Plan Comparison                                [View All Plans →]  │
│  ┌──────────┬──────────┬──────────┬──────────┐                     │
│  │ Free     │ Starter  │ Pro ✓    │ Enterprise│                     │
│  │ $0/mo    │ $19/mo   │ $49/mo   │ Custom   │                     │
│  ├──────────┼──────────┼──────────┼──────────┤                     │
│  │ 500 MB   │ 5 GB     │ 10 GB    │ Custom   │                     │
│  │ 3 users  │ 10 users │ 25 users │ Unlimited│                     │
│  │ 1K API   │ 5K API   │ 10K API  │ Unlimited│                     │
│  └──────────┴──────────┴──────────┴──────────┘                     │
│                                                                      │
│  [Change Plan]  [Cancel Subscription]  [Contact Sales]              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. Accessibility Standards

### 4.1 WCAG 2.1 AA Compliance

**Perceivable:**
- All images have descriptive alt text
- Color contrast ratio minimum 4.5:1 for normal text
- Color contrast ratio minimum 3:1 for large text (18pt+)
- No information conveyed by color alone
- Captions for video tutorials
- Text alternatives for map overlays

**Operable:**
- All functionality available via keyboard
- No keyboard traps
- Skip navigation links
- Focus indicators clearly visible
- No content that flashes more than 3 times per second
- Generous time limits with warnings

**Understandable:**
- Clear, consistent navigation
- Predictable behavior
- Form validation with clear error messages
- Instructions provided for complex tasks
- Labels and instructions for all inputs

**Robust:**
- Valid HTML5 semantic markup
- ARIA landmarks and labels
- Compatible with assistive technologies
- Graceful degradation

### 4.2 Keyboard Navigation

**Global Shortcuts:**
```
Tab              → Navigate forward through interactive elements
Shift + Tab      → Navigate backward
Enter/Space      → Activate buttons/links
Escape           → Close modals, cancel actions
Arrow Keys       → Navigate within lists, menus, maps

/ (forward slash) → Focus search bar
? (question mark) → Show keyboard shortcuts help
Ctrl/Cmd + K     → Command palette (quick actions)
```

**Map Navigation:**
```
Arrow Keys       → Pan map (when map focused)
+ / -            → Zoom in/out
[ / ]            → Decrease/increase overlay opacity
1-9              → Toggle layers 1-9
Home             → Reset map to default view
Spacebar         → Toggle pan mode
M                → Toggle measure tool
```

**Application Navigation:**
```
Ctrl/Cmd + S     → Save current work
Ctrl/Cmd + Z     → Undo
Ctrl/Cmd + Y     → Redo
Ctrl/Cmd + ,     → Open settings
Ctrl/Cmd + /     → Show keyboard shortcuts
```

**Focus Management:**
- Focus trap within modals
- Focus returns to trigger element on modal close
- Skip links for main content
- Visible focus indicators (2px solid ring)

### 4.3 Screen Reader Support

**ARIA Landmarks:**
```html
<header role="banner">
<nav role="navigation" aria-label="Main navigation">
<main role="main">
<aside role="complementary" aria-label="Layer panel">
<footer role="contentinfo">
```

**Live Regions:**
```html
<!-- Status updates -->
<div role="status" aria-live="polite" aria-atomic="true">
  Overlay uploaded successfully
</div>

<!-- Error messages -->
<div role="alert" aria-live="assertive">
  Upload failed. Please try again.
</div>

<!-- Progress indicators -->
<div role="progressbar" aria-valuenow="75" aria-valuemin="0"
     aria-valuemax="100" aria-label="Upload progress">
  75% complete
</div>
```

**Descriptive Labels:**
```html
<!-- Map controls -->
<button aria-label="Zoom in">+</button>
<button aria-label="Zoom out">-</button>
<button aria-label="Toggle layer: Site Plan Rev 3">
  <input type="checkbox" id="layer-1" checked />
  <label for="layer-1">Site Plan Rev 3</label>
</button>

<!-- Overlay cards -->
<article aria-labelledby="overlay-title-123">
  <h3 id="overlay-title-123">Site Plan Rev 3</h3>
  <p>Updated 2 hours ago</p>
</article>
```

**Screen Reader-Only Content:**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### 4.4 Color Contrast

**Text Contrast:**
```css
/* Normal text (4.5:1 minimum) */
--text-on-light: #1a1a1a;      /* 15.3:1 on white */
--text-secondary-light: #4a4a4a; /* 9.7:1 on white */

/* Large text (3:1 minimum) */
--heading-on-light: #2d2d2d;    /* 12.6:1 on white */

/* Dark mode */
--text-on-dark: #f5f5f5;        /* 14.8:1 on #0a0a0a */
--text-secondary-dark: #b8b8b8; /* 8.2:1 on #0a0a0a */

/* Interactive elements */
--link-color: #2563eb;          /* 5.9:1 on white */
--link-hover: #1d4ed8;          /* 7.3:1 on white */
--button-primary-bg: #3b82f6;   /* 4.6:1 text contrast */
--button-primary-hover: #2563eb; /* 5.9:1 text contrast */
```

**UI Component Contrast:**
```css
/* Borders (3:1 minimum against adjacent colors) */
--border-light: #d4d4d8;        /* 3.1:1 on white */
--border-dark: #3f3f46;         /* 3.2:1 on #0a0a0a */

/* Focus indicators (3:1 minimum) */
--focus-ring: #3b82f6;          /* 4.6:1 on white */
--focus-ring-dark: #60a5fa;     /* 5.2:1 on #0a0a0a */
```

**Map-Specific Contrast:**
- Overlay controls: High contrast background scrim
- Georeferencing markers: Bold, high-contrast colors
- Status indicators: Color + icon + text label
- Legend: Minimum 4.5:1 contrast for all text

### 4.5 Mobile Touch Targets

**Minimum Touch Target Size:**
```css
/* WCAG AAA: 44x44px minimum */
.button, .link, .input, .checkbox, .radio {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 16px;
}

/* Small icons with extended tap area */
.icon-button {
  width: 24px;
  height: 24px;
  padding: 10px; /* Total: 44x44px */
}
```

**Touch Target Spacing:**
```css
/* Minimum 8px spacing between touch targets */
.button-group button {
  margin: 0 4px; /* 8px between buttons */
}

.list-item {
  padding: 12px 16px; /* Adequate spacing */
  margin-bottom: 8px;
}
```

**Mobile-Specific Considerations:**
- Bottom navigation: 56px height (easy thumb reach)
- Primary actions: Bottom-right corner (right-handed default)
- Gesture hints: Visual cues for swipe, pinch actions
- Large form inputs: Minimum 48px height
- Adequate padding around map controls

---

## 5. Performance UX

### 5.1 Loading States and Skeletons

**Page Load Skeleton:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  OverlayApp                                        ░░░ ░░ ░░░ ░      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ░░░░░░░░░░░░░░░░ ░░                                                │
│                                                                      │
│  ┌─────────────────┬─────────────────┬─────────────────┐           │
│  │ ░░░░░░░░░░░░    │ ░░░░░░░░░░░░    │ ░░░░░░░░░░░░    │           │
│  │   ░░░           │   ░░░           │   ░░░           │           │
│  │   ░░░░░░ ░░░░░  │   ░░░░░░ ░░░░░  │   ░░░░░░ ░░░░░  │           │
│  └─────────────────┴─────────────────┴─────────────────┘           │
│                                                                      │
│  ░░░░░░ ░░░░░░░░                                                    │
│  ┌────────────────────────────────────────────────────────┐        │
│  │  ░░░░ ░░░░ ░░░░ ░░░                   ░░░ ░░░░░░░░     │        │
│  │  ░░░░░░ ░ ░░░░░ ░░░ • ░░░░░░░░/░░░░ ░                 │        │
│  │  ░░░░░░ ░░░░░ ░░░░░                                    │        │
│  ├────────────────────────────────────────────────────────┤        │
│  │  [Shimmer animation on gray rectangles]                │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Skeleton CSS:**
```css
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Dark mode skeletons */
html[data-theme="dark"] .skeleton {
  background: linear-gradient(
    90deg,
    #2a2a2a 25%,
    #3a3a3a 50%,
    #2a2a2a 75%
  );
}
```

**Component-Specific Skeletons:**
```
Map Loading:
┌────────────────────────────────┐
│                                │
│    [Gray placeholder map]      │
│                                │
│    ⟳ Loading map tiles...      │
│       45% complete              │
│                                │
└────────────────────────────────┘

Overlay Card Loading:
┌─────────────────┐
│ ░░░░░░░░░░░░░   │  [Thumbnail skeleton]
│ ░░░░░░░░        │  [Title skeleton]
│ ░░░░ ░░░░░░     │  [Metadata skeleton]
│ ░░░░ ░░░░       │  [Button skeletons]
└─────────────────┘
```

### 5.2 Progress Indicators for Uploads

**Upload Progress Modal:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  Uploading Files (2 of 3 complete)                    [✕ Cancel]     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Overall Progress: [████████████████░░░░] 67%                       │
│  Time remaining: ~45 seconds                                        │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ ✓ site-plan-v3.pdf                             2.4 MB  [100%] ││
│  │   Uploaded 5 seconds ago                                       ││
│  ├────────────────────────────────────────────────────────────────┤│
│  │ ✓ boundary-survey.pdf                          1.8 MB  [100%] ││
│  │   Uploaded 3 seconds ago                                       ││
│  ├────────────────────────────────────────────────────────────────┤│
│  │ ⟳ utility-asbuilt.pdf                          3.2 MB  [45%]  ││
│  │   [█████████░░░░░░░░░░░]  1.4 MB / 3.2 MB                      ││
│  │   Upload speed: 380 KB/s                                       ││
│  │   [Pause] [Cancel This File]                                   ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  [Cancel All]                                    [Continue in BG]   │
└──────────────────────────────────────────────────────────────────────┘
```

**Mini Upload Indicator (background):**
```
┌─────────────────────────────────────┐
│  ⟳ Uploading 1 file...    [67%]  ▼ │  [Expandable notification]
└─────────────────────────────────────┘
```

**Processing States:**
```
1. Uploading:     ⟳ [Progress bar] 45%
2. Processing:    🔄 Extracting pages...
3. Optimizing:    ✨ Optimizing for web...
4. Complete:      ✓ Ready to georeference
```

### 5.3 Optimistic UI Updates

**Overlay Toggle (Immediate Feedback):**
```typescript
// User clicks checkbox to show/hide overlay
function toggleOverlay(overlayId: string) {
  // 1. Immediately update UI (optimistic)
  dispatch({ type: 'TOGGLE_OVERLAY', id: overlayId });

  // 2. Show overlay on map instantly
  map.setLayerVisibility(overlayId, true);

  // 3. Persist to backend (async)
  saveOverlayState(overlayId)
    .catch(error => {
      // 4. Rollback on error
      dispatch({ type: 'TOGGLE_OVERLAY', id: overlayId });
      map.setLayerVisibility(overlayId, false);
      showErrorToast('Failed to update overlay');
    });
}
```

**Overlay Rename (Optimistic):**
```
Before submit:
┌────────────────────────────────┐
│ 📄 Site Plan Rev 3             │
│    [Edit] [Delete]             │
└────────────────────────────────┘

User types new name:
┌────────────────────────────────┐
│ 📝 [Site Plan Rev 4_______]    │
│    [✓ Save] [✕ Cancel]         │
└────────────────────────────────┘

Immediately after save (before server response):
┌────────────────────────────────┐
│ 📄 Site Plan Rev 4 ⟳          │  [Saving indicator]
│    [Edit] [Delete]             │
└────────────────────────────────┘

After server confirms:
┌────────────────────────────────┐
│ 📄 Site Plan Rev 4 ✓          │  [Success checkmark]
│    [Edit] [Delete]             │
└────────────────────────────────┘
```

**Principles:**
- Update UI immediately on user action
- Show subtle loading indicator during save
- Rollback gracefully on error
- Display success confirmation
- Queue offline actions for later sync

### 5.4 Error Handling and Recovery

**Error Toast/Notification:**
```
┌──────────────────────────────────────────────────┐
│  ⚠️ Upload Failed                          [✕]  │
│  site-plan-v4.pdf could not be uploaded.         │
│  Error: File size exceeds 50MB limit             │
│  [Try Again] [Choose Different File]             │
└──────────────────────────────────────────────────┘
```

**Inline Error Messages:**
```
Form Input Error:
┌────────────────────────────────────────┐
│ Email:                                 │
│ [invalid@email_________________]       │
│ ⚠️ Please enter a valid email address  │
└────────────────────────────────────────┘

Map Load Error:
┌────────────────────────────────┐
│                                │
│    ⚠️ Failed to Load Map       │
│                                │
│    We couldn't load the map    │
│    tiles. Check your internet  │
│    connection.                 │
│                                │
│    [Retry] [Use Offline Map]   │
│                                │
└────────────────────────────────┘
```

**Error Types and Recovery:**
```typescript
// Network errors
{
  type: 'NETWORK_ERROR',
  title: 'Connection Lost',
  message: 'Check your internet connection',
  actions: [
    { label: 'Retry', action: retry },
    { label: 'Work Offline', action: enableOfflineMode }
  ],
  severity: 'warning'
}

// Validation errors
{
  type: 'VALIDATION_ERROR',
  title: 'Invalid Input',
  message: 'Please correct the highlighted fields',
  actions: [
    { label: 'Review Form', action: focusFirstError }
  ],
  severity: 'error'
}

// Permission errors
{
  type: 'PERMISSION_ERROR',
  title: 'Access Denied',
  message: 'You don\'t have permission to delete this overlay',
  actions: [
    { label: 'Request Access', action: requestPermission }
  ],
  severity: 'error'
}

// System errors
{
  type: 'SYSTEM_ERROR',
  title: 'Something Went Wrong',
  message: 'An unexpected error occurred. Our team has been notified.',
  actions: [
    { label: 'Try Again', action: retry },
    { label: 'Report Issue', action: openSupportForm }
  ],
  severity: 'error'
}
```

**Global Error Boundary:**
```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                       😕 Oops! Something broke                       │
│                                                                      │
│  We're sorry, but something went wrong. Don't worry, your work       │
│  is saved and we've been notified of the issue.                      │
│                                                                      │
│  What you can do:                                                    │
│  • [Reload Page] - Most issues are fixed with a refresh             │
│  • [Go to Dashboard] - Start fresh from the home screen              │
│  • [Contact Support] - Get help from our team                        │
│                                                                      │
│  Technical details (for support):                                    │
│  Error ID: ERR-2025-1001-XYZ123                                      │
│  Timestamp: 2025-10-01 14:32:15 UTC                                  │
│  [Copy Error Details]                                                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.5 Offline Capabilities Messaging

**Offline Banner (Persistent):**
```
┌──────────────────────────────────────────────────────────────────────┐
│  [🔴 Working Offline] You're offline. Changes will sync when you     │
│  reconnect. Last synced: 2 hours ago  [Dismiss] [View Pending (3)]  │
└──────────────────────────────────────────────────────────────────────┘
```

**Reconnection Toast:**
```
┌──────────────────────────────────────────────────┐
│  ✓ Back Online                             [✕]  │
│  Syncing 3 pending changes...                    │
│  [View Details]                                  │
└──────────────────────────────────────────────────┘
```

**Offline Mode Settings:**
```
│  Offline Mode                                                        │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  Status: [🟢 Online] • Last sync: 2 minutes ago                      │
│                                                                      │
│  Offline Storage:                                                   │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Cached Overlays:     10 overlays  (242 MB)               │    │
│  │  Cached Map Tiles:    Region: Los Angeles (128 MB)        │    │
│  │  Pending Changes:     3 uploads queued (8.4 MB)           │    │
│  │                                                             │    │
│  │  Total Offline Storage: 378 MB / 2 GB                      │    │
│  │  [█████░░░░░░░░░░░░░] 18%                                  │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Download for Offline Use:                                          │
│  ☑ Download overlays when opened (last 10)                          │
│  ☑ Cache map tiles for current region                               │
│  ☐ Download all team overlays (requires 2.1 GB)                     │
│                                                                      │
│  [Clear Offline Cache] [Download Map Region]                        │
│                                                                      │
│  💡 Tip: Download important projects before going to the field!     │
└──────────────────────────────────────────────────────────────────────┘
```

**Feature Availability (Offline):**
```
┌────────────────────────────────────────┐
│  Feature               Online  Offline │
│  ─────────────────────────────────────│
│  View Overlays           ✓       ✓    │
│  Upload PDFs             ✓       ⏳   │  [Queued for sync]
│  Georeference            ✓       ✓    │
│  Edit Metadata           ✓       ⏳   │  [Queued for sync]
│  Share with Team         ✓       ✕    │
│  Download Exports        ✓       ✓*   │  [*Cached only]
│  Real-time Collaboration ✓       ✕    │
│  AI-Assisted Features    ✓       ✕    │
└────────────────────────────────────────┘
```

---

## 6. Component Specifications

### 6.1 Core Components

**Button:**
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

// Usage:
<Button variant="primary" size="md" icon={<UploadIcon />}>
  Upload PDF
</Button>
```

**Input:**
```typescript
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number' | 'search';
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}

// Usage:
<Input
  label="Email"
  type="email"
  placeholder="you@company.com"
  icon={<MailIcon />}
  error={errors.email}
  required
/>
```

**Card:**
```typescript
interface CardProps {
  variant: 'default' | 'outline' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  clickable?: boolean;
  hover?: boolean;
  children: ReactNode;
}

// Usage:
<Card variant="elevated" padding="md" clickable hover>
  <CardHeader>
    <CardTitle>Site Plan Rev 3</CardTitle>
    <CardDescription>Updated 2 hours ago</CardDescription>
  </CardHeader>
  <CardContent>
    [Preview thumbnail]
  </CardContent>
  <CardFooter>
    <Button>View</Button>
    <Button>Edit</Button>
  </CardFooter>
</Card>
```

### 6.2 Map-Specific Components

**MapContainer:**
```typescript
interface MapContainerProps {
  center: [number, number];
  zoom: number;
  baseMap: 'satellite' | 'streets' | 'topo';
  overlays: Overlay[];
  onOverlayClick?: (overlay: Overlay) => void;
  showControls?: boolean;
  enableRotation?: boolean;
  enableDrawing?: boolean;
}
```

**LayerPanel:**
```typescript
interface LayerPanelProps {
  layers: Layer[];
  onToggleVisibility: (layerId: string) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
  onReorder: (layers: Layer[]) => void;
  collapsible?: boolean;
}
```

**GeoreferenceControl:**
```typescript
interface GeoreferenceControlProps {
  pdfUrl: string;
  onComplete: (controlPoints: ControlPoint[]) => void;
  onCancel: () => void;
  assistMode?: 'ai' | 'manual';
}
```

---

## 7. Design Tokens Export

### 7.1 Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // ... rest of color palette
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
      },
      spacing: {
        // Extended from Tailwind defaults
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

---

## 8. Implementation Priorities

### Phase 1: Foundation (Weeks 1-2)
1. ✓ Design system tokens and Tailwind config
2. ✓ Core component library (Button, Input, Card, Modal)
3. ✓ Typography and color palette implementation
4. ✓ Dark mode toggle functionality
5. ✓ Responsive grid system

### Phase 2: Core Screens (Weeks 3-4)
1. ✓ Dashboard/Home screen
2. ✓ Overlay list/gallery
3. ✓ Basic map viewer
4. ✓ Upload modal and progress indicators
5. ✓ Settings screens

### Phase 3: Advanced Features (Weeks 5-6)
1. ✓ Georeferencing interface
2. ✓ Layer management panel
3. ✓ Team management UI
4. ✓ Billing and usage screens
5. ✓ Offline mode indicators

### Phase 4: Polish & Accessibility (Weeks 7-8)
1. ✓ Keyboard navigation refinement
2. ✓ Screen reader testing and fixes
3. ✓ Loading states and skeletons
4. ✓ Error handling UX
5. ✓ Performance optimizations

---

## 9. Design Resources

**Figma Files:** (To be created)
- `/designs/design-system.fig` - Core components
- `/designs/screens-desktop.fig` - Desktop layouts
- `/designs/screens-mobile.fig` - Mobile layouts
- `/designs/user-flows.fig` - Flow diagrams

**Asset Library:**
- `/assets/icons/` - Custom SVG icons
- `/assets/images/` - Illustrations, empty states
- `/assets/logos/` - Brand logos (various formats)

**Documentation:**
- `/docs/design-system.md` - Component usage guide
- `/docs/accessibility.md` - Accessibility checklist
- `/docs/brand-guidelines.md` - Logo usage, colors

---

## 10. Success Metrics

**User Experience KPIs:**
- Time to first overlay upload: < 2 minutes
- Georeferencing completion rate: > 85%
- Mobile usability score (Google Lighthouse): > 90
- Accessibility audit score (axe): 100% (no violations)
- Page load time (LCP): < 2.5 seconds
- User satisfaction (NPS): > 50

**Performance Targets:**
- First Contentful Paint (FCP): < 1.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1
- Largest Contentful Paint (LCP): < 2.5s

---

## Conclusion

This UX/UI strategy provides a comprehensive foundation for OverlayApp's modernization:

✓ **Modern Design System** - Shadcn/ui + Tailwind for flexibility
✓ **Accessible by Default** - WCAG 2.1 AA compliance built-in
✓ **Mobile-First** - Responsive, touch-friendly interfaces
✓ **Performance-Focused** - Optimistic UI, loading states, offline support
✓ **User-Centric Workflows** - Intuitive onboarding and georeferencing
✓ **Professional Aesthetics** - Clean, modern, technical appearance

**Next Steps:**
1. Review and approve design direction
2. Create Figma prototypes for key flows
3. Build component library in Storybook
4. User testing with target personas
5. Iterative refinement based on feedback

