(function () {
  function tidyLetmytripHome() {
    // The agent registration form belongs only on the Agent Portal, not on the public homepage.
    const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4"));
    const title = headings.find((el) => /become a travel partner/i.test((el.textContent || "").trim()));
    if (title) {
      let node = title.parentElement;
      let sectionToRemove = null;
      while (node && node !== document.body && node !== document.documentElement) {
        if (node.querySelector && node.querySelector("form")) {
          sectionToRemove = node;
          break;
        }
        node = node.parentElement;
      }
      if (sectionToRemove) sectionToRemove.remove();
    }

    // Keep the top navigation intact and add quick links in the bottom-right footer area.
    const footer = document.querySelector("footer") ||
      Array.from(document.querySelectorAll("div")).find((el) =>
        el.children.length > 0 && /©\s*2026\s*LETMYTRIP/i.test(el.textContent || "") &&
        /A Unit of NR Group of Companies/i.test(el.textContent || ""));
    if (!footer || footer.querySelector(".letmytrip-footer-quicklinks")) return;

    const contactTarget = document.querySelector("#contact, [id='contact-us'], [id='contactUs']");
    const careersTarget = document.querySelector("#careers");
    const contactHref = contactTarget ? "#" + contactTarget.id : "#contact";
    const careersHref = careersTarget ? "#careers" : "#careers";

    const nav = document.createElement("nav");
    nav.className = "letmytrip-footer-quicklinks";
    nav.setAttribute("aria-label", "Important links");
    nav.innerHTML =
      '<a href="' + contactHref + '">Contact Us</a>' +
      '<a href="' + careersHref + '">Careers</a>';

    const style = document.createElement("style");
    style.textContent = `
      .letmytrip-footer-quicklinks {
        display:flex; align-items:center; justify-content:flex-end; flex-wrap:wrap;
        gap:18px; margin-left:auto; padding:10px 0; font-size:14px;
      }
      .letmytrip-footer-quicklinks a {
        color:#fff; text-decoration:none; font-weight:600; white-space:nowrap;
      }
      .letmytrip-footer-quicklinks a:hover,
      .letmytrip-footer-quicklinks a:focus { text-decoration:underline; }
      @media (max-width:700px) {
        .letmytrip-footer-quicklinks { width:100%; justify-content:flex-end; gap:14px; }
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
      rightGroup.style.gap = "14px";
      rightGroup.appendChild(nav);
    } else {
      footer.appendChild(nav);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tidyLetmytripHome);
  else tidyLetmytripHome();
})();
