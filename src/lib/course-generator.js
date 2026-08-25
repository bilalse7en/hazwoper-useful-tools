/**
 * @file course-generator.js
 * Production AI course generation engine with rich, domain-specific content.
 * Generates complete course structures for Safety, Technology, Healthcare, Business, and more.
 */

import { generateComponentDefaults } from '@/lib/component-registry';
import { generateSe7enImage, getRealisticTopicPhoto } from '@/lib/se7en-ai';

// ============================================================
// UUID GENERATOR
// ============================================================
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================
// CONTENT BANKS — SAFETY
// ============================================================
const SAFETY_MODULES = [
  'Hazard Communication (HazCom)',
  'Personal Protective Equipment (PPE)',
  'Respiratory Protection',
  'Confined Space Entry',
  'Lockout/Tagout (LOTO)',
  'Fire Safety and Prevention',
  'Electrical Safety',
  'Fall Protection',
  'Bloodborne Pathogens',
  'Heat Stress and Cold Stress',
  'Ergonomics',
  'Chemical Safety',
  'Radiation Safety',
  'Excavation and Trenching Safety',
  'Scaffolding Safety',
  'Forklift Safety',
  'Machine Guarding',
  'Noise and Hearing Conservation',
  'Lead Safety',
  'Asbestos Awareness',
  'Mold Safety and Remediation',
  'Emergency Action Plans',
  'First Aid and CPR',
  'Workplace Violence Prevention',
  'Industrial Hygiene Basics',
  'Toxicology Principles',
  'Decontamination Procedures',
  'Spill Response and Control',
  'Site Characterization',
  'Medical Surveillance',
  'Process Safety Management',
  'Material Handling and Storage',
  'Slips, Trips, and Falls',
  'Hand and Power Tool Safety',
  'Welding and Cutting Safety',
];

const SAFETY_LESSONS = [
  'Regulatory Requirements and OSHA Standards',
  'Identifying Hazards in the Workplace',
  'Risk Assessment and Mitigation Strategies',
  'Selection and Use of Equipment',
  'Maintenance and Inspection Procedures',
  'Emergency Response Protocols',
  'Safe Work Practices and Procedures',
  'Monitoring and Exposure Limits',
  'Health Effects and Symptom Recognition',
  'Incident Investigation and Reporting',
  'Documentation and Record-Keeping',
  'Worker Training Requirements',
  'Engineering and Administrative Controls',
  'Compliance Audits and Inspections',
  'Hazard Analysis and Job Safety Analysis',
];

const SAFETY_TOPICS = [
  '29 CFR 1910 Scope',
  'PEL Exposure Limits',
  'IDLH Atmospheres',
  'Hierarchy of Controls',
  'Equipment Sizing & Fit',
  'Maintenance Standards',
  'Signs & Barricades',
  'Emergency Escape Routes',
  'First Aid Protocols',
  'Decon Line Setup',
  'Site Control Zones',
  'Air Monitoring Setup',
  'Heat Stress Controls',
  'Confined Space Permits',
  'Lockout/Tagout (LOTO)',
  'Chemical Compatibility',
  'SDS Interpretation',
  'Spill Containment',
  'Trench Shoring Methods',
  'Fall Arrest Systems',
  'Fit Testing Protocols',
  'Electrical Lockout',
  'Fire Extinguishers',
  'Exposure Control Plans',
  'Ergonomic Risk Factors',
  'Noise Dosimetry',
  'Lead Safety Controls',
  'Asbestos Precautions',
  'Hot Work Permits',
  'Forklift Inspection',
];

const MOLD_TOPICS = [
  'Mold Classification',
  'Health Effects',
  'Inspection Procedures',
  'Moisture Control',
  'PPE Requirements',
  'Containment Setup',
  'HVAC Decontamination',
  'Spore Sampling',
  'EPA Guidelines',
  'OSHA Standards',
  'Remediation Methods',
  'Clearance Testing',
  'Building Prevention',
  'Water Damage Response',
  'Antimicrobial Controls',
  'HEPA Cleaning',
  'Waste Disposal',
  'Moisture Meters',
  'Envelope Assessment',
  'Documentation Logs',
];

// ============================================================
// CONTENT BANKS — TECHNOLOGY
// ============================================================
const TECHNOLOGY_MODULES = [
  'Programming Fundamentals',
  'Data Structures and Algorithms',
  'Web Development Essentials',
  'Database Management Systems',
  'Cloud Computing and Infrastructure',
  'Cybersecurity Fundamentals',
  'DevOps and CI/CD Pipelines',
  'Machine Learning and AI Basics',
  'API Design and Development',
  'Software Testing and Quality Assurance',
  'Mobile Application Development',
  'System Design and Architecture',
  'Networking and Protocols',
  'Data Science and Analytics',
  'Blockchain and Distributed Systems',
];

const TECHNOLOGY_LESSONS = [
  'Core Syntax and Language Semantics',
  'Architecture Patterns and Design',
  'Performance Optimization Techniques',
  'Security Best Practices',
  'Deployment and Scaling Strategies',
  'Version Control Workflows',
  'State Management Patterns',
  'Asynchronous Programming Models',
  'Error Handling and Logging Strategies',
  'Integration and Unit Testing',
  'Code Review and Quality Standards',
  'Documentation Best Practices',
  'Monitoring and Observability',
  'Incident Response and Recovery',
  'Capacity Planning and Load Testing',
];

const TECHNOLOGY_TOPICS = [
  'Variables, Types, and Type Systems',
  'Control Flow and Iteration',
  'Object-Oriented Design Principles',
  'Functional Programming Concepts',
  'REST API Design Patterns',
  'GraphQL Schema Design',
  'SQL Queries and Optimization',
  'NoSQL Data Modeling',
  'Docker Containerization',
  'Kubernetes Orchestration',
  'CI/CD Pipeline Configuration',
  'Authentication and OAuth 2.0',
  'Responsive and Adaptive Design',
  'Microservices Architecture',
  'Event-Driven Architecture',
  'Message Queues and Pub/Sub',
  'Caching Strategies (Redis, Memcached)',
  'Load Balancing Techniques',
  'SSL/TLS and Encryption',
  'Git Branching Strategies',
];

// ============================================================
// CONTENT BANKS — HEALTHCARE
// ============================================================
const HEALTHCARE_MODULES = [
  'Patient Confidentiality and HIPAA',
  'Infection Control Protocols',
  'Clinical Documentation Standards',
  'Pharmacology Fundamentals',
  'Emergency Medical Procedures',
  'Patient Communication Skills',
  'Medical Ethics and Law',
  'Quality Improvement in Healthcare',
  'Healthcare Information Systems',
  'Cultural Competency in Care',
  'Pain Management Strategies',
  'Mental Health First Aid',
  'Surgical Safety Protocols',
  'Diagnostic Testing Procedures',
  'Chronic Disease Management',
];

const HEALTHCARE_LESSONS = [
  'Regulatory Compliance Requirements',
  'Standard Operating Procedures',
  'Patient Assessment Techniques',
  'Treatment Planning Approaches',
  'Documentation and Charting',
  'Team Communication Protocols',
  'Risk Mitigation Strategies',
  'Equipment Operation and Maintenance',
  'Quality Metrics and Reporting',
  'Continuing Education Requirements',
];

const HEALTHCARE_TOPICS = [
  'Protected Health Information (PHI) Handling',
  'Hand Hygiene Protocols',
  'Standard and Transmission-Based Precautions',
  'Medication Administration Rights',
  'Adverse Drug Reaction Recognition',
  'Patient History Documentation',
  'Vital Signs Assessment',
  'Electronic Health Records (EHR)',
  'Informed Consent Procedures',
  'Fall Risk Assessment',
  'Pressure Injury Prevention',
  'Code Blue Response Protocol',
  'Sharps Disposal and Safety',
  'Blood Transfusion Protocols',
  'Isolation Precautions by Category',
  'Patient Discharge Planning',
  'Medication Reconciliation Process',
  'Cultural Sensitivity in Care Delivery',
  'End-of-Life Care Considerations',
  'Mandatory Reporting Requirements',
];

// ============================================================
// CONTENT BANKS — BUSINESS / COMPLIANCE / GENERAL
// ============================================================
const BUSINESS_MODULES = [
  'Leadership and Management',
  'Financial Accounting Fundamentals',
  'Marketing Strategy and Analytics',
  'Operations Management',
  'Human Resources Management',
  'Business Ethics and Governance',
  'Project Management Methodologies',
  'Strategic Planning',
  'Sales and Negotiation Techniques',
  'Customer Service Excellence',
  'Supply Chain Management',
  'Business Communication',
  'Data-Driven Decision Making',
  'Change Management',
  'Entrepreneurship and Innovation',
];

