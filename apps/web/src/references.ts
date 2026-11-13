export interface Reference {
  id: number;
  name: string;
  category: "Nature" | "Tesla" | "Physics" | "Math";
  scientific: string;
  natureMeaning: string;
  appMeaning: string;
  module: string;
  chart: string;
  motion: string;
}

const names: [string, Reference["category"]][] = [
  ["Immortal Jellyfish","Nature"],["Tardigrade","Nature"],["Tardigrade Cryptobiosis","Nature"],["Mantis Shrimp Punch","Nature"],["Mantis Shrimp Vision","Nature"],["Peacock Mantis Shrimp Club","Nature"],["Bombardier Beetle","Nature"],["Electric Eel","Nature"],["Electric Eel Hunting","Nature"],["Anglerfish Lure","Nature"],
  ["Deep-Sea Anglerfish Males","Nature"],["Barreleye Fish","Nature"],["Dragonfish Black Skin","Nature"],["Dragonfish Transparent Teeth","Nature"],["Vampire Squid","Nature"],["Giant Siphonophore","Nature"],["Siphonophore Length","Nature"],["Comb Jelly Rainbow Light","Nature"],["Comb Jelly Ancient Lineage","Nature"],["Box Jellyfish Eyes","Nature"],
  ["Hydra Regeneration","Nature"],["Planarian Regeneration","Nature"],["Planarian Memory","Nature"],["Axolotl Regeneration","Nature"],["Axolotl Transplants","Nature"],["Deer Antler Regrowth","Nature"],["Sea Star Regeneration","Nature"],["Sea Cucumber Organ Ejection","Nature"],["Lizard Tail Autotomy","Nature"],["Octopus Arm Regrowth","Nature"],
  ["Octopus RNA Editing","Nature"],["Cuttlefish Camouflage","Nature"],["Cuttlefish Colorblind Camouflage","Nature"],["Mimic Octopus","Nature"],["Chameleon Tongue","Nature"],["Gecko Feet","Nature"],["Basilisk Lizard","Nature"],["Flying Fish","Nature"],["Mudskipper","Nature"],["Saharan Silver Ant","Nature"],
  ["Namib Desert Beetle","Nature"],["Naked Mole Rat","Nature"],["Antarctic Icefish","Nature"],["Icefish Antifreeze Blood","Nature"],["Arctic Woolly Bear Caterpillar","Nature"],["Wood Frog Freeze Tolerance","Nature"],["Painted Turtle Oxygen-Free Survival","Nature"],["Brine Shrimp Cysts","Nature"],["Resurrection Plant","Nature"],["Desert Snail Aestivation","Nature"],
  ["Spiny Mouse Regeneration","Nature"],["Zebrafish Heart Repair","Nature"],["Salamander Retina Regrowth","Nature"],["High-Altitude Deer Mice","Nature"],["Tibetan Adaptation","Nature"],["Bioluminescent Plankton","Nature"],["Bioluminescent Bay","Nature"],["Milky Sea","Nature"],["Firefly Squid","Nature"],["Foxfire Fungus","Nature"],
  ["Ghost Mushroom","Nature"],["Deep-Sea Bioluminescence","Nature"],["Anglerfish Bacterial Symbiosis","Nature"],["Lanternfish Light Show","Nature"],["Synchronous Fireflies","Nature"],["Coral Spawning","Nature"],["Horseshoe Crab","Nature"],["Horseshoe Crab Blood","Nature"],["Coelacanth","Nature"],["Tuatara Third Eye","Nature"],
  ["Ginkgo Survivor Tree","Nature"],["Welwitschia","Nature"],["Pando","Nature"],["Armillaria Fungus","Nature"],["Mycorrhizal Network","Nature"],["Slime Mold Maze Solving","Nature"],["Slime Mold Memory","Nature"],["Ant Colony Intelligence","Nature"],["Termite Mound Climate Control","Nature"],["Weaver Bird Nest","Nature"],
  ["Bowerbird Gallery","Nature"],["Lyrebird Mimicry","Nature"],["Bird-of-Paradise Display","Nature"],["Peacock Spider Dance","Nature"],["Orchid Mantis","Nature"],["Ophrys Orchid Mimicry","Nature"],["Corpse Flower","Nature"],["Fig-Wasp Coevolution","Nature"],["Cordyceps Control","Nature"],["Parasitic Wasp Mind Control","Nature"],
  ["Sacculina Barnacle","Nature"],["Toxoplasma Behavior Change","Nature"],["Viral Gene Insertion","Nature"],["Cyanobacteria Oxygen Revolution","Nature"],["Hydrothermal Vent Life","Nature"],["Chemosynthesis","Nature"],["Giant Tube Worm","Nature"],["Yeti Crab Farming","Nature"],["Whale Fall Ecosystem","Nature"],["Brinicle","Nature"],
  ["Underwater Brine Lake","Nature"],["Methane Seep Ecosystem","Nature"],["Deep Subsurface Microbes","Nature"],["Rock-Deep Microbes","Nature"],["Extremophile Life","Nature"],["Fibonacci Spiral","Math"],["Golden Angle Phyllotaxis","Math"],["Romanesco Fractal","Math"],["Natural Fractal Branching","Math"],["Starling Murmuration","Nature"],
  ["Honeybee Waggle Dance","Nature"],["Tesla Coil Arcs","Tesla"],["Rotating Magnetic Field","Tesla"],["Wireless Power Transmission","Tesla"],["Resonance","Tesla"],["Plasma Globe Filaments","Tesla"],["High-Frequency Discharge","Tesla"],["Schrodinger's Cat","Physics"],["EPR Paradox","Physics"],["Quantum Zeno Effect","Physics"],
  ["Double-Slit Experiment","Physics"],["Delayed-Choice Experiment","Physics"],["Quantum Eraser","Physics"],["Quantum Entanglement","Physics"],["Quantum Superposition","Physics"],["Quantum Tunneling","Physics"],["Heisenberg Uncertainty Principle","Physics"],["Wave-Particle Duality","Physics"],["Quantum Probability Cloud","Physics"],["Bose-Einstein Condensate","Physics"],
  ["Superfluid Helium","Physics"],["Superconductor Meissner Effect","Physics"],["Antimatter Annihilation","Physics"],["Neutrino Passage","Physics"],["Time Dilation","Physics"],["Twin Paradox","Physics"],["Length Contraction","Physics"],["Relativity of Simultaneity","Physics"],["Gravitational Lensing","Physics"],["Black Hole Event Horizon","Physics"],
  ["Spaghettification","Physics"],["Gravitational Waves","Physics"],["Black Hole Merger","Physics"],["Neutron Star Density","Physics"],["Pulsar Lighthouse","Physics"],["Magnetar","Physics"],["Hawking Radiation","Physics"],["Information Paradox","Physics"],["Cosmological Horizon","Physics"],["Dark Matter","Physics"],
  ["Dark Energy","Physics"],["Fast Radio Burst","Physics"],["Cosmic Microwave Background","Physics"],["Saturn Hexagon","Physics"],["Diamond Rain","Physics"],["Enceladus Geysers","Physics"],["Europa Subsurface Ocean","Physics"],["Titan Methane Lakes","Physics"],["Rogue Planet","Physics"],["Zeno's Achilles Paradox","Math"],
  ["Zeno's Dichotomy Paradox","Math"],["Russell's Paradox","Math"],["Banach-Tarski Paradox","Math"],["Cantor's Infinity","Math"],["Hilbert's Hotel","Math"],["Godel Incompleteness","Math"],["Halting Problem","Math"],["Simpson's Paradox","Math"],["Four Color Theorem","Math"],
];

export const references: Reference[] = names.map(([name, category], i) => ({
  id: i + 1,
  name,
  category,
  scientific: `${name} — a natural phenomenon inspiring resilient, adaptive systems.`,
  natureMeaning: `Nature demonstrates ${name.toLowerCase()} as a model of survival and efficiency.`,
  appMeaning: `In RTA by KARM, ${name} informs module behavior and visual language.`,
  module: category === "Math" ? "Data" : category === "Physics" ? "System" : "Business OS",
  chart: "KPI Scorecard",
  motion: "subtle pulse on interaction",
}));
