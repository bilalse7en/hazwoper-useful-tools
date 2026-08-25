/**
 * @file component-registry.js
 * Comprehensive registry of interactive draggable course components,
 * dummy generators (with custom item counts), presets, and HTML/JSON converters.
 */

export const COMPONENT_CATEGORIES = {
  INTERACTIVE: 'Interactive & Cards',
  STRUCTURE: 'Structure & Layout',
  HIGHLIGHTS: 'Alerts & Highlights',
  DATA: 'Data, Steps & Metrics',
  MEDIA: 'Rich Content & Media',
};

export const COLOR_THEMES = [
  {
    id: 'amber',
    name: 'Amber Safety',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    accent: '#f59e0b',
  },
  {
    id: 'emerald',
    name: 'Emerald Compliance',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    accent: '#10b981',
  },
  {
    id: 'sky',
    name: 'Sky Technical',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    text: 'text-sky-400',
    accent: '#0ea5e9',
  },
  {
    id: 'rose',
    name: 'Hazard Danger',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    accent: '#f43f5e',
  },
  {
    id: 'purple',
    name: 'Executive Purple',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    accent: '#a855f7',
  },
  {
    id: 'slate',
    name: 'Obsidian Slate',
    bg: 'bg-slate-800/40',
    border: 'border-slate-700/60',
    text: 'text-slate-200',
    accent: '#64748b',
  },
];

export const AVAILABLE_ICONS = [
  'Shield',
  'AlertTriangle',
  'Flame',
  'Award',
  'CheckCircle',
  'Info',
  'Lightbulb',
  'Zap',
  'Wrench',
  'Clock',
  'FileCheck',
  'HelpCircle',
  'HardHat',
  'Eye',
  'BookOpen',
  'Activity',
  'Layers',
  'Target',
];

/**
 * Registry definitions for all 15 components
 */