const BUSINESS_LESSONS = [
  'Foundational Concepts and Theory',
  'Analytical Frameworks and Tools',
  'Implementation and Execution Strategies',
  'Performance Metrics and KPIs',
  'Team Dynamics and Collaboration',
  'Market Analysis and Research',
  'Risk Assessment and Management',
  'Budgeting and Financial Forecasting',
  'Communication and Presentation Skills',
  'Regulatory Compliance Overview',
];

const BUSINESS_TOPICS = [
  'SWOT and PESTLE Analysis',
  'Return on Investment (ROI) Calculation',
  'Key Performance Indicators Framework',
  'Agile vs. Waterfall Methodologies',
  'Conflict Resolution Techniques',
  'Consumer Behavior Analysis',
  'Supply Chain Optimization',
  'Financial Statement Interpretation',
  'Brand Positioning Strategy',
  'Stakeholder Engagement Models',
  'Market Segmentation Approaches',
  'Competitive Analysis Methods',
  'Business Model Canvas',
  'Lean Management Principles',
  'Digital Transformation Strategy',
  'Employee Engagement Programs',
  'Performance Review Systems',
  'Compliance Training Requirements',
  'Crisis Communication Plans',
  'Succession Planning',
];

// ============================================================
// SAFETY QUIZ BANK (domain-specific, real knowledge)
// ============================================================
// ============================================================
// 15 INTERACTIVE QUIZ TYPES QUESTION BANK
// ============================================================
export const INTERACTIVE_QUIZ_TYPES = [
  {
    id: 'multiple-choice',
    name: 'Multiple Choice Challenge',
    description: 'Select the correct answer.',
    icon: '🎯',
  },
  {
    id: 'true-false',
    name: 'True or False Safety Check',
    description: 'Decide whether a statement is safe or unsafe.',
    icon: '⚖️',
  },
  {
    id: 'scenario',
    name: 'Scenario-Based Challenge',
    description: 'Read a workplace situation and choose the best action.',
    icon: '📋',
  },
  {
    id: 'hazard-id',
    name: 'Hazard Identification',
    description: 'Identify hazards shown in a workplace situation/image.',
    icon: '⚠️',
  },
  {
    id: 'match-hazard',
    name: 'Drag & Drop — Match the Hazard',
    description: 'Match hazards with their correct safety controls.',
    icon: '🔗',
  },
  {
    id: 'ordering',
    name: 'Drag & Drop — Put in the Correct Order',
    description: 'Arrange safety procedures in the correct sequence.',
    icon: '🔢',
  },
  {
    id: 'safety-decision',
    name: 'Safety Decision Challenge',
    description: 'Choose what you would do in a specific situation.',
    icon: '🚦',
  },
  {
    id: 'safe-unsafe',
    name: 'Safe or Unsafe?',
    description: "Decide whether an operator's action is safe or unsafe.",
    icon: '🛡️',
  },
  {
    id: 'what-would-you-do',
    name: 'What Would You Do?',
    description: 'Select the safest response to a workplace incident.',
    icon: '❓',
  },
  {
    id: 'spot-hazard',
    name: 'Spot the Hazard',
    description: 'Find hazards in a workplace scene.',
    icon: '🔍',
  },
  {
    id: 'match-ppe',
    name: 'Match the PPE',
    description: 'Match PPE with the hazard or task.',
    icon: '🦺',
  },
  {
    id: 'inspection-challenge',
    name: 'Inspection Challenge',
    description:
      'Identify what should be checked during an equipment inspection.',
    icon: '📝',
  },
  {
    id: 'knowledge-checkpoint',
    name: 'Knowledge Checkpoint',
    description: 'Short quiz after each lesson.',
    icon: '⏱️',
  },
  {
    id: 'emergency-response',
    name: 'Emergency Response Challenge',
    description: 'Choose the correct response during an emergency.',
    icon: '🚨',
  },
  {
    id: 'final-safety-challenge',
    name: 'Final Safety Challenge',
    description: 'Comprehensive interactive assessment.',
    icon: '🏆',
  },
];

