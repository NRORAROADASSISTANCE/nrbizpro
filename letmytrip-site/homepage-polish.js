(function () {
  function removeDuplicatePartnerSection() {
    const heading = Array.from(document.querySelectorAll("h1,h2,h3,h4"))
      .find((el) => /become a travel partner/i.test((el.textContent || "").trim()));
    if (!heading) return;

    // Find the smallest section/container holding both the partner heading and the old registration form.
    let node = heading;
    let target = null;
    while (node && node !== document.body && node !== document.documentElement) {
      const text = node.innerText || node.textContent || "";
      const hasPartnerForm = /agency\s*\/\s*company name|business type/i.test(text) &&
        !!node.querySelector("form, input, select, textarea");
      if (hasPartnerForm && !node.querySelector("header, nav, footer")) target = node;
      node = node.parentElement;
    }
    // Prefer the highest bounded section containing the heading/form, but never remove the whole page.
    if (target && target !== document.body && target !== document.documentElement &&
        target.tagName !== "MAIN" && target.tagName !== "HTML") {
      target.remove();
    } else {
      // Fallback: remove the heading and its introductory copy, plus the adjacent registration card.
      const intro = heading.closest("section, article") || heading.parentElement?.parentElement;
      if (intro && intro !== document.body && intro.tagName !== "MAIN") intro.remove();
    }
  }

  function tidyLetmytripHome() {
    removeDuplicatePartnerSection();

    // Add small, understated quick links beside the existing right-side footer details.
    const footer = document.querySelector("footer") ||
      Array.from(document.querySelectorAll("div")).find((el) =>
        el.children.length > 0 && /©\s*2026\s*LETMYTRIP/i.test(el.textContent || "") &&
        /A Unit of NR Group of Companies/i.test(el.textContent || ""));
    if (!footer || footer.querySelector(".letmytrip-footer-quicklinks")) return;

    const contactTarget = document.querySelector("#contact, #contact-us, #contactUs");
    const careersTarget = document.querySelector("#careers");
    const nav = document.createElement("nav");
    nav.className = "letmytrip-footer-quicklinks";
    nav.setAttribute("aria-label", "Important links");
    nav.innerHTML =
      '<a href="' + (contactTarget ? "#" + contactTarget.id : "#contact") + '">Contact Us</a>' +
      '<a href="' + (careersTarget ? "#careers" : "#careers") + '">Careers</a>';

    const style = document.createElement("style");
    style.textContent = `
      .letmytrip-footer-quicklinks {
        display:flex; align-items:center; justify-content:flex-end; flex-wrap:wrap;
        gap:14px; margin-left:auto; padding:4px 0; font-size:12px; line-height:1.4;
      }
      .letmytrip-footer-quicklinks a {
        color:#fff; text-decoration:none; font-weight:400; white-space:nowrap;
      }
      .letmytrip-footer-quicklinks a:hover,
      .letmytrip-footer-quicklinks a:focus { text-decoration:underline; }
      @media (max-width:700px) {
        .letmytrip-footer-quicklinks { width:100%; justify-content:flex-end; gap:12px; }
      }
    `;
    document.head.appendChild(style);

    const brand = Array.from(footer.querySelectorAll("*")).find((el) =>
      el.children.length === 0 && /A Unit of NR Group of Companies/i.test(el.textContent || ""));
    if (brand && brand.parentElement) {
      const rightGroup = brand.parentElement;
      rightGroup.style.display = "flex";
      rightGroup.style.alignItems = "center";
      rightGroup.style.justifyContent = "flex-end";
      rightGroup.style.flexWrap = "wrap";
      rightGroup.style.gap = "12px";
      rightGroup.appendChild(nav);
    } else {
      footer.appendChild(nav);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tidyLetmytripHome);
  else tidyLetmytripHome();
})();