export const COMPONENT_DEFINITIONS = [
  {
    type: 'accordion',
    name: 'Accordion',
    category: COMPONENT_CATEGORIES.STRUCTURE,
    icon: 'Layers',
    description: 'Expandable sections for complex topics, checklists, and FAQs',
    hasItemCountConfig: true,
    defaultCount: 3,
    minCount: 1,
    maxCount: 10,
    countLabel: 'How many accordion items do you want?',
  },
  {
    type: 'flip-cards',
    name: '3D Flip Cards Grid',
    category: COMPONENT_CATEGORIES.INTERACTIVE,
    icon: 'RotateCcw',
    description:
      'Interactive double-sided cards with front summary and back compliance details',
    hasItemCountConfig: true,
    defaultCount: 3,
    minCount: 1,
    maxCount: 6,
    countLabel: 'How many flip cards?',
  },
  {
    type: 'icon-cards',
    name: 'Icon Feature Cards',
    category: COMPONENT_CATEGORIES.INTERACTIVE,
    icon: 'Grid',
    description: 'Grid of cards with safety icons, headings, and key points',
    hasItemCountConfig: true,
    defaultCount: 3,
    minCount: 1,
    maxCount: 6,
    countLabel: 'How many cards in the grid?',
  },
  {
    type: 'image-card',
    name: 'Featured Media Card',
    category: COMPONENT_CATEGORIES.MEDIA,
    icon: 'Image',
    description:
      'Card with full-width or side image, badge, and descriptive body',
    hasItemCountConfig: false,
  },
  {
    type: 'callout',
    name: 'Callout Alert Banner',
    category: COMPONENT_CATEGORIES.HIGHLIGHTS,
    icon: 'AlertTriangle',
    description:
      'High-visibility caution, danger, info, or success safety notification box',
    hasItemCountConfig: false,
  },
  {
    type: 'tabs',
    name: 'Tabbed Panels',
    category: COMPONENT_CATEGORIES.STRUCTURE,
    icon: 'Bookmark',
    description: 'Multi-tabbed interactive view for segmented sub-topics',
    hasItemCountConfig: true,
    defaultCount: 3,
    minCount: 2,
    maxCount: 6,
    countLabel: 'How many tabs do you want?',
  },
  {
    type: 'stats',
    name: 'Key Metrics & Stats',
    category: COMPONENT_CATEGORIES.DATA,
    icon: 'Activity',
    description:
      'Large bold numbers with metrics, regulatory thresholds, and labels',
    hasItemCountConfig: true,
    defaultCount: 3,
    minCount: 2,
    maxCount: 4,
    countLabel: 'How many statistic cards?',
  },
  {
    type: 'steps',
    name: 'Process & Step Workflow',
    category: COMPONENT_CATEGORIES.DATA,
    icon: 'ListOrdered',
    description:
      'Numbered procedural timeline for standard operating safety procedures',
    hasItemCountConfig: true,
    defaultCount: 4,
    minCount: 2,
    maxCount: 8,
    countLabel: 'How many sequential steps?',
  },
  {
    type: 'comparison',
    name: 'Compliance vs Violation',
    category: COMPONENT_CATEGORIES.DATA,
    icon: 'Columns',
    description:
      'Side-by-side comparison table (e.g., Mandatory Practice vs Prohibited Action)',
    hasItemCountConfig: true,
    defaultCount: 3,
    minCount: 2,
    maxCount: 6,
    countLabel: 'How many comparison rows?',
  },
  {
    type: 'key-takeaways',
    name: 'Safety Takeaways Box',
    category: COMPONENT_CATEGORIES.HIGHLIGHTS,
    icon: 'Lightbulb',
    description:
      'Highlighted takeaway card with checkmark bullet points and summary',
    hasItemCountConfig: true,
    defaultCount: 4,
    minCount: 2,
    maxCount: 8,
    countLabel: 'How many takeaway bullet points?',
  },
  {
    type: 'quote',
    name: 'Regulation Citation / Quote',
    category: COMPONENT_CATEGORIES.HIGHLIGHTS,
    icon: 'Quote',
    description: 'Authoritative OSHA standard quote or executive mandate block',
    hasItemCountConfig: false,
  },
  {
    type: 'two-column',
    name: 'Two Column Content Split',
    category: COMPONENT_CATEGORIES.STRUCTURE,
    icon: 'Split',
    description: 'Split section with custom content on left and right sides',
    hasItemCountConfig: false,
  },
  {
    type: 'gallery',
    name: 'Visual Image Gallery',
    category: COMPONENT_CATEGORIES.MEDIA,
    icon: 'Images',
    description: 'Grid of clickable photos with lightbox zoom inspection',
    hasItemCountConfig: true,
    defaultCount: 3,
    minCount: 2,
    maxCount: 6,
    countLabel: 'How many gallery images?',
  },
  {
    type: 'rich-text',
    name: 'Formatted Rich Text Block',
    category: COMPONENT_CATEGORIES.MEDIA,
    icon: 'FileText',
    description:
      'Freeform text block with headings, bold text, lists, and links',
    hasItemCountConfig: false,
  },
  {
    type: 'puzzle-game',
    name: 'Safety Sequence Puzzle Game',
    category: COMPONENT_CATEGORIES.INTERACTIVE,
    icon: 'Sparkles',
    description:
      'Interactive gamified puzzle where learners arrange and solve critical safety steps in the correct compliant sequence',
    hasItemCountConfig: true,
    defaultCount: 4,
    minCount: 3,
    maxCount: 6,
    countLabel: 'How many puzzle sequence steps?',
  },
  {
    type: 'divider',
    name: 'Section Divider & Separator',
    category: COMPONENT_CATEGORIES.STRUCTURE,
    icon: 'Minus',
    description: 'Clean visual separator line with optional badge or icon',
    hasItemCountConfig: false,
  },
];

/**
 * Generate unique component ID
 */
export function generateComponentId(prefix = 'c') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Generate dummy props for any component based on type and desired item count
 */
