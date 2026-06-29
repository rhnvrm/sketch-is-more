export const totalPages = 136;

export const pagePath = (page, size = "large") => `./public/book/${size}/${page}.webp`;

export const physicalSpreads = [
  { pages: [4, 5] },
  { pages: [8, 9] },
  { pages: [20, 21] },
  { pages: [32, 33] },
  { pages: [42, 43] },
  { pages: [66, 67] },
  { pages: [70, 71] },
];

export const chapters = [
  {
    key: "opening",
    title: "Opening / Sanctuary",
    range: [1, 20],
    note: "The sketch book has been my sanctuary for almost my entire life thus far.",
  },
  {
    key: "journey",
    title: "Journey",
    range: [21, 36],
    note: "Sketches from architecture school and the start of my career at Kothari Associates.",
  },
  {
    key: "planning",
    title: "Planning As Thinking",
    range: [37, 72],
    note: "Planning sheets with labels such as students hostels, stadium, academic hub and Lion Safari.",
  },
  {
    key: "buildings",
    title: "Buildings / Human Scale",
    range: [73, 108],
    note: "Each sketch represents a building or a proposal handled during the course of my career.",
  },
  {
    key: "systems",
    title: "Large Sites / Systems",
    range: [109, 123],
    note: "Project sketches for institutional buildings, schools, universities and other large works.",
  },
  {
    key: "colour",
    title: "Colour / Memory",
    range: [124, 134],
    note: "Paintings, caricatures and sketches from the closing pages.",
  },
  {
    key: "closing",
    title: "Closing",
    range: [135, 136],
    note: "All sketches and text by Ravindra Verma. Printing date: 8 June 2018.",
  },
];

export const spreadTitles = new Map([
  [4, "Title opening"],
  [8, "Wide elevation"],
  [20, "Journey begins"],
  [32, "Site study"],
  [42, "Students hostels / stadium / academic hub"],
  [66, "Lion Safari, Etawa"],
  [70, "Plan sheet / oval court"],
]);

export const pageNotes = new Map([
  [7, "The sketch book has been my sanctuary for almost my entire life thus far."],
  [10, "I turned 50 on 8 June 2018, after 28 years of architecture practice."],
  [11, "Sketching as communication before the idea is final."],
  [14, "Sketches help resolve the concept before finished drawing work, with aesthetics and space allocation kept in mind."],
  [18, "Digital technology is in addition to sketching, not in replacing it."],
  [19, "All the best ideas start with a sketch. Sketching is a skill - not a gift."],
  [20, "Faint working sheet with balcony modules, roof edges, section marks and dimensions."],
  [21, "Journey."],
  [22, "Three coloured architectural concept sketches: aerial massing, entry view and lower elevation or section."],
  [23, "Rendered facade with leaf-like panels, people, cars, water and the street at its base."],
  [24, "MOTI SONS appears with glass, stone, wood, shadow, handle, plate-sun, and gold."],
  [25, "Chandauli campus plan with Aud., Med. College, Hospital, Utilities, Residential, Guest House and Bus stand labels."],
  [42, "Students hostels, stadium, cricket, hospital and medical college, academic hub and future academic zones share the same sheet."],
  [43, "Students hostels (girls), future expansion, existing and proposed trees, school, residential staff and service building continue the masterplan spread."],
  [47, "Coloured planning page."],
  [48, "Key plan with water body, deep blue tiles, raised wooden decking, support for planter and passage notes."],
  [58, "Dining hall plan with kitchen, side elevation and front elevation on the same project sheet."],
  [66, "Lion Safari, Etawa: entry, shuttle, barrier, museum, cafe, viewpoints, and contour survey."],
  [70, "Plan sheet spread with parking edge, repeated room bays, A1/A2 labels, oval court, landscape pockets and dashed movement lines."],
  [71, "Right half of the plan sheet with oval court, room bays, angled landscape edge and dashed circulation lines."],
  [76, "Building study with alternatives A and B, including notes around future wall and frontage."],
  [83, "Interior elevation studies with fabric, projection screen, paneling and stone notes."],
  [89, "Interior ceiling sketch with chandelier corner notes, ceiling level, carpet, fabric change and windows/glazing."],
  [101, "Circular landscape/site plan with a building elevation below, tying plan geometry to facade massing."],
  [104, "Institute of Nano Science & Technology Mohali master plan with Central Hub, multipurpose hall, cafe/dining, hostels, existing orchard and future incubator/expansion."],
  [109, "Dense site arrangement with clustered buildings, looping internal movement, landscape pockets and a water or green edge."],
  [112, "Large institutional campus studies with entry, future academic/residential/student housing, sports, oncology and wellness, multipurpose hall and future expansion labels."],
  [116, "Contour/site plan with high road, pasture land zone, edge planting and buildings placed along the internal roads."],
  [124, "Paintings, caricatures and sketches."],
  [132, "Colour page near the end of the book."],
  [136, "Ravindra Verma, Chief Architect, Kothari Associates Pvt. Ltd., Delhi. All sketches and text by Ravindra Verma."],
]);