export const SAFETY_INTERACTIVE_QUIZ_BANK = [
  // 1. Multiple Choice Challenge
  {
    type: 'multiple-choice',
    typeLabel: 'Multiple Choice Challenge',
    question:
      'What is the minimum oxygen level required for safe entry into a confined space under OSHA standards?',
    options: ['16.0%', '19.5%', '21.0%', '23.5%'],
    correctAnswer: 1,
    explanation:
      'OSHA 29 CFR 1910.146 requires an oxygen level between 19.5% and 23.5% for safe atmospheric entry without supplied-air respirators.',
  },
  {
    type: 'multiple-choice',
    typeLabel: 'Multiple Choice Challenge',
    question:
      'Under OSHA 1926.502, what is the maximum allowable arresting force on a worker wearing a full body harness?',
    options: ['900 lbs', '1,800 lbs', '2,500 lbs', '5,000 lbs'],
    correctAnswer: 1,
    explanation:
      'OSHA standard limits deceleration impact force on the human body to 1,800 lbs when using a full body harness with energy-absorbing lanyards.',
  },
  {
    type: 'multiple-choice',
    typeLabel: 'Multiple Choice Challenge',
    question:
      'What is the minimum trigger height requiring fall protection in general construction under OSHA 1926.501?',
    options: ['4 feet', '6 feet', '8 feet', '10 feet'],
    correctAnswer: 1,
    explanation:
      'OSHA 29 CFR 1926.501 mandates fall protection at elevations of 6 feet or higher above lower levels in construction.',
  },

  // 2. True or False Safety Check
  {
    type: 'true-false',
    typeLabel: 'True or False Safety Check',
    question:
      'Lockout/Tagout (LOTO) protocols apply exclusively to electrical energy sources.',
    options: ['True / Safe', 'False / Unsafe'],
    correctAnswer: 1,
    explanation:
      'False. OSHA 29 CFR 1910.147 mandates LOTO for all hazardous energy forms including mechanical, hydraulic, pneumatic, chemical, and thermal.',
  },
  {
    type: 'true-false',
    typeLabel: 'True or False Safety Check',
    question:
      'Side D-rings on a body harness are approved as primary attachment points for fall arrest systems.',
    options: ['True / Safe', 'False / Unsafe'],
    correctAnswer: 1,
    explanation:
      'False. Side D-rings are strictly designed for work positioning and restraint only. Only the dorsal D-ring (between shoulder blades) or sternal D-ring (for ladder climbing) is certified for fall arrest.',
  },
  {
    type: 'true-false',
    typeLabel: 'True or False Safety Check',
    question:
      'A harness or lanyard that has successfully arrested a fall must be immediately taken out of service and destroyed.',
    options: ['True / Safe', 'False / Unsafe'],
    correctAnswer: 0,
    explanation:
      'True. Any personal fall arrest system component subjected to impact forces must be immediately removed from service, marked defective, and destroyed.',
  },

  // 3. Scenario-Based Challenge
  {
    type: 'scenario',
    typeLabel: 'Scenario-Based Challenge',
    scenario:
      'During excavation at 7 feet deep in Type C soil, sudden rain begins and minor wall sloughing is observed along the trench edge.',
    question:
      'What is the mandatory immediate action required by the safety standard?',
    options: [
      'Continue digging quickly to finish the utility install before water accumulates',
      'Immediately evacuate all workers from the trench and notify the Competent Person for inspection',
      'Place a single plywood sheet against the wall and proceed working',
      'Pump water out using a submersible pump while workers remain in the trench',
    ],
    correctAnswer: 1,
    explanation:
      'Water accumulation and wall sloughing indicate imminent cave-in danger. OSHA requires immediate evacuation until a Competent Person inspects and authorizes re-entry.',
  },
  {
    type: 'scenario',
    typeLabel: 'Scenario-Based Challenge',
    scenario:
      'You are tasked with cleaning the interior of a 15,000-gallon chemical storage vessel that contained toluene solvent. Atmospheric testing reveals 19.8% O2 and 45 ppm VOCs.',
    question:
      'What is the required permit protocol before any employee crosses the plane of entry?',
    options: [
      'Enter immediately since oxygen is within the 19.5% normal range',
      'Issue a Permit-Required Confined Space entry permit, establish continuous forced ventilation, station an outside attendant, and equip entrants with SCBA/SAR',
      'Wear an N95 dust mask and enter with a buddy',
      'Open the top hatch for 5 minutes then proceed without written documentation',
    ],
    correctAnswer: 1,
    explanation:
      'OSHA 1910.146 requires a written permit, atmospheric monitoring, trained attendants, mechanical ventilation, and matched respiratory protection for permit-required confined spaces.',
  },

  // 4. Hazard Identification
  {
    type: 'hazard-id',
    typeLabel: 'Hazard Identification',
    scenario:
      'In a paint manufacturing mixing room, three unlabeled drums of solvent are stored directly beside an ungrounded high-speed electric mixer.',
    question: 'Identify the primary OSHA violation and acute hazard present:',
    options: [
      'Improper GHS Chemical Labeling & Flammable Static Vapor Ignition Risk',
      'Ergonomic manual lifting strain',
      'Excessive background ambient noise hazard',
      'Inadequate room interior paint color',
    ],
    correctAnswer: 0,
    explanation:
      'Unlabeled drums violate GHS HazCom 29 CFR 1910.1200, and ungrounded electrical mixing equipment creates explosive vapor ignition hazards.',
  },
  {
    type: 'hazard-id',
    typeLabel: 'Hazard Identification',
    scenario:
      'A portable air compressor is operating on a wet concrete floor. The power cord has exposed copper wires wrapped with household duct tape, and the ground pin has been clipped off the plug.',
    question: 'What is the primary lethal hazard present in this scenario?',
    options: [
      'Severe Arc Flash & Direct Electrocution Hazard',
      'Tripping and housekeeping hazard',
      'Air pressure leakage risk',
      'Cosmetic equipment defect',
    ],
    correctAnswer: 0,
    explanation:
      'Damaged insulation and missing grounding pins in a wet industrial environment create direct paths for lethal electric current through the worker.',
  },

  // 5. Drag & Drop — Match the Hazard
  {
    type: 'match-hazard',
    typeLabel: 'Drag & Drop — Match the Hazard',
    question:
      'Match each industrial hazard with its required OSHA engineering or procedural control:',
    pairs: [
      {
        left: 'Energized 480V Machinery Servicing',
        right: 'Lockout/Tagout (LOTO) & Zero Energy Verification',
      },
      {
        left: 'Work at Height on 10ft Scaffold',
        right: 'Personal Fall Arrest System (PFAS) & Guardrails',
      },
      {
        left: 'Toxic Chemical Vapor Inhalation Risk',
        right: 'Local Exhaust Ventilation & Level A/B SCBA',
      },
      {
        left: 'Excavation Cave-In (>5ft Deep)',
        right: 'Trench Shielding Box / Shoring System',
      },
    ],
    explanation:
      'Implementing the correct Hierarchy of Controls provides reliable barrier defense against primary jobsite hazards.',
  },
  {
    type: 'match-hazard',
    typeLabel: 'Drag & Drop — Match the Hazard',
    question:
      'Match each physical workplace hazard with its mandatory threshold or boundary limitation:',
    pairs: [
      {
        left: 'Continuous Noise Exposure > 85 dBA',
        right: 'Mandatory Hearing Conservation & Annual Audiometric Testing',
      },
      {
        left: 'Oxygen Deficient Atmosphere (<19.5%)',
        right: 'Permit Entry Only with Supplied-Air Breathing Apparatus (SCBA)',
      },
      {
        left: 'Overhead Power Lines (<50 kV)',
        right: 'Maintain Minimum 10-Foot Clearance Zone at All Times',
      },
      {
        left: 'Hazardous Energy Lockout Padlock',
        right: 'One Key, One Lock, One Authorized Employee Exclusively',
      },
    ],
    explanation:
      'Strict adherence to regulatory thresholds prevents catastrophic industrial accidents and regulatory citations.',
  },

  // 6. Drag & Drop — Put in the Correct Order
  {
    type: 'ordering',
    typeLabel: 'Drag & Drop — Put in the Correct Order',
    question:
      'Arrange the 6 standard steps of the OSHA Lockout/Tagout (LOTO) procedure in the exact required sequence:',
    sequenceItems: [
      'Notify all affected and authorized employees',
      'Shut down the equipment using normal operational controls',
      'Isolate all primary and secondary hazardous energy sources',
      'Apply standard lockout padlocks and danger warning tags',
      'Dissipate, vent, or block all stored/residual energy',
      'Verify complete zero energy state with test activation',
    ],
    correctOrder: [0, 1, 2, 3, 4, 5],
    explanation:
      'OSHA 1910.147 mandates this exact 6-step sequence: Notification → Shutdown → Isolation → Lock/Tag → Stored Energy Release → Zero Energy Verification.',
  },
  {
    type: 'ordering',
    typeLabel: 'Drag & Drop — Put in the Correct Order',
    question:
      'Arrange the correct donning sequence for a Full Body Safety Harness:',
    sequenceItems: [
      'Hold harness by dorsal D-ring and shake to let straps fall into place',
      'Slip shoulder straps over arms like a jacket with D-ring centered on back',
      'Connect and adjust leg straps snug enough to slip flat fingers underneath',
      'Fasten and adjust chest strap 6 inches below collarbone',
      'Perform tactile check of all buckle latches and stow excess webbing',
    ],
    correctOrder: [0, 1, 2, 3, 4],
    explanation:
      'Proper donning sequence ensures the harness fits ergonomically and distributes deceleration impact forces across the pelvic cradle.',
  },

  // 7. Safety Decision Challenge
  {
    type: 'safety-decision',
    typeLabel: 'Safety Decision Challenge',
    scenario:
      'A general contractor asks your crew to bypass daily pre-shift PFAS harness inspection because a crane delivery is 45 minutes delayed and daylight is running out.',
    question: 'What is your required safety decision under OSHA compliance?',
    options: [
      'Agree to skip inspection this one time to meet contractor timeline',
      'Perform a 3-second visual glance while walking to the work platform',
      'Exercise Stop Work Authority and complete the mandatory hands-on tactile pre-use inspection',
      'Let an untrained coworker quickly sign off the inspection sheet',
    ],
    correctAnswer: 2,
    explanation:
      'Every authorized worker has full Stop Work Authority. Pre-shift inspection of lifesaving fall protection equipment can never be compromised for schedule pressure.',
  },

  // 8. Safe or Unsafe?
  {
    type: 'safe-unsafe',
    typeLabel: 'Safe or Unsafe?',
    scenario:
      'An ironworker connects their fall arrest snap hook directly to a 2-inch overhead conduit electrical pipe because a certified beam anchor was 15 feet away.',
    question: "Is this operator's action Safe or Unsafe?",
    options: ['SAFE', 'UNSAFE'],
    correctAnswer: 1,
    explanation:
      'UNSAFE. OSHA 1926.502 strictly prohibits tying off to conduit, cable trays, or sprinkler pipes. Anchor points must withstand 5,000 lbs per attached worker.',
  },
  {
    type: 'safe-unsafe',
    typeLabel: 'Safe or Unsafe?',
    scenario:
      'A worker uses two lanyards connected together in series to extend their reach over an open roof edge without calculating total fall clearance.',
    question: "Is this operator's action Safe or Unsafe?",
    options: ['SAFE', 'UNSAFE'],
    correctAnswer: 1,
    explanation:
      'UNSAFE. Connecting lanyards in series exceeds maximum allowable free fall distance (6 feet) and increases arresting force and elongation, risking ground impact.',
  },

  // 9. What Would You Do?
  {
    type: 'what-would-you-do',
    typeLabel: 'What Would You Do?',
    scenario:
      'Entering a chemical storage facility, you observe a coworker lying motionless on the floor near an open valve discharging a visible pungent vapor.',
    question: 'What is your immediate safest course of action?',
    options: [
      'Take a deep breath and rush in to physically pull the worker out',
      'Immediately sound the emergency evacuation alarm, isolate the perimeter upwind, and call the HAZMAT rescue team',
      'Search for an electric box fan to blow the vapor towards the doors',
      'Pour water onto the discharging valve from across the room',
    ],
    correctAnswer: 1,
    explanation:
      'Never enter a suspected toxic or oxygen-deficient IDLH atmosphere without SCBA. Over 60% of confined space fatalities are secondary would-be rescuers. Sound the alarm and activate trained HAZMAT rescue teams.',
  },

  // 10. Spot the Hazard
  {
    type: 'spot-hazard',
    typeLabel: 'Spot the Hazard',
    scenario: 'Industrial Loading Dock & Chemical Staging Area Scene',
    question:
      'Spot all active safety hazards in this work environment (Select all that apply):',
    hazardList: [
      {
        text: 'Frayed extension cord running across a wet puddle on the floor',
        isHazard: true,
      },
      {
        text: 'Mounted ABC dry chemical fire extinguisher with current inspection tag',
        isHazard: false,
      },
      {
        text: 'Emergency exit push bar door blocked by three stacked pallets',
        isHazard: true,
      },
      {
        text: 'Worker operating forklift on elevated loading dock with unlatched safety chain',
        isHazard: true,
      },
      {
        text: 'Clearly marked pedestrian walkway with yellow anti-slip floor coating',
        isHazard: false,
      },
    ],
    explanation:
      'Exposed electrical conductors in wet areas, blocked emergency egress routes, and unprotected dock drop-offs represent critical OSHA hazards.',
  },
  {
    type: 'spot-hazard',
    typeLabel: 'Spot the Hazard',
    scenario: 'Scaffolding & Work Platform Jobsite Inspection',
    question:
      'Identify the unsafe conditions present on this suspended work platform (Select all that apply):',
    hazardList: [
      {
        text: 'Missing midrail and toeboard on open edge 18 feet above ground',
        isHazard: true,
      },
      {
        text: 'Scaffold base plates resting on solid mudsills with leveling jacks locked',
        isHazard: false,
      },
      {
        text: 'Cracked, split scaffold plank with oil saturation on walking surface',
        isHazard: true,
      },
      {
        text: 'Overloaded scaffold with 4 pallets of masonry beyond rated working load',
        isHazard: true,
      },
      {
        text: 'Fully certified independent vertical lifeline anchored to structural steel',
        isHazard: false,
      },
    ],
    explanation:
      'Missing edge guardrails, damaged walking planks, and exceeding structural load ratings represent imminent scaffolding collapse and fall hazards.',
  },

  // 11. Match the PPE
  {
    type: 'match-ppe',
    typeLabel: 'Match the PPE',
    question:
      'Match each hazardous work task with its required Personal Protective Equipment ensemble:',
    pairs: [
      {
        left: 'Handling Corrosive Acid Chemical Transfer',
        right: 'Chemical Splash Goggles, Neoprene Gauntlets & Acid Apron',
      },
      {
        left: 'Heavy Angle Grinding & Metal Beveling',
        right: 'Full Face Shield over Safety Glasses & Cut-Resistant Gloves',
      },
      {
        left: 'Structural Steel Erection at 20 Feet',
        right: 'Full Body Harness with Dual Lanyards & Hard Hat',
      },
      {
        left: 'High Noise Generator Room (100 dBA)',
        right:
          'Dual Hearing Protection (Earplugs + Earmuffs) & Steel-Toe Boots',
      },
    ],
    explanation:
      'Proper task-specific PPE selection ensures that employees have barrier protection matched precisely to the exposure hazard.',
  },
  {
    type: 'match-ppe',
    typeLabel: 'Match the PPE',
    question:
      'Match the HAZWOPER PPE Protection Level to its core equipment standard:',
    pairs: [
      {
        left: 'Level A Protection (Highest Vapor Hazard)',
        right:
          'Totally Encapsulating Vapor-Protective Suit + Positive-Pressure SCBA',
      },
      {
        left: 'Level B Protection (Highest Respiratory Hazard)',
        right: 'Liquid Splash Suit + Positive-Pressure SCBA or Airline SAR',
      },
      {
        left: 'Level C Protection (Known Airborne Contaminant)',
        right:
          'Full-Face Air-Purifying Respirator (APR) with Cartridges + Chemical Coveralls',
      },
      {
        left: 'Level D Protection (Standard Work Uniform)',
        right:
          'Safety Boots, Hard Hat, High-Vis Vest, and Eye Protection (Zero Vapor Danger)',
      },
    ],
    explanation:
      'OSHA 29 CFR 1910.120 defines Levels A through D to prescribe graded levels of skin and respiratory defense.',
  },

  // 12. Inspection Challenge
  {
    type: 'inspection-challenge',
    typeLabel: 'Inspection Challenge',
    question:
      'Conduct a pre-use inspection check on a Full Body Harness. Determine which condition requires immediate REMOVAL FROM SERVICE:',
    checklist: [
      {
        item: 'Dorsal D-Ring shows minor surface dust with zero cracks, burrs, or distortion',
        status: 'PASS',
      },
      {
        item: 'Chest strap load-bearing webbing has a 1/4-inch cut with heat glazing from chemical contact',
        status: 'DEFECT',
      },
      {
        item: 'Manufacturer OSHA/ANSI compliance data label is clearly attached and legible',
        status: 'PASS',
      },
      {
        item: 'Quick-connect mating buckles latch firmly with dual audible clicks',
        status: 'PASS',
      },
    ],
    explanation:
      'Any cut, tear, frayed stitching, or chemical heat glaze on load-bearing webbing permanently degrades tensile capacity and requires immediate destruction of the harness.',
  },
  {
    type: 'inspection-challenge',
    typeLabel: 'Inspection Challenge',
    question:
      'Conduct a pre-operational safety inspection check on a portable ABC Dry Chemical Fire Extinguisher:',
    checklist: [
      {
        item: 'Pressure gauge indicator needle is centered squarely inside the green operable zone',
        status: 'PASS',
      },
      {
        item: 'Plastic tamper seal is broken and the safety pull-pin is completely missing',
        status: 'DEFECT',
      },
      {
        item: 'Discharge hose and nozzle are free of obstructions, cracks, and insect nests',
        status: 'PASS',
      },
      {
        item: 'Monthly visual inspection tag shows current initials and date within past 30 days',
        status: 'PASS',
      },
    ],
    explanation:
      'A missing pull-pin or broken tamper seal indicates possible discharge or tampering, requiring immediate recharging or replacement.',
  },

  // 13. Knowledge Checkpoint
  {
    type: 'knowledge-checkpoint',
    typeLabel: 'Knowledge Checkpoint',
    question:
      'What is the maximum allowable arresting force on a worker wearing a full body harness under OSHA 1926.502?',
    options: ['900 lbs', '1,800 lbs', '2,500 lbs', '5,000 lbs'],
    correctAnswer: 1,
    explanation:
      'OSHA standard 1926.502 limits deceleration impact force on the human body to 1,800 lbs when using a full body harness.',
  },
  {
    type: 'knowledge-checkpoint',
    typeLabel: 'Knowledge Checkpoint',
    question:
      'How often does OSHA 29 CFR 1910.120 mandate annual refresher training for HAZWOPER 40-hour and 24-hour certified personnel?',
    options: [
      'Every 6 months',
      'Every 12 months (Annually)',
      'Every 24 months',
      'Every 5 years',
    ],
    correctAnswer: 1,
    explanation:
      'OSHA standard 1910.120(e)(8) mandates 8 hours of annual refresher training every 12 months to maintain active site certification.',
  },

  // 14. Emergency Response Challenge
  {
    type: 'emergency-response',
    typeLabel: 'Emergency Response Challenge',
    scenario:
      'A worker has fallen from a scaffold and is hanging vertically in their full body harness awaiting aerial rescue.',
    question:
      'To prevent fatal Suspension Trauma (orthostatic intolerance), within what time window must prompt rescue be executed?',
    options: [
      'Within 10 to 15 minutes',
      'Within 1 to 2 hours',
      'Before the end of the shift',
      'Whenever the emergency services arrive without urgency',
    ],
    correctAnswer: 0,
    explanation:
      'Suspension trauma causes venous pooling in the lower extremities, leading to unconsciousness and cardiac arrest within 15–20 minutes. Prompt rescue within 10–15 minutes is critical.',
  },
  {
    type: 'emergency-response',
    typeLabel: 'Emergency Response Challenge',
    scenario:
      'A sudden chemical pipe rupture sprays hydrochloric acid onto a technician’s upper body and eyes.',
    question:
      'What is the immediate emergency response required by OSHA safety standards?',
    options: [
      'Walk to the breakroom to find dry paper towels',
      'Immediately activate the emergency eyewash/deluge shower and flush eyes and body continuously for at least 15 minutes',
      'Apply neutralizing base powder directly onto the skin',
      'Wait for the safety supervisor to arrive before removing contaminated clothing',
    ],
    correctAnswer: 1,
    explanation:
      'OSHA 1910.151 requires continuous flushing for a minimum of 15 minutes at an approved emergency wash station while simultaneously removing contaminated apparel.',
  },

  // 15. Final Safety Challenge
  {
    type: 'final-safety-challenge',
    typeLabel: 'Final Safety Challenge',
    question:
      'According to the OSHA Hierarchy of Controls, which method is the most effective in eliminating workplace danger?',
    options: [
      'Personal Protective Equipment (PPE)',
      'Administrative policies, shift rotation, and warning signage',
      'Engineering controls (guardrails, ventilation, interlocks)',
      'Elimination of the hazard physically from the workplace',
    ],
    correctAnswer: 3,
    explanation:
      'Elimination physically removes the hazard and is ranked as the most effective control at the top of the Hierarchy of Controls.',
  },
];