export function generateComponentDefaults(type, options = {}) {
  const count = options.count || 3;
  const theme = options.theme || 'amber';
  const topicTitle = options.topicTitle || 'Safety Operating Protocol';

  switch (type) {
    case 'accordion': {
      const presets = [
        {
          title: '1. Regulatory Scope & OSHA Mandates',
          content:
            '<p>Under OSHA 29 CFR 1926.502, employers must implement certified engineering controls, administrative safeguards, and appropriate personal protective equipment before personnel are exposed to potential site hazards.</p>',
          badge: 'MANDATORY',
        },
        {
          title: '2. Pre-Shift Tactile & Visual Inspection Protocol',
          content:
            '<p>Inspect all stitching, webbing, connectors, and friction slides. Check for cuts, frays, chemical degradation, or heat damage. Any defective component must be immediately tagged and removed from service.</p>',
          badge: 'INSPECTION',
        },
        {
          title: '3. Equipment Donning, Fit & Adjustment Standards',
          content:
            '<p>Ensure chest strap is positioned across mid-chest (6 to 8 inches below throat) and leg straps pass the two-finger flat snugness test without restricting circulation or mobility.</p>',
          badge: 'PROCEDURE',
        },
        {
          title: '4. Fall Clearance Calculation & Deceleration Distance',
          content:
            '<p>Total fall clearance must factor in free fall distance (max 6 ft), deceleration distance (max 3.5 ft), harness stretch (approx 1 ft), and safety safety factor (minimum 2 ft margin).</p>',
          badge: 'CALCULATION',
        },
        {
          title: '5. Emergency Action & Suspension Trauma Relief',
          content:
            '<p>In the event of an arrested fall, initiate prompt rescue protocols within 6 minutes to avoid suspension trauma. Deploy trauma relief straps while awaiting designated rescue squad.</p>',
          badge: 'EMERGENCY',
        },
        {
          title: '6. Storage, Cleaning & Recertification Guidelines',
          content:
            '<p>Store gear in a cool, dry, ventilated area away from direct ultraviolet radiation, corrosive chemicals, and excessive moisture. Maintain manufacturer serial logs for annual third-party audits.</p>',
          badge: 'MAINTENANCE',
        },
      ];

      const items = Array.from({ length: Math.min(count, presets.length) }).map(
        (_, idx) =>
          presets[idx] || {
            title: `Section ${idx + 1}: Safety Standard Guidelines`,
            content: `<p>Detailed standard operating instructions and technical requirements for section ${idx + 1}. Verify full compliance with jobsite hazard assessments.</p>`,
            badge: `PART ${idx + 1}`,
          }
      );

      return {
        id: generateComponentId('acc'),
        type: 'accordion',
        props: {
          title: 'Comprehensive Safety Specifications & Procedures',
          description:
            'Click each section to view mandatory regulatory guidelines and execution steps.',
          theme,
          allowMultiple: false,
          items,
        },
      };
    }

    case 'flip-cards': {
      const presets = [
        {
          title: 'Regulatory Scope & Standard',
          category: 'OSHA Standard',
          icon: 'Shield',
          frontText:
            'Establishes mandatory OSHA compliance thresholds, engineering control hierarchies, and site hazard assessments.',
          backTitle: 'Mandatory Compliance Standard',
          backText:
            'All personnel and supervisors must verify standard operating procedures, execute required controls, and log pre-shift inspections before high-risk tasks.',
          theme: 'amber',
        },
        {
          title: 'Hazard Prevention & Inspection',
          category: 'Inspection Check',
          icon: 'AlertTriangle',
          frontText:
            'Hands-on tactile inspection of hardware, webbing, safety interlocks, and structural anchorage points.',
          backTitle: 'Tactile Inspection Checklist',
          backText:
            'Inspect for chemical degradation, broken stitches, deformation, and excessive wear. Immediately tag and destroy any defective safety component.',
          theme: 'emerald',
        },
        {
          title: 'Safe Operating Protocol',
          category: 'Safe Work Practice',
          icon: 'CheckCircle',
          frontText:
            'Sequential jobsite execution adhering strictly to the Hierarchy of Controls and personal safety safeguards.',
          backTitle: 'Emergency Action Rationale',
          backText:
            'When hazardous conditions shift or unexpected energy is detected, exercise unconditional Stop Work Authority and initiate evacuation.',
          theme: 'sky',
        },
        {
          title: 'Emergency Rescue & First Aid',
          category: 'Emergency Action',
          icon: 'Flame',
          frontText:
            'Immediate deployment of retrieval systems and suspension trauma relief protocols within 6 minutes.',
          backTitle: 'Post-Fall Rescue Procedure',
          backText:
            'Deploy designated rescue squad, stabilize worker in seated position (not horizontal immediately) to avoid re-flow cardiac shock, and summon EMS.',
          theme: 'rose',
        },
      ];

      const cards = Array.from({ length: Math.min(count, presets.length) }).map(
        (_, idx) =>
          presets[idx] || {
            title: `Safety Protocol #${idx + 1}`,
            category: 'Field Directive',
            icon: AVAILABLE_ICONS[idx % AVAILABLE_ICONS.length],
            frontText: `Overview of essential workplace protocols and protective methods for topic section ${idx + 1}.`,
            backTitle: `Standard Execution Guideline #${idx + 1}`,
            backText: `Verify all control barriers, equipment certifications, and secondary backup safeguards before commencing operations.`,
            theme: COLOR_THEMES[idx % COLOR_THEMES.length].id,
          }
      );

      return {
        id: generateComponentId('flip'),
        type: 'flip-cards',
        props: {
          title: 'Key Operational Protocols (3D Flip Cards)',
          subtitle:
            'Click or hover on any card to flip and inspect the detailed compliance rationale.',
          columns: count === 2 ? 2 : count === 4 ? 2 : 3,
          showIcons: true,
          cards,
        },
      };
    }

    case 'icon-cards': {
      const presets = [
        {
          title: 'Engineering Controls',
          icon: 'Shield',
          theme: 'amber',
          badge: 'Primary',
          description:
            'Isolate hazards at the source using guardrails, physical barriers, and positive mechanical locks.',
        },
        {
          title: 'Pre-Use Equipment Check',
          icon: 'CheckCircle',
          theme: 'emerald',
          badge: 'Mandatory',
          description:
            'Examine all safety hardware, webbing integrity, and locking latches prior to entering the work zone.',
        },
        {
          title: 'Stop Work Authority',
          icon: 'AlertTriangle',
          theme: 'rose',
          badge: 'Unconditional',
          description:
            'Every team member has the legal authority and duty to halt operations upon detecting unsafe conditions.',
        },
        {
          title: 'Certified Competent Person',
          icon: 'Award',
          theme: 'sky',
          badge: 'Authorized',
          description:
            'On-site qualified personnel must evaluate changing environmental conditions and authorize fall arrest systems.',
        },
      ];

      const cards = Array.from({ length: Math.min(count, presets.length) }).map(
        (_, idx) =>
          presets[idx] || {
            title: `Safety Pillar #${idx + 1}`,
            icon: AVAILABLE_ICONS[idx % AVAILABLE_ICONS.length],
            theme: COLOR_THEMES[idx % COLOR_THEMES.length].id,
            badge: `Pillar ${idx + 1}`,
            description: `Critical safety requirement and standard operating protocol for section ${idx + 1}.`,
          }
      );

      return {
        id: generateComponentId('cards'),
        type: 'icon-cards',
        props: {
          title: 'Core Safety Principles & Safeguards',
          columns: count === 2 ? 2 : count === 4 ? 2 : 3,
          cards,
        },
      };
    }

    case 'image-card': {
      return {
        id: generateComponentId('imgcard'),
        type: 'image-card',
        props: {
          title: 'Personal Fall Arrest System (PFAS) Anatomy',
          subtitle:
            'Certified ANSI Z359 & OSHA 29 CFR 1926.502 Approved Layout',
          badge: 'VISUAL AID',
          imageUrl:
            options.imageUrl ||
            'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=80',
          caption:
            'High-tensile polyester full body harness with forged dorsal D-ring and quick-connect leg straps.',
          content:
            '<p>A full body harness safely distributes arresting forces across the shoulders, thighs, and pelvic girdle, reducing peak impact to under <strong>1,800 lbs</strong> during fall arrest.</p>',
          layout: 'split', // 'split' | 'stacked'
          theme: 'amber',
        },
      };
    }

    case 'callout': {
      return {
        id: generateComponentId('callout'),
        type: 'callout',
        props: {
          variant: options.variant || 'warning', // 'warning' | 'danger' | 'info' | 'success'
          title: 'Mandatory Compliance Alert (OSHA Standard)',
          content:
            '<p>Never tie off back to the lanyard itself or attach fall arrest equipment to conduits, sprinkler pipes, or uncertified anchorages. Anchors must support at least <strong>5,000 lbs per employee</strong> attached.</p>',
          bullets: [
            'Inspect dorsal D-ring alignment between shoulder blades',
            'Perform the two-finger snugness check on all leg mating buckles',
            'Verify zero chemical or ultraviolet degradation on polyester webbing',
          ],
        },
      };
    }

    case 'tabs': {
      const presets = [
        {
          label: 'Overview & Scope',
          icon: 'BookOpen',
          title: 'Regulatory Scope & Trigger Heights',
          content:
            '<p>OSHA construction standard 29 CFR 1926.501 mandates fall protection at <strong>6 feet or higher</strong> above lower levels. General industry trigger height is 4 feet, and shipyard operations trigger at 5 feet.</p>',
        },
        {
          label: 'Equipment Donning',
          icon: 'CheckCircle',
          title: 'Proper Step-by-Step Donning Protocol',
          content:
            '<p>Hold harness by dorsal D-ring, gently shake to allow straps to fall into place. Slip straps over shoulders like a vest, connect chest strap at sternum, and fasten leg straps snugly.</p>',
        },
        {
          label: 'Inspection Checklist',
          icon: 'FileCheck',
          title: 'Pre-Shift Tactile Checklist',
          content:
            '<p>Flex webbing in inverted U-shape to expose broken fibers, pulled stitches, heat cuts, or chemical discoloration. Verify snap hook self-closing double-locking gates lock securely.</p>',
        },
        {
          label: 'Rescue & Recovery',
          icon: 'Flame',
          title: 'Emergency Suspension Trauma Protocol',
          content:
            '<p>Deploy foot loop relief straps immediately if conscious. Designated on-site rescue team must initiate retrieval within 6 to 10 minutes to prevent orthostatic shock.</p>',
        },
      ];

      const tabs = Array.from({ length: Math.min(count, presets.length) }).map(
        (_, idx) =>
          presets[idx] || {
            label: `Section ${idx + 1}`,
            icon: AVAILABLE_ICONS[idx % AVAILABLE_ICONS.length],
            title: `Topic Module ${idx + 1}`,
            content: `<p>Detailed instructional material for tab panel ${idx + 1}.</p>`,
          }
      );

      return {
        id: generateComponentId('tabs'),
        type: 'tabs',
        props: {
          title: 'Interactive Procedure Guide',
          defaultTab: 0,
          theme: 'amber',
          tabs,
        },
      };
    }

    case 'stats': {
      const presets = [
        {
          value: '1,800 lbs',
          label: 'Max Allowable Arrest Force',
          subtitle: 'OSHA 1926.502 limit on body',
          theme: 'amber',
          icon: 'Shield',
        },
        {
          value: '5,000 lbs',
          label: 'Anchor Point Strength',
          subtitle: 'Per employee attached minimum',
          theme: 'emerald',
          icon: 'Award',
        },
        {
          value: '6 Feet',
          label: 'Construction Trigger Height',
          subtitle: 'Mandatory fall protection elevation',
          theme: 'sky',
          icon: 'Activity',
        },
        {
          value: '3.5 Feet',
          label: 'Max Deceleration Distance',
          subtitle: 'Shock absorber extension limit',
          theme: 'rose',
          icon: 'Clock',
        },
      ];

      const stats = Array.from({ length: Math.min(count, presets.length) }).map(
        (_, idx) =>
          presets[idx] || {
            value: `${(idx + 1) * 100}%`,
            label: `Key Benchmark #${idx + 1}`,
            subtitle: 'Verified regulatory metric',
            theme: COLOR_THEMES[idx % COLOR_THEMES.length].id,
            icon: AVAILABLE_ICONS[idx % AVAILABLE_ICONS.length],
          }
      );

      return {
        id: generateComponentId('stats'),
        type: 'stats',
        props: {
          title: 'Critical Engineering Standards & Safety Limits',
          stats,
        },
      };
    }

    case 'steps': {
      const presets = [
        {
          number: '01',
          title: 'Pre-Shift Inspection',
          description:
            'Hold harness by back D-ring, shake out straps, and visually inspect webbing for cuts, burns, or chemical damage.',
          theme: 'amber',
        },
        {
          number: '02',
          title: 'Shoulder & Chest Donning',
          description:
            'Slip straps over shoulders like a vest. Fasten chest strap across mid-sternum (6-8 inches below chin).',
          theme: 'sky',
        },
        {
          number: '03',
          title: 'Leg Strap Mating',
          description:
            'Pass leg straps through crotch and latch mating buckles. Check snugness with flat two-finger test.',
          theme: 'emerald',
        },
        {
          number: '04',
          title: 'D-Ring Positioning Check',
          description:
            'Have a coworker verify the dorsal D-ring rests centered between shoulder blades in optimal position.',
          theme: 'purple',
        },
        {
          number: '05',
          title: 'Anchor Connection & Lock',
          description:
            'Connect self-locking snap hook to certified 5,000-lb rated anchorage point before entering hazard perimeter.',
          theme: 'rose',
        },
      ];

      const steps = Array.from({ length: Math.min(count, presets.length) }).map(
        (_, idx) =>
          presets[idx] || {
            number: String(idx + 1).padStart(2, '0'),
            title: `Step ${idx + 1}: Execution Protocol`,
            description: `Detailed procedure and verification checklist for operational stage ${idx + 1}.`,
            theme: COLOR_THEMES[idx % COLOR_THEMES.length].id,
          }
      );

      return {
        id: generateComponentId('steps'),
        type: 'steps',
        props: {
          title: 'Sequential Standard Operating Procedure (SOP)',
          subtitle:
            'Execute these steps in strict chronological order prior to commencing work at height.',
          steps,
        },
      };
    }

    case 'comparison': {
      const rows = [
        {
          criteria: 'Harness Webbing Fit',
          compliant:
            'Snug two-finger flat fit; zero slack or twisting in leg/chest straps.',
          violation:
            'Loose drooping straps that cause severe groin impact in a fall.',
        },
        {
          criteria: 'Dorsal D-Ring Location',
          compliant: 'Precisely centered between the worker shoulder blades.',
          violation:
            'Slid down to lower back or pulled sideways around the ribs.',
        },
        {
          criteria: 'Anchorage Selection',
          compliant:
            'Certified independent anchor point rated for at least 5,000 lbs.',
          violation:
            'Tying off to conduit piping, scaffolding cross-braces, or vents.',
        },
        {
          criteria: 'Post-Fall Equipment Status',
          compliant:
            'Immediately remove all equipment from service, tag, and destroy.',
          violation:
            'Re-issuing or reusing a harness that already arrested a fall event.',
        },
      ].slice(0, count);

      return {
        id: generateComponentId('comp'),
        type: 'comparison',
        props: {
          title: 'Mandatory Compliance vs Critical Violation',
          leftHeader: 'Compliant Best Practice',
          rightHeader: 'Prohibited Critical Violation',
          rows,
        },
      };
    }

    case 'key-takeaways': {
      const bullets = [
        'Full body harnesses must safely limit peak arresting forces to 1,800 lbs.',
        'Dorsal D-ring must remain centered between shoulder blades at all times.',
        'Pre-shift visual and tactile inspection is legally mandated prior to every shift.',
        'Never reuse any PFAS component that has been subjected to fall arrest forces.',
        'Employers must have a written, tested rescue plan to retrieve suspended workers.',
      ].slice(0, count);

      return {
        id: generateComponentId('takeaways'),
        type: 'key-takeaways',
        props: {
          title: 'Essential Safety Mandates & Takeaways',
          subtitle:
            'Core regulatory milestones required for accreditation compliance.',
          theme: 'emerald',
          bullets,
        },
      };
    }

    case 'quote': {
      return {
        id: generateComponentId('quote'),
        type: 'quote',
        props: {
          quote:
            'The employer shall provide for prompt rescue of employees in the event of a fall or shall assure that employees are able to rescue themselves.',
          citation: 'OSHA 29 CFR 1926.502(d)(20)',
          author: 'Occupational Safety and Health Administration (OSHA)',
          theme: 'amber',
        },
      };
    }

    case 'two-column': {
      return {
        id: generateComponentId('twocol'),
        type: 'two-column',
        props: {
          leftTitle: 'Engineering Safeguards',
          leftContent:
            '<p>Physical barriers, safety nets, and passive guardrail systems designed to eliminate fall exposure entirely from the work zone.</p>',
          rightTitle: 'Personal Protective Systems',
          rightContent:
            '<p>Full body harnesses, shock-absorbing lanyards, and self-retracting lifelines used when passive engineering controls are infeasible.</p>',
          theme: 'slate',
        },
      };
    }

    case 'gallery': {
      const photos = [
        {
          url: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=80',
          caption: 'Full Body Harness Donning Inspection',
        },
        {
          url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
          caption: 'Certified Anchor Point Rating Check',
        },
        {
          url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
          caption: 'Tactile Webbing & Stitching Inspection',
        },
      ].slice(0, count);

      return {
        id: generateComponentId('gal'),
        type: 'gallery',
        props: {
          title: 'Field Safety Visual Inspection Gallery',
          photos,
        },
      };
    }

    case 'puzzle-game': {
      const presets = [
        {
          id: 'p1',
          text: 'Conduct Atmospheric & Hazard Pre-Entry Evaluation',
          order: 1,
          hint: 'Step 1: Environmental check',
        },
        {
          id: 'p2',
          text: 'Inspect Harness Webbing, D-Ring & Locking Latches',
          order: 2,
          hint: 'Step 2: PPE integrity',
        },
        {
          id: 'p3',
          text: 'Anchor Shock-Absorbing Lanyard to 5,000-lb Rated Point',
          order: 3,
          hint: 'Step 3: Secure anchorage',
        },
        {
          id: 'p4',
          text: 'Verify Lockout/Tagout (LOTO) Zero-Energy Boundary',
          order: 4,
          hint: 'Step 4: Energy isolation',
        },
        {
          id: 'p5',
          text: 'Maintain Continuous Two-Way Comms with Attendant',
          order: 5,
          hint: 'Step 5: Communication link',
        },
      ];

      const puzzleCount = Math.max(3, Math.min(count, 5));
      const items = presets.slice(0, puzzleCount);
      // Scramble puzzle items
      const scrambled = [...items].sort(() => Math.random() - 0.5);

      return {
        id: generateComponentId('puzzle'),
        type: 'puzzle-game',
        props: {
          title: `Safety Sequence Puzzle: ${topicTitle}`,
          subtitle:
            'Click or arrange the safety protocol tiles into the correct compliant sequence to solve the puzzle.',
          items,
          scrambled,
          successTitle: '🎉 100% Compliant Sequence Mastered!',
          successMessage:
            'Great job! You arranged all safety protocol steps in the correct certified OSHA sequence.',
        },
      };
    }

    case 'rich-text': {
      return {
        id: generateComponentId('rt'),
        type: 'rich-text',
        props: {
          html: `<h3>${topicTitle}</h3><p>Comprehensive regulatory and procedural requirements covering equipment specifications, operational thresholds, and safety controls. Verify all site safety plans are approved by the designated competent person.</p>`,
        },
      };
    }

    case 'divider': {
      return {
        id: generateComponentId('div'),
        type: 'divider',
        props: {
          label: 'REGULATORY COMPLIANCE PROTOCOL',
          style: 'line', // 'line' | 'badge' | 'dots'
        },
      };
    }

    default:
      return {
        id: generateComponentId('custom'),
        type: 'rich-text',
        props: { html: '<p>Custom content block.</p>' },
      };
  }
}

