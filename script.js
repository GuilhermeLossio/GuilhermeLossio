const revealItems = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

const observeReveal = (item, index = 0) => {
  item.style.transitionDelay = `${index * 0.08}s`;
  observer.observe(item);
};

revealItems.forEach((item, index) => {
  observeReveal(item, index);
});

const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");

const setActiveTab = (tabName) => {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === tabName;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  tabPanels.forEach((panel) => {
    const isActive = panel.id === `tab-${tabName}`;
    panel.classList.toggle("active", isActive);
  });
};

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveTab(button.dataset.tab);
  });
});

const credlyGrid = document.querySelector("[data-credly-badges]");
const credlyCount = document.querySelector("[data-credly-count]");

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatIssuedDate = (value) => {
  if (!value) return "Issued date available on Credly";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return `Issued ${value}`;
  }

  return `Issued ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
};

const getIssuerName = (badge) =>
  badge?.issuer?.entities?.find((entity) => entity.primary)?.entity?.name ||
  badge?.issuer?.entities?.[0]?.entity?.name ||
  "Credly";

const renderCredlyBadge = (badge, index) => {
  const template = badge.badge_template || {};
  const verifyUrl = `https://www.credly.com/badges/${badge.id}`;
  const name = template.name || "Verified credential";
  const issuer = getIssuerName(badge);
  const imageUrl = badge.image_url || template.image_url || "";

  const card = document.createElement("article");
  card.className = "badge-card reveal";
  card.innerHTML = `
    <a
      class="badge-image-link"
      href="${escapeHtml(verifyUrl)}"
      target="_blank"
      rel="noreferrer"
      aria-label="Verify ${escapeHtml(name)} on Credly"
    >
      <img
        src="${escapeHtml(imageUrl)}"
        alt="${escapeHtml(name)} badge"
        loading="lazy"
      />
    </a>
    <div>
      <span class="tag">${escapeHtml(issuer)}</span>
      <h3>${escapeHtml(name)}</h3>
      <p>${escapeHtml(formatIssuedDate(badge.issued_at_date))}</p>
      <a
        class="text-link"
        href="${escapeHtml(verifyUrl)}"
        target="_blank"
        rel="noreferrer"
      >
        Verify credential
      </a>
    </div>
  `;

  observeReveal(card, index);
  return card;
};

const loadCredlyBadges = async () => {
  if (!credlyGrid) return;

  const endpoint = credlyGrid.dataset.credlyEndpoint;
  if (!endpoint) return;

  try {
    const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Credly request failed: ${response.status}`);

    const payload = await response.json();
    const badges = Array.isArray(payload.data) ? payload.data : [];
    if (!badges.length) return;

    credlyGrid.replaceChildren(
      ...badges.map((badge, index) => renderCredlyBadge(badge, index))
    );

    if (credlyCount) {
      credlyCount.textContent = String(payload.metadata?.total_count || badges.length);
    }
  } catch (error) {
    credlyGrid.dataset.credlyFallback = "true";
  }
};

loadCredlyBadges();
