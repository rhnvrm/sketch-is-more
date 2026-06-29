import {
  chapterForPage,
  colourPageForPage,
  pageExcerptForPage,
  pageNotes,
  pagePath,
  physicalSpreads,
  projectNoteForPage,
  shareLandingForPage,
  spreadTitles,
  totalPages,
} from "./book-data.js?v=20260627-quiet";
import { saveVisitState } from "./visit-state.js?v=20260627-quiet";

const $ = (selector, root = document) => root.querySelector(selector);

let activeReaderPage = 1;
let readerSwipeStart = null;

const readerStorageKey = "sketch-is-more:last-reader-page";
const wideReaderQuery = window.matchMedia("(min-width: 980px)");

function clampPage(page) {
  return Math.min(totalPages, Math.max(1, Number(page) || 1));
}

function spreadForPage(page) {
  return physicalSpreads.find((spread) => spread.pages.includes(page));
}

function readerDisplayFor(page) {
  const specialSpread = spreadForPage(page);
  if (specialSpread) {
    const anchorPage = specialSpread.pages[0];
    return {
      type: "feature-spread",
      pages: specialSpread.pages,
      anchorPage,
      label: `Pages ${specialSpread.pages.join("+")} / ${totalPages}`,
    };
  }

  if (wideReaderQuery.matches && page > 1) {
    const firstPage = page % 2 === 0 ? page : page - 1;
    if (firstPage + 1 <= totalPages) {
      return {
        type: "book-pair",
        pages: [firstPage, firstPage + 1],
        anchorPage: page,
        label: `Pages ${firstPage}+${firstPage + 1} / ${totalPages}`,
      };
    }
  }

  return {
    type: "single",
    pages: [page],
    anchorPage: page,
    label: `Page ${page} / ${totalPages}`,
  };
}

function savedReaderPage() {
  try {
    const page = Number(window.localStorage.getItem(readerStorageKey));
    return Number.isFinite(page) ? page : 0;
  } catch {
    return 0;
  }
}

function saveReaderPage(page) {
  try {
    window.localStorage.setItem(readerStorageKey, String(page));
  } catch {
    // Storage can be unavailable in private browsing or embedded webviews.
  }
}