/**
 * Helper to parse raw topic content (HTML string OR structured JSON)
 * into a standardized structured component array, converting plain elements
 * into interactive Accordions, 3D Flip Cards, Steps, Takeaways, and Callouts.
 */
export function parseTopicContentToComponents(
  rawContent,
  fallbackTitle = 'Topic Content'
) {
  if (!rawContent) {
    return {
      version: 2,
      components: [
        generateComponentDefaults('rich-text', { topicTitle: fallbackTitle }),
        generateComponentDefaults('accordion', { count: 3 }),
      ],
    };
  }

  // 1. If already structured component array or object with components
  if (typeof rawContent === 'object' && rawContent !== null) {
    if (Array.isArray(rawContent.components)) {
      return {
        version: 2,
        components: rawContent.components.map((c) => ({
          ...c,
          id: c.id || generateComponentId(c.type || 'comp'),
          props: c.props || c.data || {},
        })),
      };
    }
    if (Array.isArray(rawContent)) {
      return {
        version: 2,
        components: rawContent.map((c) => ({
          ...c,
          id: c.id || generateComponentId(c.type || 'comp'),
          props: c.props || c.data || {},
        })),
      };
    }
  }

  // 2. If it's a JSON string representing structured content
  if (typeof rawContent === 'string' && rawContent.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawContent);
      if (parsed && Array.isArray(parsed.components)) {
        return {
          version: 2,
          components: parsed.components.map((c) => ({
            ...c,
            id: c.id || generateComponentId(c.type || 'comp'),
            props: c.props || c.data || {},
          })),
        };
      }
    } catch (e) {
      // Fall through to HTML parser
    }
  }

  // 3. It's an HTML or markdown string — convert to interactive structured components!
  const components = [];
  const html = String(rawContent).trim();

  // A. Check for callouts
  const calloutMatches = html.match(
    /<div class="callout callout-(warning|danger|info|success)">(.*?)<\/div>/gis
  );

  // B. Check for key-points
  const keyPointsMatches = html.match(
    /<div class="key-points">(.*?)<\/div>/gis
  );

  // C. Check for ordered steps (<ol>...</ol>)
  const olMatches = html.match(/<ol[^>]*>(.*?)<\/ol>/gis);

  // D. Check for unordered checklists/accordions (<ul>...</ul>)
  const ulMatches = html.match(/<ul[^>]*>(.*?)<\/ul>/gis);

  // Extract clean lead paragraph
  let leadText = html
    .replace(/<div class="callout.*?<\/div>/gis, '')
    .replace(/<div class="key-points.*?<\/div>/gis, '')
    .replace(/<ol[^>]*>.*?<\/ol>/gis, '')
    .replace(/<ul[^>]*>.*?<\/ul>/gis, '')
    .trim();

  if (leadText && leadText !== '<p></p>' && leadText !== '<p><br></p>') {
    components.push({
      id: generateComponentId('rt'),
      type: 'rich-text',
      props: { html: leadText },
    });
  }

  // Convert callouts if found
  if (calloutMatches && calloutMatches.length > 0) {
    calloutMatches.forEach((calloutHtml) => {
      const variantMatch = calloutHtml.match(
        /callout-(warning|danger|info|success)/
      );
      const variant = variantMatch ? variantMatch[1] : 'warning';
      const cleanContent = calloutHtml
        .replace(/<div class="callout.*?">/i, '')
        .replace(/<\/div>$/i, '');
      components.push({
        id: generateComponentId('callout'),
        type: 'callout',
        props: {
          variant,
          title:
            variant === 'warning'
              ? 'Mandatory Safety Requirement'
              : variant === 'danger'
                ? 'Critical Hazard Alert'
                : 'Regulatory Note',
          content: cleanContent,
          bullets: [],
        },
      });
    });
  }

  // Convert ordered lists into interactive procedural steps
  if (olMatches && olMatches.length > 0) {
    olMatches.forEach((olHtml) => {
      const liMatches = olHtml.match(/<li>(.*?)<\/li>/gi);
      if (liMatches && liMatches.length > 0) {
        const steps = liMatches.map((li, idx) => {
          const cleanText = li.replace(/<[^>]*>/g, '').trim();
          const parts = cleanText.split(':');
          const title = parts.length > 1 ? parts[0].trim() : `Step ${idx + 1}`;
          const description =
            parts.length > 1 ? parts.slice(1).join(':').trim() : cleanText;
          return { id: generateComponentId('step'), title, description };
        });
        components.push({
          id: generateComponentId('steps'),
          type: 'steps',
          props: {
            title: 'Sequential Standard Operating Procedure',
            steps,
          },
        });
      }
    });
  }

  // Convert key points or unordered lists if found
  if (keyPointsMatches && keyPointsMatches.length > 0) {
    keyPointsMatches.forEach((kp) => {
      const liMatches = kp.match(/<li>(.*?)<\/li>/gi);
      const bullets = liMatches
        ? liMatches.map((li) => li.replace(/<[^>]*>/g, '').trim())
        : [];
      if (bullets.length > 0) {
        components.push({
          id: generateComponentId('takeaways'),
          type: 'key-takeaways',
          props: {
            title: 'Core Learning Milestones & Standards',
            subtitle: 'Critical takeaways for this topic',
            theme: 'amber',
            bullets,
          },
        });
      }
    });
  } else if (ulMatches && ulMatches.length > 0) {
    ulMatches.forEach((ulHtml) => {
      const liMatches = ulHtml.match(/<li>(.*?)<\/li>/gi);
      if (liMatches && liMatches.length >= 2) {
        const items = liMatches.map((li, idx) => {
          const cleanText = li.replace(/<[^>]*>/g, '').trim();
          const parts = cleanText.split(':');
          const title =
            parts.length > 1 ? parts[0].trim() : `Compliance Focus #${idx + 1}`;
          const content =
            parts.length > 1 ? parts.slice(1).join(':').trim() : cleanText;
          return {
            id: generateComponentId('acc_item'),
            title,
            content,
            badge: 'Required',
          };
        });
        components.push({
          id: generateComponentId('accordion'),
          type: 'accordion',
          props: {
            title: 'Interactive Safety Checklist & Guidelines',
            items,
          },
        });
      }
    });
  }

  // If no components were formed, wrap in rich-text and default accordion
  if (components.length === 0) {
    components.push({
      id: generateComponentId('rt'),
      type: 'rich-text',
      props: { html: rawContent },
    });
    components.push(
      generateComponentDefaults('accordion', {
        count: 3,
        topicTitle: fallbackTitle,
      })
    );
  }

  return {
    version: 2,
    components,
  };
}

/**
 * Helper to serialize structured components back to HTML string for backward compatibility
 */
export function serializeComponentsToHtml(structure) {
  if (!structure || !Array.isArray(structure.components)) {
    return '';
  }

  let htmlParts = [];

  structure.components.forEach((comp) => {
    switch (comp.type) {
      case 'rich-text':
        htmlParts.push(comp.props.html || '');
        break;

      case 'accordion':
        htmlParts.push(
          `<div class="accordion-section" data-title="${comp.props.title || ''}">`
        );
        comp.props.items?.forEach((item) => {
          htmlParts.push(`<h4>${item.title}</h4>${item.content}`);
        });
        htmlParts.push(`</div>`);
        break;

      case 'flip-cards':
        htmlParts.push(
          `<div class="key-points"><h3>${comp.props.title || 'Key Protocols'}</h3><ul>`
        );
        comp.props.cards?.forEach((c) => {
          htmlParts.push(
            `<li><strong>${c.title}:</strong> ${c.frontText} (${c.backText})</li>`
          );
        });
        htmlParts.push(`</ul></div>`);
        break;

      case 'callout':
        htmlParts.push(
          `<div class="callout callout-${comp.props.variant || 'warning'}"><strong>${comp.props.title || 'Safety Mandate'}:</strong> ${comp.props.content}</div>`
        );
        break;

      case 'key-takeaways':
        htmlParts.push(
          `<div class="key-points"><h3>${comp.props.title || 'Key Takeaways'}</h3><ul>`
        );
        comp.props.bullets?.forEach((b) => {
          htmlParts.push(`<li>${b}</li>`);
        });
        htmlParts.push(`</ul></div>`);
        break;

      default:
        if (comp.props?.content) htmlParts.push(comp.props.content);
        break;
    }
  });

  return htmlParts.join('\n\n');
}
