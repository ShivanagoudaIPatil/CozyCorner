(() => {
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebarNav = document.getElementById("sidebarNav");
  const links = Array.from(document.querySelectorAll(".sidebar-link"));
  const progressBar = document.querySelector(".profile-progress-bar");

  if (progressBar) {
    const rawValue = Number(progressBar.getAttribute("data-progress"));
    const normalized = Number.isFinite(rawValue) ? Math.min(100, Math.max(0, rawValue)) : 0;
    progressBar.style.width = `${normalized}%`;
  }

  if (sidebarToggle && sidebarNav) {
    sidebarToggle.addEventListener("click", () => {
      sidebarNav.classList.toggle("open");
    });
  }

  const setActive = (id) => {
    links.forEach((link) => {
      const isMatch = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("is-active", isMatch);
    });
  };

  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-35% 0px -55% 0px",
        threshold: 0.2,
      }
    );

    sections.forEach((section) => observer.observe(section));
  }
})();
