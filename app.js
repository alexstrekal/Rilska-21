(() => {
  const MONTHS = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  const i18n = {
    bg: {
      title: "Разпределение на разходи 2026",
      subtitle: "ул. Рилска № 21",
      hint: "Плъзнете хоризонтално, за да видите всички колони",
      footerNote: "Сумите се разпределят според броя живущи в апартамента.",
      emptyMonth: "Все още няма данни за този месец.",
      currency: "лв.",
      months: {
        january: "януари",
        february: "февруари",
        march: "март",
        april: "април",
        may: "май",
        june: "юни",
        july: "юли",
        august: "август",
        september: "септември",
        october: "октомври",
        november: "ноември",
        december: "декември",
      },
      columns: {
        apt: "Ап",
        residents: "Брой живущи",
        stairsAug: "Ток стълби (август)",
        elevAug: "Ток асансьор (август)",
        stairsSep: "Ток стълби (септември)",
        elevSep: "Ток асансьор (септември)",
        elevator: "Асансьор",
        connectivity: "Асансьор, годишна такса свързаност",
        total: "Общо",
        paid: "Платено",
      },
      billRow: "Общо по сметка",
      ground: "Партер",
    },
    ru: {
      title: "Распределение расходов 2026",
      subtitle: "ул. Рилска № 21",
      hint: "Проведите в сторону, чтобы увидеть все колонки",
      footerNote: "Суммы распределяются по числу проживающих в квартире.",
      emptyMonth: "Данных за этот месяц пока нет.",
      currency: "лв.",
      months: {
        january: "январь",
        february: "февраль",
        march: "март",
        april: "апрель",
        may: "май",
        june: "июнь",
        july: "июль",
        august: "август",
        september: "сентябрь",
        october: "октябрь",
        november: "ноябрь",
        december: "декабрь",
      },
      columns: {
        apt: "Кв",
        residents: "Кол-во проживающих",
        stairsAug: "Эл. лестница (август)",
        elevAug: "Эл. лифт (август)",
        stairsSep: "Эл. лестница (сентябрь)",
        elevSep: "Эл. лифт (сентябрь)",
        elevator: "Лифт",
        connectivity: "Лифт, годовая плата за связь",
        total: "Итого",
        paid: "Оплачено",
      },
      billRow: "Итого по счёту",
      ground: "Партер",
    },
  };

  /** Expense categories and who participates */
  const EXPENSE_KEYS = [
    "stairsAug",
    "elevAug",
    "stairsSep",
    "elevSep",
    "elevator",
    "connectivity",
  ];

  const STAIRS_PAYERS = new Set([
    "ground",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
  ]);

  const FULL_PAYERS = new Set(["4", "5", "6", "7", "8", "9", "10", "11"]);

  const CATEGORY_PAYERS = {
    stairsAug: STAIRS_PAYERS,
    stairsSep: STAIRS_PAYERS,
    elevAug: FULL_PAYERS,
    elevSep: FULL_PAYERS,
    elevator: FULL_PAYERS,
    connectivity: FULL_PAYERS,
  };

  const APARTMENTS = [
    { id: "ground", residents: 0 },
    { id: "1", residents: 0 },
    { id: "2", residents: 1 },
    { id: "3", residents: 1 },
    { id: "4", residents: 1 },
    { id: "5", residents: 1 },
    { id: "6", residents: 2 },
    { id: "7", residents: 2 },
    { id: "8", residents: 2 },
    { id: "9", residents: 1 },
    { id: "10", residents: 1 },
    { id: "11", residents: 0 },
  ];

  /**
   * Month data. Add new months here as bills arrive.
   * paid: set of apartment ids that have paid.
   */
  const monthData = {
    september: {
      bills: {
        stairsAug: 7.64,
        elevAug: 13.28,
        stairsSep: 0,
        elevSep: 0,
        elevator: 33.49,
        connectivity: 37.07,
      },
      paid: new Set(),
    },
  };

  const state = {
    lang: "bg",
    month: defaultMonth(),
    hasSettledInitialScroll: false,
  };

  const els = {
    monthTabs: document.getElementById("monthTabs"),
    tableHead: document.getElementById("tableHead"),
    tableBody: document.getElementById("tableBody"),
    expenseTable: document.getElementById("expenseTable"),
    tableScroll: document.getElementById("tableScroll"),
  };

  function defaultMonth() {
    const now = new Date();
    const idx = now.getFullYear() === 2026 ? now.getMonth() : 8;
    return MONTHS[idx] || "september";
  }

  function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function formatMoney(value) {
    if (value === null || value === undefined) return "—";
    const fixed = round2(value).toFixed(2);
    return fixed.replace(".", ",");
  }

  function peopleInGroup(payerSet) {
    return APARTMENTS.reduce(
      (sum, apt) => (payerSet.has(apt.id) ? sum + apt.residents : sum),
      0
    );
  }

  function shareFor(apt, category, billAmount) {
    const payers = CATEGORY_PAYERS[category];
    if (!payers.has(apt.id)) return null;
    const people = peopleInGroup(payers);
    if (!people || !billAmount) return 0;
    return round2((billAmount / people) * apt.residents);
  }

  function aptLabel(id, dict) {
    return id === "ground" ? dict.ground : id;
  }

  function checkSvg() {
    return `
      <svg class="paid-mark" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M8.2 14.4 4.6 10.8l1.4-1.4 2.2 2.2 5.2-5.2 1.4 1.4z"/>
      </svg>
    `;
  }

  function renderI18nStatic() {
    const dict = i18n[state.lang];
    document.documentElement.lang = state.lang === "bg" ? "bg" : "ru";
    document.title = dict.title;

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      if (dict[key]) node.textContent = dict[key];
    });

    document.querySelectorAll(".lang-btn").forEach((btn) => {
      const active = btn.dataset.lang === state.lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function renderMonthTabs() {
    const dict = i18n[state.lang];
    els.monthTabs.innerHTML = "";

    MONTHS.forEach((monthKey) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "month-tab";
      btn.setAttribute("role", "tab");
      btn.dataset.month = monthKey;
      btn.textContent = dict.months[monthKey];

      const hasData = Boolean(monthData[monthKey]);
      const selected = state.month === monthKey;

      if (!hasData) {
        btn.disabled = true;
        btn.classList.add("is-disabled");
        btn.setAttribute("aria-disabled", "true");
      }

      if (selected) {
        btn.classList.add("is-selected");
        btn.setAttribute("aria-selected", "true");
      } else {
        btn.setAttribute("aria-selected", "false");
      }

      if (hasData) {
        btn.addEventListener("click", () => {
          state.month = monthKey;
          render();
        });
      }

      els.monthTabs.appendChild(btn);
    });

    // After layout: keep selected month in the tabs viewport (centered when possible).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollSelectedMonthIntoView(false);
        if (!state.hasSettledInitialScroll) {
          lockPageToTop();
          state.hasSettledInitialScroll = true;
        }
      });
    });
  }

  function scrollSelectedMonthIntoView(smooth) {
    const scroller = els.monthTabs;
    const selectedBtn = scroller.querySelector(".is-selected");
    if (!selectedBtn) return;

    const scrollerWidth = scroller.clientWidth;
    const maxScroll = Math.max(0, scroller.scrollWidth - scrollerWidth);
    if (maxScroll === 0) return;

    const target =
      selectedBtn.offsetLeft + selectedBtn.offsetWidth / 2 - scrollerWidth / 2;
    const nextLeft = Math.min(maxScroll, Math.max(0, target));

    // Keep the page scroll put — iOS often shifts the window when a nested scroller moves.
    const pageX = window.scrollX;
    const pageY = window.scrollY;

    if (smooth && typeof scroller.scrollTo === "function") {
      scroller.scrollTo({ left: nextLeft, behavior: "smooth" });
    } else {
      scroller.scrollLeft = nextLeft;
    }

    window.scrollTo(pageX, pageY);
  }

  function lockPageToTop() {
    window.scrollTo(0, 0);
  }

  function renderTable() {
    const dict = i18n[state.lang];
    const data = monthData[state.month];

    if (!data) {
      els.tableHead.innerHTML = "";
      els.tableBody.innerHTML = `<tr><td colspan="10"><div class="empty-month">${dict.emptyMonth}</div></td></tr>`;
      return;
    }

    const cols = [
      "apt",
      "residents",
      ...EXPENSE_KEYS,
      "total",
      "paid",
    ];

    els.tableHead.innerHTML = `
      <tr>
        ${cols
          .map((key) => {
            const sticky = key === "apt" ? " sticky-col" : "";
            return `<th class="${sticky}"><div class="cell cell--head">${dict.columns[key]}</div></th>`;
          })
          .join("")}
      </tr>
    `;

    const billCells = EXPENSE_KEYS.map((key) => {
      const amount = data.bills[key] ?? 0;
      return `<td><div class="cell cell--money cell--bill">${formatMoney(amount)}</div></td>`;
    }).join("");

    const billTotal = round2(
      EXPENSE_KEYS.reduce((sum, key) => sum + (data.bills[key] ?? 0), 0)
    );

    const rows = [];

    rows.push(`
      <tr class="is-bill">
        <td class="sticky-col"><div class="cell cell--apt cell--bill">${dict.billRow}</div></td>
        <td><div class="cell cell--muted cell--bill"></div></td>
        ${billCells}
        <td><div class="cell cell--money cell--total cell--bill">${formatMoney(billTotal)}</div></td>
        <td><div class="cell cell--paid cell--bill"></div></td>
      </tr>
    `);

    APARTMENTS.forEach((apt) => {
      let rowTotal = 0;
      const moneyCells = EXPENSE_KEYS.map((key) => {
        const share = shareFor(apt, key, data.bills[key] ?? 0);
        if (share === null) {
          return `<td><div class="cell cell--na">—</div></td>`;
        }
        rowTotal += share;
        return `<td><div class="cell cell--money">${formatMoney(share)}</div></td>`;
      }).join("");

      rowTotal = round2(rowTotal);
      const isPaid = data.paid.has(apt.id);
      const paidCell = isPaid
        ? `<div class="cell cell--paid is-paid" aria-label="✓">${checkSvg()}</div>`
        : `<div class="cell cell--paid"></div>`;

      rows.push(`
        <tr>
          <td class="sticky-col"><div class="cell cell--apt">${aptLabel(apt.id, dict)}</div></td>
          <td><div class="cell cell--muted">${apt.residents}</div></td>
          ${moneyCells}
          <td><div class="cell cell--money cell--total">${formatMoney(rowTotal)}</div></td>
          <td>${paidCell}</td>
        </tr>
      `);
    });

    els.tableBody.innerHTML = rows.join("");
  }

  function render() {
    renderI18nStatic();
    renderMonthTabs();
    renderTable();
  }

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.lang = btn.dataset.lang;
      render();
      btn.blur();
    });
  });

  // If default month has no data, fall back to first available month
  if (!monthData[state.month]) {
    const available = Object.keys(monthData)[0];
    if (available) state.month = available;
  }

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => scrollSelectedMonthIntoView(false), 100);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      scrollSelectedMonthIntoView(false);
      if (!state.hasSettledInitialScroll) {
        lockPageToTop();
      }
    });
  }

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  lockPageToTop();
  window.addEventListener("pageshow", (event) => {
    if (event.persisted || !state.hasSettledInitialScroll) {
      lockPageToTop();
    }
  });

  render();
})();