export const pageExcerpts = new Map([
  [7, "The sketch book has been my sanctuary for almost my entire life thus far."],
  [10, "When I turn 50 years old today on 8 June 2018, and after 28 years of architecture practice, having my own coffee table book was my challenge to myself."],
  [11, "I have preserved all of my sketches during my journey as an Architect."],
  [13, "Sketching and Architecture do go hand in hand. My sketches certainly are not museum quality."],
  [18, "There will never be a replacement for sketching."],
  [19, "All the best ideas start with a sketch. Sketching helps discover the best ideas and solutions."],
  [136, "Each sketch represents a building or a proposal he handled during the course of his career."],
]);

export const projectNotes = [
  {
    page: 8,
    pageLabel: "Pages 8+9",
    title: "Wide elevation",
    note: "Pages 8+9 are treated as one physical spread.",
    detail: "The web-book keeps this as one wide sheet because the physical book reads pages 8+9 as a single hero drawing.",
    image: pagePath(8),
    thumb: pagePath(8, "thumb"),
  },
  {
    page: 42,
    pageLabel: "Pages 42+43",
    title: "Campus masterplan",
    note: "Students hostels, stadium, cricket, hospital and medical college, academic hub and future expansion share one physical spread.",
    detail: "The spread continues onto page 43 with students hostels (girls), future expansion, existing/proposed trees, school, residential staff and service building notes.",
    image: pagePath(42),
    thumb: pagePath(42, "thumb"),
  },
  {
    page: 66,
    pageLabel: "Pages 66+67",
    title: "Lion Safari, Etawa",
    note: "Topographical survey, contour and plan.",
    detail: "The drawing labels entry, turning safari point, shuttle, facilitation center, cafe, museum, barrier, perimeter wall, and view points.",
    image: pagePath(66),
    thumb: pagePath(66, "thumb"),
  },
  {
    page: 70,
    pageLabel: "Pages 70+71",
    title: "Plan sheet / oval court",
    note: "A two-page plan sheet with parking, room bays, landscape pockets and an oval court.",
    detail: "The spread keeps the working plan readable across the fold: parking and planted arrival edge on page 70, then oval court, angled landscape edge and dashed movement paths on page 71.",
    image: pagePath(70),
    thumb: pagePath(70, "thumb"),
  },
  {
    page: 83,
    pageLabel: "Page 83",
    title: "Interior elevation notes",
    note: "Interior/elevation studies with fabric, projection screen, paneling and stone labels.",
    detail: "The sheet records interior material decisions directly on the elevation: fabric and projection screen across the top, paneling and stone along the lower edge.",
    image: pagePath(83),
    thumb: pagePath(83, "thumb"),
  },
  {
    page: 101,
    pageLabel: "Page 101",
    title: "Circular landscape plan",
    note: "A site plan with a strong circular centre and a building elevation below.",
    detail: "The page holds two scales together: a circular landscape or site diagram above, and a horizontal building elevation below.",
    image: pagePath(101),
    thumb: pagePath(101, "thumb"),
  },
  {
    page: 104,
    pageLabel: "Page 104",
    title: "Campus system",
    note: "Central Hub, multipurpose hall, cafe/dining, hostels, orchard and future incubator/expansion.",
    detail: "The page reads the campus as one system rather than separate buildings.",
    image: pagePath(104),
    thumb: pagePath(104, "thumb"),
  },
  {
    page: 109,
    pageLabel: "Page 109",
    title: "Clustered site system",
    note: "A dense arrangement of buildings, internal movement, landscape pockets and a water or green edge.",
    detail: "Clustered building groups, looped circulation, open landscape pockets and a large soft edge hold the relationships.",
    image: pagePath(109),
    thumb: pagePath(109, "thumb"),
  },
  {
    page: 112,
    pageLabel: "Page 112",
    title: "Institutional campus studies",
    note: "Two campus studies with entry, future academic/residential/student housing, sports, oncology and wellness, multipurpose hall and expansion labels.",
    detail: "Visible labels include entry, future academic, future residential, student housing, sports, oncology and wellness, multipurpose hall and future expansion.",
    image: pagePath(112),
    thumb: pagePath(112, "thumb"),
  },
  {
    page: 116,
    pageLabel: "Page 116",
    title: "Contour site plan",
    note: "A contour/site plan with high road, pasture land zone, edge planting and buildings set along internal roads.",
    detail: "The drawing keeps much of the site open: a high road and pasture land zone sit above, buildings collect along roads, and planting defines the site boundary.",
    image: pagePath(116),
    thumb: pagePath(116, "thumb"),
  },
];

