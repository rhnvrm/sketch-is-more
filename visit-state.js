const visitStorageKey = "sketch-is-more:last-visit";
const readerStorageKey = "sketch-is-more:last-reader-page";

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function saveVisitState(state) {
  try {
    window.localStorage.setItem(
      visitStorageKey,
      JSON.stringify({
        ...state,
        updatedAt: Date.now(),
      }),
    );
  } catch {
    // Storage can be unavailable in private or embedded browser contexts.
  }
}

export function readVisitState() {
  try {
    const state = safeParse(window.localStorage.getItem(visitStorageKey));
    if (state?.href && state?.label) return state;

    const page = Number(window.localStorage.getItem(readerStorageKey));
    if (Number.isFinite(page) && page >= 1 && page <= 136) {
      return {
        type: "reader",
        label: page === 1 ? "Continue reading" : `Continue from page ${page}`,
        href: `./reader.html#page-${page}`,
        note: "Resume the complete reader.",
      };
    }
  } catch {
    // Treat blocked storage as no saved visit.
  }

  return null;
}