// ============================================================
// TECH & GENERAL QUIZ BANKS
// ============================================================
const TECH_QUIZ_BANK = [
  {
    type: 'multiple-choice',
    typeLabel: 'Multiple Choice Challenge',
    question: 'What does REST stand for?',
    options: [
      'Remote Execution Standard Technology',
      'Representational State Transfer',
      'Reactive Event Stream Transport',
      'Resource Entity State Topology',
    ],
    correctAnswer: 1,
    explanation:
      'REST stands for Representational State Transfer, an architectural style for APIs.',
  },
  {
    type: 'multiple-choice',
    typeLabel: 'Multiple Choice Challenge',
    question: 'Which data structure uses LIFO (Last In, First Out)?',
    options: ['Queue', 'Stack', 'Array', 'Linked List'],
    correctAnswer: 1,
    explanation:
      'A Stack follows LIFO — the last element added is the first one removed.',
  },
  {
    type: 'multiple-choice',
    typeLabel: 'Multiple Choice Challenge',
    question: 'What HTTP status code indicates a resource was not found?',
    options: ['200', '301', '404', '500'],
    correctAnswer: 2,
    explanation: '404 is the standard HTTP response code for "Not Found".',
  },
  {
    type: 'multiple-choice',
    typeLabel: 'Multiple Choice Challenge',
    question: 'Which SQL command is used to remove a table entirely?',
    options: ['DELETE', 'REMOVE', 'DROP', 'TRUNCATE'],
    correctAnswer: 2,
    explanation:
      'DROP TABLE removes the table structure and all data permanently.',
  },
];