export const colourPages = [
  {
    page: 124,
    title: "Amber figure painting",
    note: "Page 124 begins the late colour-room sequence of paintings, caricatures and sketches.",
    sequenceNote: "Warm figure study opens the late colour-room sequence.",
    image: pagePath(124),
    thumb: pagePath(124, "thumb"),
  },
  {
    page: 125,
    title: "Ochre figure study",
    note: "Page 125 keeps the colour work close to gesture, body and surface.",
    sequenceNote: "A second warm figure page extends the opening colour mood before the palette turns red.",
    image: pagePath(125),
    thumb: pagePath(125, "thumb"),
  },
  {
    page: 126,
    title: "Red painting",
    note: "The closing colour pages keep paintings beside the architectural sketches rather than separating them.",
    sequenceNote: "The palette becomes stronger and more direct, but still sits inside the same sketch habit.",
    image: pagePath(126),
    thumb: pagePath(126, "thumb"),
  },
  {
    page: 127,
    title: "Blue figure painting",
    note: "Page 127 continues the paintings, caricatures and sketches section near the close of the book.",
    sequenceNote: "The sequence shifts from warm figure work into cooler blue and violet fields.",
    image: pagePath(127),
    thumb: pagePath(127, "thumb"),
  },
  {
    page: 128,
    title: "Green landscape painting",
    note: "The colour works sit beside the architecture pages as part of the same lifelong sketch practice.",
    sequenceNote: "Landscape returns as colour, atmosphere and reflection rather than architectural plan.",
    image: pagePath(128),
    thumb: pagePath(128, "thumb"),
  },
  {
    page: 129,
    title: "Misty landscape study",
    note: "Page 129 continues the landscape mood through water, reflection and a softer edge.",
    sequenceNote: "The colour-room slows down here: reflection and horizon replace figure and outline.",
    image: pagePath(129),
    thumb: pagePath(129, "thumb"),
  },
  {
    page: 130,
    title: "Portrait silhouette",
    note: "Page 130 is one of the last colour works before the devotional image and author page.",
    sequenceNote: "The sequence narrows again to a figure and silhouette before the final closing pages.",
    image: pagePath(130),
    thumb: pagePath(130, "thumb"),
  },
  {
    page: 131,
    title: "Late figure page",
    note: "Page 131 continues the last colour works before the devotional image.",
    sequenceNote: "The late pages keep changing scale: figure, surface, memory and image sit together.",
    image: pagePath(131),
    thumb: pagePath(131, "thumb"),
  },
  {
    page: 132,
    title: "Devotional image",
    note: "Page 132 appears near the close of the colour section, before the final author page.",
    sequenceNote: "The colour-room closes with a devotional image before returning to the record of the author.",
    image: pagePath(132),
    thumb: pagePath(132, "thumb"),
  },
  {
    page: 133,
    title: "Closing colour page",
    note: "Page 133 belongs to the final run of paintings, caricatures and sketches.",
    sequenceNote: "One of the last colour pages keeps the ending visual rather than only biographical.",
    image: pagePath(133),
    thumb: pagePath(133, "thumb"),
  },
  {
    page: 134,
    title: "Final colour note",
    note: "Page 134 completes the late colour sequence before the closing pages of the book.",
    sequenceNote: "The colour sequence finishes here before the book turns to the final author record.",
    image: pagePath(134),
    thumb: pagePath(134, "thumb"),
  },
];

export const pageShareLandings = new Map([
  [7, "./reader.html#page-7"],
  [8, "./reader.html#page-8"],
  [9, "./reader.html#page-8"],
  [66, "./reader.html#page-66"],
  [67, "./reader.html#page-66"],
  [136, "./reader.html#page-136"],
]);

export function chapterForPage(page) {
  return chapters.find((chapter) => page >= chapter.range[0] && page <= chapter.range[1]);
}

export function projectNoteForPage(page) {
  return projectNotes.find((item) => item.page === Number(page));
}

export function colourPageForPage(page) {
  return colourPages.find((item) => item.page === Number(page));
}

export function pageExcerptForPage(page) {
  return pageExcerpts.get(Number(page));
}

export function shareLandingForPage(page) {
  return pageShareLandings.get(Number(page));
}
