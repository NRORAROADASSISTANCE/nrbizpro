(function () {
  function tidyLetmytripHome() {
    // Remove only the old inline agency form/card. Never remove a page-wide wrapper.
    const forms = Array.from(document.querySelectorAll("form"));
    const agentForm = forms.find((form) =>
      /agency\s*\/\s*company name/i.test(form.innerText || form.textContent || "") ||
      Array.from(form.querySelectorAll("input,select,textarea")).some((field) =>
        /agency|business type/i.test((field.placeholder || "") + " " + (field.name || "") + " " + (field.getAttribute("aria-label") || "")));
    if (agentForm) {
      const card = agentForm.closest("section, article, .form-card, .registration-card, .partner-form-card");
      if (card && card.tagName !== "MAIN" && card.tagName !== "BODY" &&
          !card.querySelector("header, nav, footer") &&
          /agency|travel partner/i.test(card.innerText || card.textContent || "")) {
        card.remove();
      } else {
        agentForm.remove();
      }
    }

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
