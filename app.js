(() => {
  const VIEWS = [
    {
      id: "emilia",
      expenses: ["stairsAug", "elevAug"],
    },
    {
      id: "alexander",
      expenses: ["elevator", "connectivity"],
    },
    {
      id: "september",
      expenses: [
        "stairsAug",
        "elevAug",
        "stairsSep",
        "elevSep",
        "elevator",
        "connectivity",
      ],
    },
  ];

  const i18n = {
    bg: {
      title: "Разпределение на разходи 2026",
      subtitle: "ул. Рилска № 21",
      hint: "Плъзнете хоризонтално, за да видите всички колони",
      footerNote: "Сумите се разпределят според броя живущи в апартамента.",
      emptyView: "Все още няма данни.",
      tabsLabel: "Таблици",
      views: {
        emilia: "Емилия",
        alexander: "Александър",
        september: "Септември",
      },
      columns: {
        apt: "Ап",
        residents: "Брой живущи",
        stairsAug: "Ток стълби (август)",
        elevAug: "Ток асансьор (август)",
        stairsSep: "Ток стълби",
        elevSep: "Ток асансьор",
        elevator: "Асансьор, месечна такса",
        connectivity: "Асансьор, годишна такса свързаност",
        total: "Общо",
      },
      viewColumns: {
        alexander: {
          elevator: "Асансьор (септември)",
        },
      },
      billRow: "Общо по<br>сметка",
      ground: "Партер",
    },
    ru: {
      title: "Распределение расходов 2026",
      subtitle: "ул. Рилска № 21",
      hint: "Проведите в сторону, чтобы увидеть все колонки",
      footerNote: "Суммы распределяются по числу проживающих в квартире.",
      emptyView: "Данных пока нет.",
      tabsLabel: "Таблицы",
      views: {
        emilia: "Эмилия",
        alexander: "Александр",
        september: "Сентябрь",
      },
      columns: {
        apt: "Кв",
        residents: "Кол-во проживающих",
        stairsAug: "Эл. лестница (август)",
        elevAug: "Эл. лифт (август)",
        stairsSep: "Эл. лестница",
        elevSep: "Эл. лифт",
        elevator: "Лифт, месячная плата",
        connectivity: "Лифт, годовая плата за связь",
        total: "Итого",
      },
      viewColumns: {
        alexander: {
          elevator: "Лифт (сентябрь)",
        },
      },
      billRow: "Итого по<br>счёту",
      ground: "Партер",
    },
  };

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

  const bills = {
    stairsAug: 7.64,
    elevAug: 13.28,
    stairsSep: 0,
    elevSep: 0,
    elevator: 33.49,
    connectivity: 37.07,
  };

  const state = {
    lang: "bg",
    view: "emilia",
    hasSettledInitialScroll: false,
  };

  const els = {
    viewTabs: document.getElementById("viewTabs"),
    tableHead: document.getElementById("tableHead"),
    tableBody: document.getElementById("tableBody"),
    expenseTable: document.getElementById("expenseTable"),
  };

  function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function formatMoney(value) {
    if (value === null || value === undefined) return "—";
    return round2(value).toFixed(2).replace(".", ",");
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

  function currentView() {
    return VIEWS.find((view) => view.id === state.view) || VIEWS[0];
  }

  function equalizeRowHeights() {
    const rows = els.expenseTable.querySelectorAll("tr");
    rows.forEach((row) => {
      const cells = [...row.querySelectorAll(".cell")];
      if (!cells.length) return;
      cells.forEach((cell) => {
        cell.style.minHeight = "";
      });
      const maxHeight = Math.max(...cells.map((cell) => cell.offsetHeight));
      cells.forEach((cell) => {
        cell.style.minHeight = `${maxHeight}px`;
      });
    });
  }

  function renderI18nStatic() {
    const dict = i18n[state.lang];
    document.documentElement.lang = state.lang === "bg" ? "bg" : "ru";
    document.title = dict.title;
    els.viewTabs.setAttribute("aria-label", dict.tabsLabel);

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

  function renderViewTabs() {
    const dict = i18n[state.lang];
    els.viewTabs.innerHTML = "";

    VIEWS.forEach((view) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "month-tab";
      btn.setAttribute("role", "tab");
      btn.dataset.view = view.id;
      btn.textContent = dict.views[view.id];

      const selected = state.view === view.id;
      btn.classList.toggle("is-selected", selected);
      btn.setAttribute("aria-selected", selected ? "true" : "false");

      btn.addEventListener("click", () => {
        state.view = view.id;
        render();
        btn.blur();
      });

      els.viewTabs.appendChild(btn);
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollSelectedTabIntoView(false);
        if (!state.hasSettledInitialScroll) {
          lockPageToTop();
          state.hasSettledInitialScroll = true;
        }
      });
    });
  }

  function scrollSelectedTabIntoView(smooth) {
    const scroller = els.viewTabs;
    const selectedBtn = scroller.querySelector(".is-selected");
    if (!selectedBtn) return;

    const scrollerWidth = scroller.clientWidth;
    const maxScroll = Math.max(0, scroller.scrollWidth - scrollerWidth);
    if (maxScroll === 0) return;

    const target =
      selectedBtn.offsetLeft + selectedBtn.offsetWidth / 2 - scrollerWidth / 2;
    const nextLeft = Math.min(maxScroll, Math.max(0, target));
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

  function columnLabel(dict, viewId, key) {
    return dict.viewColumns?.[viewId]?.[key] || dict.columns[key];
  }

  function renderTable() {
    const dict = i18n[state.lang];
    const view = currentView();
    const expenseKeys = view.expenses;
    const cols = ["apt", "residents", ...expenseKeys, "total"];

    els.expenseTable.classList.toggle("expense-table--wide", view.id === "september");

    els.tableHead.innerHTML = `
      <tr>
        ${cols
          .map((key) => {
            const sticky = key === "apt" ? " sticky-col" : "";
            return `<th class="${sticky}"><div class="cell cell--head">${columnLabel(
              dict,
              view.id,
              key
            )}</div></th>`;
          })
          .join("")}
      </tr>
    `;

    const billTotal = round2(
      expenseKeys.reduce((sum, key) => sum + (bills[key] ?? 0), 0)
    );

    const billCells = expenseKeys
      .map(
        (key) =>
          `<td><div class="cell cell--money cell--bill">${formatMoney(
            bills[key] ?? 0
          )}</div></td>`
      )
      .join("");

    const rows = [
      `
      <tr class="is-bill">
        <td class="sticky-col"><div class="cell cell--apt cell--bill">${dict.billRow}</div></td>
        <td><div class="cell cell--muted cell--bill"></div></td>
        ${billCells}
        <td><div class="cell cell--money cell--total cell--bill">${formatMoney(
          billTotal
        )}</div></td>
      </tr>
    `,
    ];

    APARTMENTS.forEach((apt) => {
      let rowTotal = 0;
      let participates = false;
      const moneyCells = expenseKeys
        .map((key) => {
          const share = shareFor(apt, key, bills[key] ?? 0);
          if (share === null) {
            return `<td><div class="cell cell--na">—</div></td>`;
          }
          participates = true;
          rowTotal += share;
          return `<td><div class="cell cell--money">${formatMoney(
            share
          )}</div></td>`;
        })
        .join("");

      const totalDisplay = participates
        ? formatMoney(round2(rowTotal))
        : "—";
      const totalClass = participates
        ? "cell cell--money cell--total"
        : "cell cell--na";

      rows.push(`
        <tr>
          <td class="sticky-col"><div class="cell cell--apt">${aptLabel(
            apt.id,
            dict
          )}</div></td>
          <td><div class="cell cell--muted">${apt.residents}</div></td>
          ${moneyCells}
          <td><div class="${totalClass}">${totalDisplay}</div></td>
        </tr>
      `);
    });

    els.tableBody.innerHTML = rows.join("");

    requestAnimationFrame(() => {
      equalizeRowHeights();
    });
  }

  function render() {
    renderI18nStatic();
    renderViewTabs();
    renderTable();
  }

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.lang = btn.dataset.lang;
      render();
      btn.blur();
    });
  });

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      scrollSelectedTabIntoView(false);
      equalizeRowHeights();
    }, 100);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      scrollSelectedTabIntoView(false);
      equalizeRowHeights();
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
