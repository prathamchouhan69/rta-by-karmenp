export const REFERENCE_NAMES = `Immortal Jellyfish, Tardigrade, Tardigrade Cryptobiosis, Mantis Shrimp Punch, Mantis Shrimp Vision, Peacock Mantis Shrimp Club, Bombardier Beetle, Electric Eel, Electric Eel Hunting, Anglerfish Lure, Deep-Sea Anglerfish Males, Barreleye Fish, Dragonfish Black Skin, Dragonfish Transparent Teeth, Vampire Squid, Giant Siphonophore, Siphonophore Length, Comb Jelly Rainbow Light, Comb Jelly Ancient Lineage, Box Jellyfish Eyes, Hydra Regeneration, Planarian Regeneration, Planarian Memory, Axolotl Regeneration, Axolotl Transplants, Deer Antler Regrowth, Sea Star Regeneration, Sea Cucumber Organ Ejection, Lizard Tail Autotomy, Octopus Arm Regrowth, Octopus RNA Editing, Cuttlefish Camouflage, Cuttlefish Colorblind Camouflage, Mimic Octopus, Chameleon Tongue, Gecko Feet, Basilisk Lizard, Flying Fish, Mudskipper, Saharan Silver Ant, Namib Desert Beetle, Naked Mole Rat, Antarctic Icefish, Icefish Antifreeze Blood, Arctic Woolly Bear Caterpillar, Wood Frog Freeze Tolerance, Painted Turtle Oxygen-Free Survival, Brine Shrimp Cysts, Resurrection Plant, Desert Snail Aestivation, Spiny Mouse Regeneration, Zebrafish Heart Repair, Salamander Retina Regrowth, High-Altitude Deer Mice, Tibetan Adaptation, Bioluminescent Plankton, Bioluminescent Bay, Milky Sea, Firefly Squid, Foxfire Fungus, Ghost Mushroom, Deep-Sea Bioluminescence, Anglerfish Bacterial Symbiosis, Lanternfish Light Show, Synchronous Fireflies, Coral Spawning, Horseshoe Crab, Horseshoe Crab Blood, Coelacanth, Tuatara Third Eye, Ginkgo Survivor Tree, Welwitschia, Pando, Armillaria Fungus, Mycorrhizal Network, Slime Mold Maze Solving, Slime Mold Memory, Ant Colony Intelligence, Termite Mound Climate Control, Weaver Bird Nest, Bowerbird Gallery, Lyrebird Mimicry, Bird-of-Paradise Display, Peacock Spider Dance, Orchid Mantis, Ophrys Orchid Mimicry, Corpse Flower, Fig-Wasp Coevolution, Cordyceps Control, Parasitic Wasp Mind Control, Sacculina Barnacle, Toxoplasma Behavior Change, Viral Gene Insertion, Cyanobacteria Oxygen Revolution, Hydrothermal Vent Life, Chemosynthesis, Giant Tube Worm, Yeti Crab Farming, Whale Fall Ecosystem, Brinicle, Underwater Brine Lake, Methane Seep Ecosystem, Deep Subsurface Microbes, Rock-Deep Microbes, Extremophile Life, Fibonacci Spiral, Golden Angle Phyllotaxis, Romanesco Fractal, Natural Fractal Branching, Starling Murmuration, Honeybee Waggle Dance, Tesla Coil Arcs, Rotating Magnetic Field, Wireless Power Transmission, Resonance, Plasma Globe Filaments, High-Frequency Discharge, Schrodinger's Cat, EPR Paradox, Quantum Zeno Effect, Double-Slit Experiment, Delayed-Choice Experiment, Quantum Eraser, Quantum Entanglement, Quantum Superposition, Quantum Tunneling, Heisenberg Uncertainty Principle, Wave-Particle Duality, Quantum Probability Cloud, Bose-Einstein Condensate, Superfluid Helium, Superconductor Meissner Effect, Antimatter Annihilation, Neutrino Passage, Time Dilation, Twin Paradox, Length Contraction, Relativity of Simultaneity, Gravitational Lensing, Black Hole Event Horizon, Spaghettification, Gravitational Waves, Black Hole Merger, Neutron Star Density, Pulsar Lighthouse, Magnetar, Hawking Radiation, Information Paradox, Cosmological Horizon, Dark Matter, Dark Energy, Fast Radio Burst, Cosmic Microwave Background, Saturn Hexagon, Diamond Rain, Enceladus Geysers, Europa Subsurface Ocean, Titan Methane Lakes, Rogue Planet, Zeno's Achilles Paradox, Zeno's Dichotomy Paradox, Russell's Paradox, Banach-Tarski Paradox, Cantor's Infinity, Hilbert's Hotel, Godel Incompleteness, Halting Problem, Simpson's Paradox, Four Color Theorem`.split(', ');

