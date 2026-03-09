export interface MockSection {
  title: string;
  icon: string;
  items: { image: string; title: string; description: string }[];
}

const TEXTILE_IMAGES = {
  fabric: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=300&fit=crop',
  cotton: 'https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=400&h=300&fit=crop',
  recycling: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&h=300&fit=crop',
  factory: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
  sewing: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop',
  yarn: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=300&fit=crop',
  warehouse: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop',
  sorting: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=400&h=300&fit=crop',
};

export const COVER_IMAGES: Record<string, string> = {
  brand_retailer: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&h=400&fit=crop',
  producer: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=1200&h=400&fit=crop',
  facility_factory_supplier_vendor: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=400&fit=crop',
  collector_sorter: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1200&h=400&fit=crop',
  recycler: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=1200&h=400&fit=crop',
  default: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&h=400&fit=crop',
};

const BRAND_SECTIONS: MockSection[] = [
  {
    title: 'Product Showcase',
    icon: '🏷️',
    items: [
      { image: TEXTILE_IMAGES.fabric, title: 'Organic Cotton T-Shirts', description: 'GOTS certified, 180gsm jersey knit' },
      { image: TEXTILE_IMAGES.yarn, title: 'Recycled Polyester Jackets', description: 'Made from 100% post-consumer PET bottles' },
      { image: TEXTILE_IMAGES.sewing, title: 'Linen Blend Trousers', description: 'European flax, naturally dyed' },
    ],
  },
];

const PRODUCER_SECTIONS: MockSection[] = [
  {
    title: 'Machines & Facilities',
    icon: '🏭',
    items: [
      { image: TEXTILE_IMAGES.factory, title: 'Circular Knitting Line', description: 'Capacity: 500kg/day, certified ISO 14001' },
      { image: TEXTILE_IMAGES.sewing, title: 'Cut & Sew Workshop', description: '12 industrial machines, small-batch production' },
      { image: TEXTILE_IMAGES.warehouse, title: 'Dyeing Unit', description: 'Low-water dyeing, OEKO-TEX certified' },
    ],
  },
  {
    title: 'Skills & Services',
    icon: '⚡',
    items: [
      { image: TEXTILE_IMAGES.yarn, title: 'Yarn Spinning', description: 'Ring & open-end spinning, 10-60 Ne' },
      { image: TEXTILE_IMAGES.fabric, title: 'Fabric Finishing', description: 'Mercerizing, sanforizing, calendering' },
    ],
  },
];

const RECYCLER_SECTIONS: MockSection[] = [
  {
    title: 'Processing Capacities',
    icon: '♻️',
    items: [
      { image: TEXTILE_IMAGES.recycling, title: 'Mechanical Recycling', description: '200 tonnes/month, cotton & polyester blends' },
      { image: TEXTILE_IMAGES.factory, title: 'Fiber Opening Line', description: 'Post-consumer textiles to recycled fibers' },
    ],
  },
  {
    title: 'Materials Accepted',
    icon: '📦',
    items: [
      { image: TEXTILE_IMAGES.sorting, title: 'Post-Consumer Textiles', description: 'Sorted & unsorted, min 1 tonne lots' },
      { image: TEXTILE_IMAGES.cotton, title: 'Production Waste', description: 'Cutting scraps, yarn waste, selvedge' },
      { image: TEXTILE_IMAGES.fabric, title: 'Industrial Wipes', description: 'Used wipers & cleaning cloths' },
    ],
  },
];

const LOOKING_FOR: MockSection = {
  title: 'Looking for',
  icon: '🔍',
  items: [
    { image: '', title: 'Recycled fibers supplier', description: 'Looking for post-consumer recycled cotton & polyester fibers' },
    { image: '', title: 'Collaboration partners', description: 'Open to R&D partnerships on circular textile solutions' },
    { image: '', title: 'Waste collection services', description: 'Seeking reliable textile waste collection in Europe' },
  ],
};

export function getMockSections(kind: string | null): MockSection[] {
  const sections: MockSection[] = [];

  switch (kind) {
    case 'brand_retailer':
    case 'designer':
      sections.push(...BRAND_SECTIONS);
      break;
    case 'producer':
    case 'facility_factory_supplier_vendor':
      sections.push(...PRODUCER_SECTIONS);
      break;
    case 'recycler':
    case 'collector_sorter':
      sections.push(...RECYCLER_SECTIONS);
      break;
    default:
      sections.push(BRAND_SECTIONS[0]);
      break;
  }

  sections.push(LOOKING_FOR);
  return sections;
}