function pageFromHash() {
  return clampPage(window.location.hash.match(/^#page-(\d+)$/)?.[1] || savedReaderPage() || activeReaderPage || 1);
}

function labelForDisplay(display) {
  return display.pages.length > 1 ? `pages ${display.pages.join(" and ")}` : `page ${display.anchorPage}`;
}

function contextForDisplay(display) {
  const page = display.anchorPage;
  const spreadStart = display.pages[0];
  const project = display.pages.map((displayPage) => projectNoteForPage(displayPage)).find(Boolean);
  const colour = display.pages.map((displayPage) => colourPageForPage(displayPage)).find(Boolean);
  const chapter = chapterForPage(page);
  const spreadTitle = spreadTitles.get(spreadStart);

  if (project) {
    return {
      title: `Page ${project.page} / ${project.title}`,
      note: project.detail ?? project.note,
      excerpt: pageExcerptForPage(project.page),
    };
  }

  if (colour) {
    return {
      title: `Page ${colour.page} / ${colour.title}`,
      note: colour.sequenceNote ?? colour.note,
      excerpt: pageExcerptForPage(colour.page),
    };
  }

  return {
    title: spreadTitle ? `${display.pages.join("+")} / ${spreadTitle}` : `Page ${page} / ${chapter.title}`,
    note: pageNotes.get(page) || pageNotes.get(spreadStart) || chapter.note,
    excerpt: pageExcerptForPage(page) ?? pageExcerptForPage(spreadStart),
  };
}

function renderReaderFrame(display) {
  const imageMarkup = display.pages
    .map(
      (displayPage, index) => `
        <span class="${display.type === "book-pair" ? "book-page" : index === 0 ? "spread-gutter" : ""}">
          <img src="${pagePath(displayPage)}" alt="Book page ${displayPage}" decoding="async" fetchpriority="high" />
        </span>
      `,
    )
    .join("");

  if (display.type === "feature-spread") {
    return `
      <div class="reader-spread" role="img" aria-label="Book pages ${display.pages.join(" and ")} as one physical spread">
        ${imageMarkup}
      </div>
    `;
  }

  if (display.type === "book-pair") {
    return `
      <div class="reader-book" role="img" aria-label="Book pages ${display.pages.join(" and ")} side by side">
        ${imageMarkup}
      </div>
    `;
  }

  return `<img class="reader-page" src="${pagePath(display.anchorPage)}" alt="Book page ${display.anchorPage}" decoding="async" fetchpriority="high" />`;
}

function updateProgress(display) {
  const progress = $("[data-reader-progress]");
  const pageNumber = $("[data-reader-page-number]");

  if (progress) {
    progress.value = String(display.anchorPage);
    progress.setAttribute("aria-valuetext", `${labelForDisplay(display)} of ${totalPages}`);
    progress.style.setProperty("--reader-progress", `${((display.anchorPage - 1) / (totalPages - 1)) * 100}%`);
  }

  if (pageNumber) {
    pageNumber.value = String(display.anchorPage);
  }
}

function updateContext(display) {
  updateReaderShare(display, contextForDisplay(display));
}

function updateReaderShare(display, context) {
  const button = $(".site-header [data-share-book]");
  if (!button) return;

  const pageLabel = display.pages.length > 1 ? `Pages ${display.pages.join("+")}` : `Page ${display.anchorPage}`;
  button.dataset.shareTarget = shareLandingForPage(display.anchorPage) ?? `./reader.html#page-${display.anchorPage}`;
  button.dataset.shareTitle = `${pageLabel} | Sketch Is More`;
  button.dataset.shareText = context.note;
  button.setAttribute("aria-label", `Share ${pageLabel}`);
}

function updateReaderHash() {
  history.replaceState(null, "", `${window.location.pathname}${window.location.search}#page-${activeReaderPage}`);
}

function setReaderPage(page, shouldScroll = false) {
  const display = readerDisplayFor(clampPage(page));
  activeReaderPage = display.anchorPage;

  saveReaderPage(activeReaderPage);
  saveVisitState({
    type: "reader",
    label: display.pages.length > 1 ? `Continue pages ${display.pages.join("+")}` : `Continue page ${activeReaderPage}`,
    href: `./reader.html#page-${activeReaderPage}`,
    note: "Resume the complete reader.",
  });

  $(".reader-frame").innerHTML = renderReaderFrame(display);
  $(".reader-count").value = display.label;
  updateProgress(display);
  updateContext(display);

  if (shouldScroll) {
    const reader = $("#reader");
    window.scrollTo({ top: Math.max(0, reader.offsetTop - 84), behavior: "smooth" });
  }
}

function nextReaderPage() {
  const display = readerDisplayFor(activeReaderPage);
  return display.pages.at(-1) + 1;
}

function previousReaderPage() {
  const display = readerDisplayFor(activeReaderPage);
  return display.pages[0] - 1;
}

function openPage(page) {
  setReaderPage(page, true);
  updateReaderHash();
}

const zoomShell = $("#zoom-shell");
const zoomStage = zoomShell ? zoomShell.querySelector(".zoom-stage") : null;

function openZoom() {
  if (!zoomShell) return;
  const display = readerDisplayFor(activeReaderPage);
  zoomStage.innerHTML = display.pages
    .map((p) => `<img src="${pagePath(p)}" alt="Book page ${p}" decoding="async" />`)
    .join("");
  zoomShell.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeZoom() {
  if (!zoomShell || zoomShell.hidden) return;
  zoomShell.hidden = true;
  document.body.style.overflow = "";
  zoomStage.innerHTML = "";
}

function wireInteractions() {
  $(".reader-prev").addEventListener("click", () => openPage(previousReaderPage()));
  $(".reader-next").addEventListener("click", () => openPage(nextReaderPage()));

  $("[data-reader-progress]")?.addEventListener("input", (event) => {
    openPage(Number(event.target.value));
  });

  $("[data-reader-page-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const page = Number($("[data-reader-page-number]")?.value);
    openPage(page);
  });

  $("[data-reader-page-number]")?.addEventListener("change", (event) => {
    openPage(Number(event.target.value));
  });

  $(".reader-stage")?.addEventListener("click", openZoom);

  zoomShell?.addEventListener("click", (event) => {
    if (event.target === zoomShell || event.target === zoomStage) closeZoom();
  });

  $(".zoom-dismiss")?.addEventListener("click", closeZoom);

  $(".reader-frame").addEventListener("pointerdown", (event) => {
    readerSwipeStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
  });

  $(".reader-frame").addEventListener("pointerup", (event) => {
    if (readerSwipeStart?.pointerId !== event.pointerId) return;

    const dx = event.clientX - readerSwipeStart.x;
    const dy = event.clientY - readerSwipeStart.y;
    readerSwipeStart = null;

    if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.35) {
      openPage(dx < 0 ? nextReaderPage() : previousReaderPage());
    }
  });

  $(".reader-frame").addEventListener("pointercancel", () => {
    readerSwipeStart = null;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { closeZoom(); return; }
    if (zoomShell && !zoomShell.hidden) return;
    if (event.key === "ArrowRight") openPage(nextReaderPage());
    if (event.key === "ArrowLeft") openPage(previousReaderPage());
  });

  wideReaderQuery.addEventListener("change", () => {
    setReaderPage(activeReaderPage, false);
  });
}

const initialPage = pageFromHash();
setReaderPage(initialPage);
if (window.location.hash && initialPage !== activeReaderPage) updateReaderHash();
wireInteractions();

window.addEventListener("hashchange", () => {
  const page = pageFromHash();
  if (page !== activeReaderPage) {
    setReaderPage(page, true);
    if (page !== activeReaderPage) updateReaderHash();
  }
});