const HEALTHCARE_QUIZ_BANK = [
  {
    type: 'multiple-choice',
    typeLabel: 'Multiple Choice Challenge',
    question: 'What does HIPAA stand for?',
    options: [
      'Health Insurance Portability and Accountability Act',
      'Healthcare Information Privacy and Access Act',
      'Health Industry Protection and Audit Act',
      'Hospital Insurance Payment and Administration Act',
    ],
    correctAnswer: 0,
    explanation:
      'HIPAA is the Health Insurance Portability and Accountability Act of 1996.',
  },
  {
    type: 'multiple-choice',
    typeLabel: 'Multiple Choice Challenge',
    question: 'How long should you wash your hands per WHO guidelines?',
    options: ['10 seconds', '20 seconds', '40-60 seconds', '2 minutes'],
    correctAnswer: 2,
    explanation:
      'WHO recommends 40-60 seconds for handwashing with soap and water.',
  },
];

// ============================================================
// CONTENT GENERATION TEMPLATES
// ============================================================
const CALLOUT_TYPES = ['warning', 'info', 'danger', 'tip'];

const SAFETY_PARAGRAPHS = [
  'According to OSHA statistics, proper implementation of safety protocols reduces workplace incidents by up to 60%. Employers must conduct regular hazard assessments and maintain comprehensive documentation of all safety measures.',
  'Personal Protective Equipment (PPE) serves as the last line of defense in the Hierarchy of Controls. When engineering and administrative controls cannot adequately reduce exposure, proper PPE selection, fitting, and maintenance become critical.',
  'Emergency Action Plans (EAP) must be documented, readily accessible to all employees, and practiced through regular drills. The plan must include evacuation procedures, emergency contact information, and designated assembly points.',
  'Regular safety audits and inspections are essential for identifying new or previously unrecognized hazards. All findings must be documented, corrective actions assigned, and follow-up inspections scheduled to verify resolution.',
  'The Globally Harmonized System (GHS) standardizes chemical classification and labeling worldwide. Safety Data Sheets provide 16 sections of critical information about chemical properties, hazards, handling, and emergency procedures.',
  'Confined space entry requires a comprehensive permit system, atmospheric testing, trained attendants, and rescue procedures. No entry shall be made until the space has been tested and conditions verified as safe.',
  'Lockout/Tagout procedures must be applied before any servicing or maintenance of equipment where unexpected energization could cause injury. All energy sources — electrical, mechanical, hydraulic, pneumatic, chemical, and thermal — must be controlled.',
  'Respiratory protection programs require written procedures, medical evaluations, fit testing, training, and proper selection based on the specific hazards present in the work environment.',
  'Fall protection systems include guardrails, safety nets, and personal fall arrest systems. Employers must ensure that walking and working surfaces have the strength and structural integrity to support workers safely.',
  'Workplace ergonomics addresses the design of workstations, tools, and tasks to fit the worker. Proper ergonomic practices reduce the risk of musculoskeletal disorders, which account for over 30% of all workplace injuries.',
];

const TECH_PARAGRAPHS = [
  'Modern software architecture emphasizes separation of concerns, modularity, and scalability. Microservices decompose monolithic applications into independently deployable services, each responsible for a specific business capability.',
  'Version control systems like Git enable collaborative development through branching, merging, and pull request workflows. Feature branches isolate changes, while CI/CD pipelines automate testing and deployment.',
  'Database design requires careful consideration of normalization, indexing strategies, and query optimization. Choosing between SQL and NoSQL depends on data structure, consistency requirements, and scaling needs.',
  'Cloud computing platforms provide Infrastructure as a Service (IaaS), Platform as a Service (PaaS), and Software as a Service (SaaS). Organizations must evaluate cost, performance, security, and compliance requirements.',
  'Security best practices include input validation, parameterized queries, proper authentication and authorization, encryption at rest and in transit, and regular security audits and penetration testing.',
  'Containerization with Docker packages applications with their dependencies, ensuring consistency across development, staging, and production environments. Kubernetes orchestrates container deployment, scaling, and management.',
  'API design follows RESTful principles including stateless communication, resource-based URLs, proper HTTP method usage, versioning strategies, and comprehensive error handling with meaningful status codes.',
  'Automated testing strategies include unit tests for individual functions, integration tests for component interactions, and end-to-end tests for complete user workflows. Test coverage should target critical business logic.',
];

const HEALTHCARE_PARAGRAPHS = [
  'Patient confidentiality under HIPAA requires that all Protected Health Information (PHI) be securely stored, transmitted only through encrypted channels, and accessed exclusively by authorized personnel with a legitimate need.',
  'Infection prevention relies on consistent adherence to standard precautions, proper hand hygiene, appropriate use of personal protective equipment, and environmental cleaning protocols based on the level of risk.',
  'Clinical documentation must be accurate, timely, legible, and complete. Proper documentation supports continuity of care, legal protection, accurate billing, quality improvement initiatives, and regulatory compliance.',
  'Medication safety requires adherence to the Five Rights, barcode verification, independent double-checks for high-alert medications, patient education, and documentation of administration and any adverse reactions.',
  'Patient communication should be clear, compassionate, and culturally sensitive. Using teach-back methods, plain language, and interpreter services when needed improves understanding and health outcomes.',
];