export const CHART_NAMES = `KPI Scorecard, Revenue Trend Line, Profit & Loss Waterfall, Cash-Flow Chart, Cash-Flow Forecast, Sales Funnel Chart, Customer Cohort Retention Chart, Unit Economics Chart, Department Budget vs Actual Chart, Employee Productivity Chart, OKR Progress Chart, Inventory Turnover Chart, Customer Lifetime Value Chart, Gantt Chart, S-Curve, Cash-Flow S-Curve, Earned Value Chart, Resource Histogram, Material Consumption Chart, Productivity Chart, Quality-Control Chart, Safety Incident Chart, Delay Analysis Chart, Progress Payment Chart, Equipment Utilization Chart, Income Statement Waterfall, Accounts-Receivable Aging Chart, Accounts-Payable Aging Chart, Budget vs Actual Chart, Expense Breakdown Donut, Profit-Margin Trend Chart, Working-Capital Chart, Debt-to-Equity Trend Chart, Tax Provision Chart, Bank Reconciliation Status Chart, Fixed-Asset Depreciation Chart, Risk Concentration Chart, On-Time Delivery Chart, Fleet Utilization Chart, Cost per Mile/Kilometer Chart, Delivery Performance Chart, Route Efficiency Chart, Driver Performance Chart, Vehicle Maintenance Chart, Fuel Consumption Chart, Load Capacity Chart, Shipment Status Chart, Carrier Performance Chart, Transportation Cost Trend Chart, Headcount Trend Chart, Hiring Funnel Chart, Time-to-Hire Chart, Attrition Chart, Retention Cohort Chart, Attendance and Absence Chart, Performance Distribution Chart, Payroll Cost Chart, Training Completion Chart, Overtime Chart, Diversity Chart, Succession Coverage Chart, Sales Pipeline Chart, Lead-Source Chart, Referral Source Chart, Win-Loss Chart, Customer Health Score Chart, Customer Retention Chart, Customer Lifetime Value Chart, Account Growth Chart, Complaint and Resolution Chart, Meeting and Follow-Up Chart, Partner Performance Chart, Net Promoter Score Chart, Renewal and Churn Chart, Sync Health Chart, System Health Chart, System Performance Chart, Activity Trend Chart, Alert Trend Chart, Notification Trend Chart, Audit History Chart, Recovery History Chart, Deletion History Chart, Storage Usage Chart, Data Growth Chart, File Network Graph, Template Usage Chart, Data Quality Chart, Access Control Chart, Integration Status Chart, Automation Performance Chart, Task Distribution Chart, Task Status Chart, Task Completion Chart, Task Due Trend Chart`.split(', ');

export const VISUAL_FAMILIES = [
  'Cinematic reveal',
  'Interactive model',
  'Motion loop',
  'Infographic',
  'UI concept',
] as const;

const referenceGroups = [
  [9, 'Survivors & resilience'],
  [20, 'Deep-sea life'],
  [31, 'Regeneration & repair'],
  [39, 'Camouflage & adaptation'],
  [55, 'Extreme environments'],
  [66, 'Living light'],
  [111, 'Networks & natural systems'],
  [148, 'Physics & quantum ideas'],
  [169, 'Cosmos & paradoxes'],
] as const;

