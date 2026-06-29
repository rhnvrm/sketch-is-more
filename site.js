import { readVisitState } from "./visit-state.js?v=20260627-quiet";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function wireSkipLink() {
  $$(".skip-link").forEach((link) => {
    link.addEventListener("focus", () => {
      link.classList.add("is-focused");
      link.style.top = "0.85rem";
    });
    link.addEventListener("blur", () => {
      link.classList.remove("is-focused");
      link.style.removeProperty("top");
    });
  });
}

function revealSections() {
  $(".home-hero")?.classList.add("is-visible");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
      });
    },
    { threshold: 0.18 },
  );

  $$(".section-observed").forEach((section) => observer.observe(section));
}

function settleHashScroll() {
  const id = window.location.hash.slice(1);
  if (!id) return;

  const target = document.getElementById(id);
  if (!target) return;

  target.classList.add("is-visible");
  const previousBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = "auto";
  window.requestAnimationFrame(() => {
    window.scrollTo(0, Math.max(0, target.offsetTop - 78));
    window.requestAnimationFrame(() => {
      document.documentElement.style.scrollBehavior = previousBehavior;
    });
  });
}

function scheduleHashScroll() {
  settleHashScroll();
  [80, 420, 1200].forEach((delay) => window.setTimeout(settleHashScroll, delay));
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // The site works normally if registration is blocked or unsupported.
    });
  });
}

function shareUrlFromButton(button) {
  const target = button.dataset.shareTarget || window.location.href;
  return new URL(target, window.location.href).href;
}

const homeShareSections = {
  "wide-sheet": {
    title: "Sketch Is More | Pages 8+9",
    text: "A physical two-page hero sheet from Sketch Is More, kept together as one table drawing.",
  },
  "author-record": {
    title: "Sketch Is More | Ravindra Verma",
    text: "The author record for Ravindra Verma, Chief Architect and author of Sketch Is More.",
  },
};

function setHomeShareSection(id) {
  const button = $("[data-share-book]");
  const section = homeShareSections[id];
  if (!button || !section) return;

  button.dataset.shareTarget = `./index.html#${id}`;
  button.dataset.shareTitle = section.title;
  button.dataset.shareText = section.text;
  button.setAttribute("aria-label", `Share ${section.title}`);
}

function wireHomeSectionShare() {
  if (!document.body.classList.contains("home-page")) return;

  const hashId = window.location.hash.slice(1);
  if (homeShareSections[hashId]) setHomeShareSection(hashId);

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) setHomeShareSection(visible.target.id);
    },
    {
      rootMargin: "-22% 0px -52%",
      threshold: [0.18, 0.36, 0.54],
    },
  );

  Object.keys(homeShareSections).forEach((id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

function wireContinueReading() {
  const link = $("[data-continue-reading]");
  if (!link) return;

  const state = readVisitState();
  if (!state) return;

  link.hidden = false;
  link.href = state.href;
  link.textContent = state.label;
  link.setAttribute("aria-label", `${state.label}. ${state.note || "Resume Sketch Is More."}`);
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const input = document.createElement("input");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.append(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

function wireShareButtons() {
  $("[data-share-book]")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const status = $("[data-share-status]");
    const url = shareUrlFromButton(button);
    const title = button.dataset.shareTitle || document.title;
    const text = button.dataset.shareText || "Sketch Is More by Ravindra Verma.";

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        if (status) status.textContent = "Shared";
        return;
      }

      await copyToClipboard(url);
      if (status) status.textContent = "Link copied";
    } catch {
      if (status) status.textContent = "Could not share";
    }

    if (status) {
      window.setTimeout(() => {
        status.textContent = "";
      }, 2200);
    }
  });
}

wireSkipLink();
revealSections();
scheduleHashScroll();
window.addEventListener("load", scheduleHashScroll);
window.addEventListener("hashchange", scheduleHashScroll);
window.addEventListener("hashchange", () => setHomeShareSection(window.location.hash.slice(1)));
wireHomeSectionShare();
wireContinueReading();
wireShareButtons();
registerServiceWorker();