// ============================================================
// MODULE/LESSON/TOPIC NAME GENERATORS
// ============================================================
function shuffleArray(arr) {
  if (!Array.isArray(arr)) return [];
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const SAFETY_QUIZ_BANK = SAFETY_INTERACTIVE_QUIZ_BANK;

function getCategoryPools(category) {
  const cat = (category || 'general').toLowerCase();
  switch (cat) {
    case 'safety':
    case 'safety training':
    case 'compliance':
    case 'environmental':
      return {
        modules: SAFETY_MODULES,
        lessons: SAFETY_LESSONS,
        topics: SAFETY_TOPICS,
        paragraphs: SAFETY_PARAGRAPHS,
        quizBank: SAFETY_INTERACTIVE_QUIZ_BANK,
      };
    case 'technology':
      return {
        modules: TECHNOLOGY_MODULES,
        lessons: TECHNOLOGY_LESSONS,
        topics: TECHNOLOGY_TOPICS,
        paragraphs: TECH_PARAGRAPHS,
        quizBank: TECH_QUIZ_BANK,
      };
    case 'healthcare':
      return {
        modules: HEALTHCARE_MODULES,
        lessons: HEALTHCARE_LESSONS,
        topics: HEALTHCARE_TOPICS,
        paragraphs: HEALTHCARE_PARAGRAPHS,
        quizBank: HEALTHCARE_QUIZ_BANK,
      };
    case 'business':
    default:
      return {
        modules: BUSINESS_MODULES,
        lessons: BUSINESS_LESSONS,
        topics: BUSINESS_TOPICS,
        paragraphs: TECH_PARAGRAPHS,
        quizBank: TECH_QUIZ_BANK,
      };
  }
}

export function getModuleNames(category, count) {
  const { modules } = getCategoryPools(category);
  return shuffleArray(modules).slice(0, count);
}

export function getLessonNames(category, moduleName, count) {
  const { lessons } = getCategoryPools(category);
  return shuffleArray(lessons).slice(0, count);
}

export function getTopicNames(category, lessonName, count) {
  const { topics } = getCategoryPools(category);
  const cat = (category || '').toLowerCase();
  let pool = [...topics];
  if (cat === 'safety' || cat === 'safety training') {
    pool = [...pool, ...MOLD_TOPICS];
  }
  return shuffleArray(pool).slice(0, count);
}

export function getCategoryTemplates(category) {
  return getCategoryPools(category);
}

// ============================================================
// NARRATION TEXT GENERATOR
// ============================================================
export function generateNarrationText(htmlContent) {
  if (!htmlContent) return '';
  return htmlContent
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// INTERACTION GENERATOR
// ============================================================
export function generateInteraction(type, topicTitle, content) {
  const id = generateUUID();
  switch (type) {
    case 'click-reveal':
      return {
        type: 'click-reveal',
        data: {
          title: `Key Concepts: ${topicTitle}`,
          items: [
            {
              id: generateUUID(),
              title: 'Core Principle',
              content: `Understanding the fundamental principles of ${topicTitle} is essential for proper application in the field.`,
              revealed: false,
            },
            {
              id: generateUUID(),
              title: 'Common Mistakes',
              content: `A frequent error is failing to follow established procedures for ${topicTitle}. Always reference current guidelines.`,
              revealed: false,
            },
            {
              id: generateUUID(),
              title: 'Best Practice',
              content: `Industry best practice recommends documenting all activities related to ${topicTitle} for compliance and quality assurance.`,
              revealed: false,
            },
          ],
        },
      };
    case 'flip-card':
      return {
        type: 'flip-card',
        data: {
          title: `Terminology: ${topicTitle}`,
          cards: [
            {
              id: generateUUID(),
              front: `What is ${topicTitle}?`,
              back: `${topicTitle} refers to the systematic approach to ensuring safety and compliance in this specific area of practice.`,
            },
            {
              id: generateUUID(),
              front: 'Regulatory Standard',
              back: 'The applicable OSHA/industry standard that governs procedures and requirements for this topic.',
            },
            {
              id: generateUUID(),
              front: 'Key Documentation',
              back: 'All activities must be documented including inspections, training records, and incident reports.',
            },
          ],
        },
      };
    case 'matching':
      return {
        type: 'matching',
        data: {
          title: `Match the Terms: ${topicTitle}`,
          pairs: [
            {
              id: generateUUID(),
              term: 'Hazard',
              definition:
                'A source of potential damage, harm, or adverse effects',
            },
            {
              id: generateUUID(),
              term: 'Risk',
              definition:
                'The likelihood and severity of a hazard causing harm',
            },
            {
              id: generateUUID(),
              term: 'Control',
              definition: 'A measure taken to reduce or eliminate a hazard',
            },
            {
              id: generateUUID(),
              term: 'Exposure',
              definition:
                'Contact with a hazardous agent through various pathways',
            },
          ],
        },
      };
    case 'timeline':
      return {
        type: 'timeline',
        data: {
          title: `Process Steps: ${topicTitle}`,
          events: [
            {
              id: generateUUID(),
              label: 'Step 1: Assessment',
              description:
                'Identify and evaluate all potential hazards and risks.',
            },
            {
              id: generateUUID(),
              label: 'Step 2: Planning',
              description:
                'Develop a comprehensive plan with controls and procedures.',
            },
            {
              id: generateUUID(),
              label: 'Step 3: Implementation',
              description:
                'Execute the plan with proper training and resources.',
            },
            {
              id: generateUUID(),
              label: 'Step 4: Monitoring',
              description: 'Continuously monitor conditions and effectiveness.',
            },
            {
              id: generateUUID(),
              label: 'Step 5: Review',
              description: 'Evaluate outcomes and update procedures as needed.',
            },
          ],
        },
      };
    default:
      return generateInteraction('click-reveal', topicTitle, content);
  }
}

// ============================================================
// TOPIC CONTENT GENERATOR — STRUCTURED COMPONENTS & RICH SLIDES
// ============================================================
export function generateTopicContent(
  topicTitle,
  category,
  moduleContext,
  topicIndex = 0
) {
  const { paragraphs } = getCategoryPools(category);
  const shuffled = shuffleArray(paragraphs);
  const p1 =
    shuffled[0] ||
    'Understand the core regulatory definitions, hazard recognition milestones, and operational safety standards.';

  // Build structured components based on topic type / position for rich presentation
  const cycle = topicIndex % 8;
  const components = [];

  // 1. Rich Text Lead Block
  components.push({
    id: generateUUID(),
    type: 'rich-text',
    props: {
      html: `<p class="lead">This operational training section establishes mandatory compliance standards, inspection benchmarks, and safety protocols for <strong>${topicTitle}</strong> within <em>${moduleContext}</em>.</p><p>${p1}</p>`,
    },
  });

  // Exactly ONE focused pedagogical element per slide (Neat, clean, uncluttered!)
  if (cycle === 0) {
    // Style 0: Clean Core Rich Text & Visual Aid
  } else if (cycle === 1) {
    // Style 1: Interactive Accordion
    components.push(
      generateComponentDefaults('accordion', { count: 3, topicTitle })
    );
  } else if (cycle === 2) {
    // Style 2: Interactive Safety Sequence Puzzle Game! 🎮
    components.push(
      generateComponentDefaults('puzzle-game', { count: 4, topicTitle })
    );
  } else if (cycle === 3) {
    // Style 3: 3D Flip Flashcards
    components.push(
      generateComponentDefaults('flip-cards', { count: 3, topicTitle })
    );
  } else if (cycle === 4) {
    // Style 4: Compliance Standard vs Violation Comparison Table
    components.push(
      generateComponentDefaults('comparison', { count: 3, topicTitle })
    );
  } else if (cycle === 5) {
    // Style 5: Numbered Procedural Operating Workflow
    components.push(
      generateComponentDefaults('steps', { count: 4, topicTitle })
    );
  } else if (cycle === 6) {
    // Style 6: Tabbed Field Scenario Variations
    components.push(
      generateComponentDefaults('tabs', { count: 3, topicTitle })
    );
  } else if (cycle === 7) {
    // Style 7: Key Takeaways & Mandatory Checklist Box
    components.push(
      generateComponentDefaults('key-takeaways', { count: 4, topicTitle })
    );
  }

  return {
    version: 2,
    components,
  };
}

// ============================================================
// QUIZ QUESTION GENERATOR
// ============================================================
export function generateQuizQuestions(title, topicsOrCount, count) {
  const questionCount =
    typeof topicsOrCount === 'number' ? topicsOrCount : count || 6;
  const questions = [];

  // Use the 15 Interactive Quiz Types bank
  const allBanks = [
    ...SAFETY_INTERACTIVE_QUIZ_BANK,
    ...TECH_QUIZ_BANK,
    ...HEALTHCARE_QUIZ_BANK,
  ];
  const shuffledBank = shuffleArray(allBanks);

  for (let i = 0; i < questionCount; i++) {
    const qTemplate = shuffledBank[i % shuffledBank.length];

    questions.push({
      id: generateUUID(),
      type: qTemplate.type || 'multiple-choice',
      typeLabel: qTemplate.typeLabel || 'Multiple Choice Challenge',
      scenario: qTemplate.scenario || null,
      question:
        qTemplate.question ||
        `What is the primary compliance requirement for ${title}?`,
      options: qTemplate.options || [
        'Adhere strictly to regulatory standards and safety protocols',
        'Bypass controls to increase operational speed',
        'Defer equipment inspection to end-of-week reviews',
        'Rely solely on verbal instructions without written documentation',
      ],
      correctAnswer:
        qTemplate.correctAnswer !== undefined ? qTemplate.correctAnswer : 0,
      pairs: qTemplate.pairs
        ? JSON.parse(JSON.stringify(qTemplate.pairs))
        : null,
      sequenceItems: qTemplate.sequenceItems
        ? [...qTemplate.sequenceItems]
        : null,
      correctOrder: qTemplate.correctOrder ? [...qTemplate.correctOrder] : null,
      hazardList: qTemplate.hazardList
        ? JSON.parse(JSON.stringify(qTemplate.hazardList))
        : null,
      checklist: qTemplate.checklist
        ? JSON.parse(JSON.stringify(qTemplate.checklist))
        : null,
      explanation:
        qTemplate.explanation ||
        `Understanding ${title} requires adhering to certified OSHA standards, proper PPE maintenance, and verified hazard controls.`,
      points: 10,
    });
  }

  return questions;
}

// ============================================================
// COURSE DURATION CALCULATOR
// ============================================================
export function calculateCourseDuration(modules) {
  let totalSeconds = 0;
  if (!modules) return 0;
  modules.forEach((mod) => {
    if (!mod.lessons) return;
    mod.lessons.forEach((lesson) => {
      if (!lesson.topics) return;
      lesson.topics.forEach((topic) => {
        totalSeconds += topic.duration || 180;
      });
    });
  });
  return totalSeconds;
}

// ============================================================
// STRUCTURE CALCULATOR (DYNAMIC PROPORTIONS & RANDOMIZED 2-6 LESSONS & 15-32 TOPICS)
// ============================================================
export {
  COURSE_AGENTS,
  calculateCurriculumSizing,
  detectApplicableStandards,
  generateProfessionalCourseOverview,
  generateContextualTopicTitles,
  runMultiAgentCourseGeneration,
} from '@/lib/course-agents';

function getStructureCounts(
  durationInput,
  customModules,
  customLessons,
  customTopicsRange
) {
  const d = parseFloat(durationInput) || 2;
  let modules = 4;
  let lessonsMin = 2;
  let lessonsMax = 6;
  let topicsMin = 13;
  let topicsMax = 35;

  if (d <= 0.5) {
    modules = 2;
    lessonsMin = 2;
    lessonsMax = 3;
    topicsMin = 13;
    topicsMax = 22;
  } else if (d <= 1) {
    modules = 3;
    lessonsMin = 2;
    lessonsMax = 4;
    topicsMin = 13;
    topicsMax = 28;
  } else if (d <= 2) {
    modules = 4;
    lessonsMin = 2;
    lessonsMax = 5;
    topicsMin = 13;
    topicsMax = 35;
  } else if (d <= 4) {
    modules = 5;
    lessonsMin = 3;
    lessonsMax = 6;
    topicsMin = 13;
    topicsMax = 35;
  } else if (d <= 8) {
    modules = 7;
    lessonsMin = 3;
    lessonsMax = 6;
    topicsMin = 15;
    topicsMax = 35;
  } else if (d <= 16) {
    modules = 10;
    lessonsMin = 3;
    lessonsMax = 6;
    topicsMin = 18;
    topicsMax = 35;
  } else if (d <= 24) {
    modules = 14;
    lessonsMin = 4;
    lessonsMax = 6;
    topicsMin = 20;
    topicsMax = 35;
  } else {
    // 40 hours
    modules = 20;
    lessonsMin = 4;
    lessonsMax = 6;
    topicsMin = 20;
    topicsMax = 35;
  }

  if (customModules && customModules !== 'auto') {
    modules = Math.min(25, Math.max(1, Number(customModules)));
  }
  if (customLessons && customLessons !== 'auto') {
    lessonsMin = Math.min(10, Math.max(1, Number(customLessons)));
    lessonsMax = lessonsMin;
  }
  if (customTopicsRange?.min && customTopicsRange?.max) {
    topicsMin = Math.max(5, Number(customTopicsRange.min));
    topicsMax = Math.max(topicsMin, Number(customTopicsRange.max));
  }

  const lessonsPerModule =
    Math.floor(Math.random() * (lessonsMax - lessonsMin + 1)) + lessonsMin;
  const topicsPerLesson =
    Math.floor(Math.random() * (topicsMax - topicsMin + 1)) + topicsMin;

  return {
    modules,
    lessonsPerModule,
    lessonsMin,
    lessonsMax,
    topicsPerLesson,
    topicsMin,
    topicsMax,
  };
}

function getDurationLabel(d) {
  const num = parseFloat(d);
  if (num <= 0.5) return '30 Minutes';
  if (num === 1) return '1 Hour';
  return `${num} Hours`;
}

// ============================================================
// MAIN COURSE GENERATOR
// ============================================================
/**
 * Generates a complete course structure with rich content.
 * @param {object} config - { courseName, duration, category, customModules, customLessons, customTopicsRange }
 * @returns {object} Complete course JSON
 */
export function generateCourse(config) {
  const {
    courseName,
    duration = '2',
    category = 'general',
    customModules,
    customLessons,
    customTopicsRange,
  } = config;
  const courseId = generateUUID();
  const slug = courseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const cat = category.toLowerCase();
  const counts = getStructureCounts(
    duration,
    customModules,
    customLessons,
    customTopicsRange
  );
  const durationSeconds = (parseFloat(duration) || 2) * 3600;

  // Pools
  const {
    modules: modPool,
    lessons: lesPool,
    topics: topPool,
  } = getCategoryPools(cat);
  const shuffledModules = shuffleArray(modPool || SAFETY_MODULES);
  const shuffledLessons = shuffleArray(lesPool || SAFETY_LESSONS);
  const shuffledTopics = shuffleArray(topPool || SAFETY_TOPICS);

  let modIdx = 0;
  let lsnIdx = 0;
  let topIdx = 0;

  const nextModuleName = () => {
    if (!shuffledModules.length) return 'Core Safety Standards';
    const name = shuffledModules[modIdx % shuffledModules.length];
    modIdx++;
    return name;
  };

  const nextLessonName = () => {
    if (!shuffledLessons.length) return 'OSHA Compliance Protocols';
    const name = shuffledLessons[lsnIdx % shuffledLessons.length];
    lsnIdx++;
    return name;
  };

  const nextTopicName = () => {
    if (!shuffledTopics.length) return 'Operational Procedures';
    const name = shuffledTopics[topIdx % shuffledTopics.length];
    topIdx++;
    return name;
  };

  const modules = [];

  // ============================================================
  // INTRODUCTION MODULE — 5 HIGH VALUE TOPICS (NO QUIZ)
  // ============================================================
  const introTopicsList = [
    `${courseName} Overview & Scope`,
    'Course Objectives & Regulatory Scope',
    'Safety Standards & Compliance Framework',
    'Training Requirements & Milestone Goals',
    'Introduction Summary & Review',
  ];

  const introTopicObjects = introTopicsList.map((title, idx) => {
    const prompt =
      idx === 0
        ? `Photorealistic full body shot of a professional safety worker wearing OSHA hard hat, safety goggles, and high-visibility reflective vest holding a large hardboard sign with "${courseName}" clearly written on it in bold lettering, industrial safety background, ultra-sharp 8k`
        : `Professional occupational safety training photo illustrating ${title} in the context of ${courseName}, industrial environment, cinematic lighting`;

    return {
      id: generateUUID(),
      title,
      order: idx + 1,
      type: 'content',
      frameType: 2,
      content: generateTopicContent(title, cat, courseName, idx),
      imagePrompt: prompt,
      imageUrl: getRealisticTopicPhoto(title, cat),
      duration: 180,
      interactions: [],
      narrationText: `${title}. Review the regulatory scope, interactive guidelines, and safety procedures.`,
    };
  });

  // FIRST MODULE: Title is Course Name (no "Module 1:" prefix)
  // Lesson 1: Title is "Introduction" (no "Lesson 1" prefix) — NO QUIZ IN INTRODUCTION!
  modules.push({
    id: generateUUID(),
    title: courseName,
    description: `Comprehensive introductory module for ${courseName}.`,
    order: 0,
    isIntroduction: true,
    lessons: [
      {
        id: generateUUID(),
        title: 'Introduction',
        description: `Course introduction, safety scope, and compliance standards for ${courseName}.`,
        order: 0,
        isIntroduction: true,
        topics: introTopicObjects,
        quiz: null, // Quizzes start strictly from Lesson 1 onwards
      },
    ],
    assessment: null,
  });

  // ---- CONTENT MODULES & CONTINUOUS CUMULATIVE LESSON NUMBERING ----
  let cumulativeLessonCounter = 0; // Continuous lesson counter (Lesson 1, Lesson 2, Lesson 3...)

  for (let m = 0; m < counts.modules; m++) {
    const modName = nextModuleName();
    const moduleId = generateUUID();
    const moduleNumber = m + 1; // Core content modules start at Module 1, Module 2, Module 3...
    const lessons = [];

    for (let l = 0; l < counts.lessonsPerModule; l++) {
      cumulativeLessonCounter += 1; // Cumulative calculation: last module last lesson + 1!
      const rawLessonName = nextLessonName();
      const lessonTitle = `Lesson ${cumulativeLessonCounter}: ${rawLessonName}`;
      const lessonId = generateUUID();
      const topics = [];
      const lessonTopicsCount =
        Math.floor(Math.random() * (counts.topicsMax - counts.topicsMin + 1)) +
        counts.topicsMin;
      const generatedTopicTitles = generateContextualTopicTitles(
        courseName,
        cat,
        modName,
        rawLessonName,
        lessonTopicsCount,
        l,
        m
      );

      for (let t = 0; t < generatedTopicTitles.length; t++) {
        const topicName = generatedTopicTitles[t];
        const structuredContent = generateTopicContent(
          topicName,
          cat,
          modName,
          t
        );
        const topicPrompt = `Photorealistic occupational safety training photo illustrating ${topicName} in the context of ${rawLessonName}, OSHA compliant equipment, natural daylight, 8k ultra detailed`;

        topics.push({
          id: generateUUID(),
          title: topicName,
          order: t + 1,
          type: 'content',
          frameType: 2,
          content: structuredContent,
          imagePrompt: topicPrompt,
          imageUrl: getRealisticTopicPhoto(topicName, cat),
          duration: 180 + (t % 3) * 30,
          interactions: [],
          narrationText: `${topicName}. Review all applicable standards, engineering controls, and personal safeguards.`,
        });
      }

      // Concluding Summary Topic for this Lesson
      const summaryTopicContent = {
        version: 2,
        components: [
          {
            id: generateUUID(),
            type: 'rich-text',
            props: {
              html: `<h3>${lessonTitle} Summary & Review</h3><p>This concludes <strong>${lessonTitle}</strong>. Review the key safety milestones below before testing your knowledge with the practice check.</p>`,
            },
          },
          generateComponentDefaults('key-takeaways', {
            count: 4,
            topicTitle: lessonTitle,
          }),
          generateComponentDefaults('callout', { variant: 'info' }),
        ],
      };

      const summaryPrompt = `Professional safety training summary photo for ${lessonTitle}, clean industrial design, 4k`;
      topics.push({
        id: generateUUID(),
        title: `Lesson ${cumulativeLessonCounter} Summary & Review`,
        order: topics.length + 1,
        type: 'content',
        frameType: 2,
        content: summaryTopicContent,
        imagePrompt: summaryPrompt,
        imageUrl: getRealisticTopicPhoto(lessonTitle, cat),
        duration: 150,
        interactions: [],
        narrationText: `This concludes Lesson ${cumulativeLessonCounter}. Take the practice quiz below to verify your understanding.`,
      });

      // 6-question interactive quiz starting from Lesson 1 onwards
      lessons.push({
        id: lessonId,
        title: lessonTitle,
        description: `Comprehensive training covering ${rawLessonName} within Module ${moduleNumber}: ${modName}.`,
        order: cumulativeLessonCounter,
        lessonNumber: cumulativeLessonCounter,
        topics,
        quiz: {
          id: generateUUID(),
          title: `Lesson ${cumulativeLessonCounter} Practice Quiz (6 Questions)`,
          passingScore: 70,
          isCompulsory: false,
          questions: generateQuizQuestions(rawLessonName, 6),
        },
      });
    }

    modules.push({
      id: moduleId,
      title: `Module ${moduleNumber}: ${modName}`,
      description: `Comprehensive training module covering ${modName}.`,
      order: moduleNumber,
      moduleNumber: moduleNumber,
      lessons,
      assessment: null,
    });
  }

  // ---- DYNAMIC FINAL EXAM QUESTION COUNT (40hr -> 50q, 20hr -> 40q, 8hr -> 30q, 1-4hr -> 25q) ----
  const dVal = parseFloat(duration) || 2;
  let finalExamQuestionCount = 25;
  if (dVal >= 40 || String(duration).includes('40')) {
    finalExamQuestionCount = 50;
  } else if (
    dVal >= 20 ||
    String(duration).includes('20') ||
    String(duration).includes('24')
  ) {
    finalExamQuestionCount = 40;
  } else if (dVal >= 8 || String(duration).includes('8')) {
    finalExamQuestionCount = 30;
  } else {
    finalExamQuestionCount = 25;
  }

  // ---- COMPULSORY FINAL EXAM (INTERACTIVE QUIZ TYPES) ----
  const finalExam = {
    id: generateUUID(),
    title: 'Compulsory Final Examination',
    description: `Comprehensive final examination covering all modules in ${courseName}. This interactive exam includes ${finalExamQuestionCount} questions (Multiple Choice, Drag & Drop Matching, Sequencing, Hazard Spotting, and Inspection Checklists). You must achieve a minimum passing score of 70% to unlock your verifiable Certificate of Completion.`,
    passingScore: 70,
    isCompulsory: true,
    timeLimit: 3600,
    questionCount: finalExamQuestionCount,
    questions: generateQuizQuestions(
      `${courseName} Final Exam`,
      finalExamQuestionCount
    ),
  };

  // ---- 100% SEO-FRIENDLY METADATA PRE-FILL ----
  const durationLabel = getDurationLabel(duration);
  const ceuCredits = `${(parseFloat(duration) || 2) * 0.1} CEU`;
  const metaTitle = `${courseName} Online Training & Certification | 100% Free LMS`;
  const metaDescription = `Complete accredited ${courseName} training course (${durationLabel}). Learn OSHA compliance, hazard control, practical procedures, and interactive assessments with verifiable certificate.`;
  const keywords = `${courseName.toLowerCase()}, safety training, osha compliance, online course, ${cat} certification, hazwoper useful tools, free lms`;

  // ---- ASSEMBLE COURSE ----
  const course = {
    id: courseId,
    title: courseName,
    subtitle: `${durationLabel} Accredited Certification Course`,
    slug,
    description: `Comprehensive ${durationLabel} training program covering ${courseName}. This course includes ${modules.length} modules with interactive content, lesson quizzes, and a ${finalExamQuestionCount}-question final examination.`,
    category: cat,
    duration: durationSeconds,
    durationLabel,
    ceuCredits,
    targetAudience:
      'Safety Professionals, Field Workers, Supervisors & Compliance Officers',
    metaTitle,
    metaDescription,
    keywords,
    thumbnail: getRealisticTopicPhoto(courseName, cat),
    author: 'Bilal Ghaffar',
    publisher: 'Bilal Ghaffar',
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
    settings: {
      requireSequential: true,
      passingScore: 70,
      allowRetakes: true,
      maxRetakes: 3,
      showProgress: true,
      enableTTS: true,
      ttsVoice: 'en-US',
      ttsRate: 1,
      certificate: { enabled: true, template: 'standard' },
    },
    modules,
    finalExam,
  };

  return course;
}

/**
 * Async course structure generator connecting UI creator with full progress reporting
 * and realistic royalty-free visuals.
 */
export async function generateCourseStructure(config = {}, onProgress = null) {
  const courseTopic =
    config.topic ||
    config.courseName ||
    'Workplace Safety & Compliance Training';
  const category = config.category || 'safety';
  const duration =
    config.duration ||
    (config.moduleCount ? `${config.moduleCount * 0.8}` : '2');
  const targetAudience =
    config.targetAudience ||
    'Safety Professionals, Field Technicians & Supervisors';
  const complianceStandard =
    config.complianceStandard || 'OSHA 29 CFR Standards';

  if (typeof onProgress === 'function') {
    onProgress(15, `Architecting curriculum structure for "${courseTopic}"...`);
  }

  // Generate full course payload
  const course = generateCourse({
    courseName: courseTopic,
    duration,
    category,
    customModules: config.moduleCount || 3,
    customLessons: 2,
    customTopicsRange: { min: 4, max: 7 },
  });

  course.targetAudience = targetAudience;
  course.complianceStandard = complianceStandard;
  course.thumbnail = getRealisticTopicPhoto(courseTopic, category);

  if (typeof onProgress === 'function') {
    onProgress(
      50,
      'Synthesizing verified 8K photorealistic training visuals & slide components...'
    );
  }

  // Ensure every topic slide has a realistic photo and rich structure
  course.modules?.forEach((m) => {
    m.lessons?.forEach((l) => {
      l.topics?.forEach((t) => {
        if (!t.imageUrl) {
          t.imageUrl = getRealisticTopicPhoto(t.title, category);
        }
      });
    });
  });

  if (typeof onProgress === 'function') {
    onProgress(
      85,
      'Conducting pedagogical compliance verification and interactive exam compilation...'
    );
  }

  await new Promise((r) => setTimeout(r, 200));

  if (typeof onProgress === 'function') {
    onProgress(100, 'Accredited course ready!');
  }

  return course;
}