const chartGroups = [
  [13, 'Core metrics & customers'],
  [25, 'Projects & delivery'],
  [37, 'Finance'],
  [50, 'Fleet & logistics'],
  [62, 'People'],
  [75, 'Sales & relationships'],
  [95, 'Platform & operations'],
] as const;

const guideOptions: Record<string, string> = {
  'Immortal Jellyfish': 'Option E · Vendor Path',
  Tardigrade: 'Option B · Health Dot',
  'Mantis Shrimp Punch': 'Option B · Deficit Embers',
  'Anglerfish Lure': 'Option A · Target Bar',
  'Dragonfish Black Skin': 'Option E · Payment Ripple',
  'Hydra Regeneration': 'Option D · Margin Donut',
  'Axolotl Regeneration': 'Option D · Alert Pulse',
  'Cuttlefish Camouflage': 'Option E · Stacked Receipts',
  'Gecko Feet': 'Option C · Anomaly Matrix',
  'Saharan Silver Ant': 'Option A · Frosted Ledger',
  'Wood Frog Freeze Tolerance': 'Option D · Filled Liability',
  'Bioluminescent Plankton': 'Option E · Twin Asset Radar',
  'Synchronous Fireflies': 'Option A · Merger Dance',
  'Mycorrhizal Network': 'Option C · Sync Pill',
  'Slime Mold Maze Solving': 'Option A · Dual Ledger',
  'Fibonacci Spiral': 'Option B · Bar Growth',
  "Schrodinger's Cat": 'Option A · Dual Ledger',
  'Quantum Entanglement': 'Option C · Cycle Circuit',
  'Black Hole Event Horizon': 'Option B · Market Radar',
  'Dark Energy': 'Option C · Net Tide',
  "Hilbert's Hotel": 'Option D · Stacked Receipts',
};

function groupFor<T extends readonly (readonly [number, string])[]>(groups: T, ordinal: number) {
  return groups.find(([lastOrdinal]) => ordinal <= lastOrdinal)?.[1] ?? 'Other';
}

export const references = REFERENCE_NAMES.map((name, index) => {
  const ordinal = index + 1;
  return {
    id: `ref-${String(ordinal).padStart(3, '0')}`,
    ordinal,
    name,
    category: groupFor(referenceGroups, ordinal),
    guideOption: guideOptions[name],
  };
});

export const charts = CHART_NAMES.map((name, index) => {
  const ordinal = index + 1;
  const connected = name === 'Cash-Flow Chart' || name === 'Accounts-Receivable Aging Chart' || name === 'Task Status Chart';
  return {
    id: `chart-${String(ordinal).padStart(3, '0')}`,
    ordinal,
    name,
    category: groupFor(chartGroups, ordinal),
    source: name === 'Cash-Flow Chart'
      ? 'GET /v1/finance/cash-flow'
      : name === 'Accounts-Receivable Aging Chart'
        ? 'GET /v1/briefing/today'
        : name === 'Task Status Chart'
          ? 'GET /v1/tasks'
          : undefined,
    href: name === 'Cash-Flow Chart'
      ? '/cash-flow'
      : name === 'Accounts-Receivable Aging Chart'
        ? `/charts/chart-${String(ordinal).padStart(3, '0')}`
        : name === 'Task Status Chart'
          ? '/tasks'
          : undefined,
    connected,
  };
});

export const referenceVisuals = references.flatMap((reference) =>
  VISUAL_FAMILIES.map((family, index) => ({
    id: `${reference.id}-option-${index + 1}`,
    referenceId: reference.id,
    family,
    index,
  })),
);

if (
  references.length !== 169
  || charts.length !== 95
  || referenceVisuals.length !== 845
  || new Set(references.map(({ id }) => id)).size !== 169
  || new Set(charts.map(({ id }) => id)).size !== 95
  || new Set(referenceVisuals.map(({ id }) => id)).size !== 845
) {
  throw new Error('Reference/chart inventory count or stable-ID assertion failed.');
}

export const INVENTORY_COUNTS = {
  references: references.length,
  charts: charts.length,
  visualOptions: referenceVisuals.length,
} as const;
