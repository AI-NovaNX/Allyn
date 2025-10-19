/* =========================
   AI-NovaNX To‑Do Logic (minor UX tweaks for PinkTech)
   ========================= */

(() => {
  // DOM refs
  const $ = (s) => document.querySelector(s);
  const form = $("#todo-form");
  const taskInput = $("#task-input");
  const noteInput = $("#note-input");
  const dateInput = $("#date-input");
  const errTitle = $("#err-title");
  const errDue = $("#err-due");
  const filterBtn = $("#filter-btn");
  const deleteAllBtn = $("#delete-all");
  const bodyEl = $("#todo-body");
  const bar = $("#progress-bar");
  const barText = $("#progress-text");
  const toastWrap = $("#toast-container");
  const themeToggle = $("#theme-toggle");
  const scrollArea = document.querySelector(".table-scroll");
  const MAX_VISIBLE_ROWS = 5;

  // State
  let todos = load();
  const FILTERS = ["ALL", "ACTIVE", "COMPLETED"];
  let fIndex = 0;

  // Utils
  function todayStr() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }
  function save() {
    localStorage.setItem("ainx_todos_v2", JSON.stringify(todos));
  }
  function load() {
    try {
      return JSON.parse(localStorage.getItem("ainx_todos_v2") || "[]");
    } catch {
      return [];
    }
  }
  function fmtDate(s) {
    try {
      return new Date(s + "T00:00:00").toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return s;
    }
  }
  function showToast(
    msg,
    { label = null, onClick = null, duration = 3500 } = {}
  ) {
    const el = document.createElement("div");
    el.className = "toast";
    const txt = document.createElement("div");
    txt.className = "msg";
    txt.textContent = msg;
    el.appendChild(txt);
    if (label && typeof onClick === "function") {
      const btn = document.createElement("button");
      btn.className = "undo";
      btn.type = "button";
      btn.textContent = label;
      btn.addEventListener(
        "click",
        () => {
          try {
            onClick();
          } catch (e) {}
          if (toastWrap.contains(el)) toastWrap.removeChild(el);
        },
        { once: true }
      );
      el.appendChild(btn);
    }
    toastWrap.appendChild(el);
    setTimeout(() => {
      if (!toastWrap.contains(el)) return;
      el.classList.add("toast-exit");
      setTimeout(() => {
        if (toastWrap.contains(el)) toastWrap.removeChild(el);
      }, 260);
    }, duration);
  }

  // Validation
  function validate() {
    errTitle.textContent = "";
    errDue.textContent = "";
    let ok = true;
    const t = taskInput.value.trim();
    const d = dateInput.value;
    if (!t) {
      errTitle.textContent = "Judul wajib diisi.";
      ok = false;
    }
    if (!d) {
      errDue.textContent = "Tanggal wajib diisi.";
      ok = false;
    } else {
      const dv = new Date(d);
      const t0 = new Date(todayStr());
      if (isNaN(dv.getTime())) {
        errDue.textContent = "Format tanggal tidak valid.";
        ok = false;
      } else if (dv < t0) {
        errDue.textContent = "Tanggal minimal hari ini atau setelahnya.";
        ok = false;
      }
    }
    return ok;
  }

  // Progress
  function updateProgress() {
    const total = todos.length;
    const done = todos.filter((t) => t.done).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    bar.style.width = pct + "%";
    barText.textContent = `${done} of ${total} (${pct}%)`;
    // Easter egg: encourage focus (ISTJ vibe)
    if (pct === 100 && total > 0)
      showToast("Semua selesai! Rapi dan mantap 💪");
  }

  // Render table
  function render() {
    bodyEl.innerHTML = "";

    let rows = [...todos];
    const mode = FILTERS[fIndex];
    if (mode === "ACTIVE") rows = rows.filter((x) => !x.done);
    if (mode === "COMPLETED") rows = rows.filter((x) => x.done);

    rows.sort((a, b) =>
      a.due === b.due
        ? a.title.localeCompare(b.title)
        : a.due.localeCompare(b.due)
    );

    if (rows.length === 0) {
      const tr = document.createElement("tr");
      tr.className = "empty";
      tr.innerHTML = `<td colspan="4">No task found</td>`;
      bodyEl.appendChild(tr);
      updateProgress();
      return;
    }

    for (const t of rows) {
      const tr = document.createElement("tr");
      tr.className = "row-enter";

      // Task (checkbox + text)
      const tdTask = document.createElement("td");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "check";
      cb.checked = t.done;
      cb.addEventListener("change", () => {
        t.done = cb.checked;
        save();
        render();
        showToast(t.done ? "Task completed 💗" : "Task re‑opened");
      });
      const span = document.createElement("span");
      span.textContent = t.title;
      if (t.done) span.classList.add("done");
      tdTask.appendChild(cb);
      tdTask.appendChild(span);

      // Note
      const tdNote = document.createElement("td");
      tdNote.textContent = t.note || "";

      // Due
      const tdDue = document.createElement("td");
      tdDue.textContent = fmtDate(t.due);

      // Status
      const tdStatus = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = t.done ? "COMPLETED" : "ACTIVE";
      tdStatus.appendChild(badge);

      // Actions
      const tdAct = document.createElement("td");
      tdAct.className = "actions";
      const toggleBtn = document.createElement("button");
      toggleBtn.className = "icon";
      toggleBtn.type = "button";
      toggleBtn.title = "Toggle status";
      toggleBtn.textContent = t.done ? "↩" : "✓";
      toggleBtn.addEventListener("click", () => {
        t.done = !t.done;
        save();
        render();
        showToast(t.done ? "Task completed 💗" : "Task re‑opened");
      });
      const delBtn = document.createElement("button");
      delBtn.className = "icon";
      delBtn.type = "button";
      delBtn.title = "Delete";
      delBtn.textContent = "🗑";
      delBtn.addEventListener("click", () => {
        const idx = todos.findIndex((x) => x.id === t.id);
        if (idx === -1) return;
        const removed = todos[idx];
        todos.splice(idx, 1);
        save();
        render();
        showToast("Task deleted", {
          label: "Undo",
          onClick() {
            const pos = Math.min(Math.max(0, idx), todos.length);
            todos.splice(pos, 0, removed);
            save();
            render();
          },
          duration: 12000,
        });
      });
      tdAct.appendChild(toggleBtn);
      tdAct.appendChild(delBtn);

      tr.appendChild(tdTask);
      tr.appendChild(tdNote);
      tr.appendChild(tdDue);
      tr.appendChild(tdStatus);
      tr.appendChild(tdAct);
      bodyEl.appendChild(tr);
    }

    updateProgress();
    adjustTableHeight(rows);
  }

  function adjustTableHeight(rows) {
    if (!scrollArea) return;
    scrollArea.style.maxHeight = "";
    let height = 0;
    let counted = 0;
    for (const r of bodyEl.querySelectorAll("tr")) {
      height += r.offsetHeight;
      counted++;
      if (counted >= MAX_VISIBLE_ROWS) break;
      if (r.classList.contains("empty")) break;
    }
    if (rows.length > MAX_VISIBLE_ROWS) {
      scrollArea.style.maxHeight = height + "px";
      scrollArea.style.overflowY = "auto";
    } else {
      scrollArea.style.maxHeight = "";
      scrollArea.style.overflowY = "";
    }
  }

  // Events
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) return;
    todos.push({
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 9),
      title: taskInput.value.trim(),
      note: noteInput.value.trim(),
      due: dateInput.value,
      done: false,
      createdAt: new Date().toISOString(),
    });
    save();
    form.reset();
    dateInput.value = todayStr();
    render();
    showToast("Task added ✨");
    if (scrollArea && scrollArea.scrollHeight > scrollArea.clientHeight) {
      scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: "smooth" });
    }
  });

  filterBtn.addEventListener("click", () => {
    fIndex = (fIndex + 1) % FILTERS.length;
    filterBtn.textContent = `FILTER: ${FILTERS[fIndex]}`;
    render();
  });

  deleteAllBtn.addEventListener("click", () => {
    if (!todos.length) return;
    if (!confirm("Hapus semua task?")) return;
    const snapshot = todos.map((x) => ({ ...x }));
    todos = [];
    save();
    render();
    showToast("All tasks cleared", {
      label: "Undo",
      onClick() {
        todos = snapshot.map((x) => ({ ...x }));
        save();
        render();
      },
      duration: 18000,
    });
  });

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem(
      "ainx_theme_light",
      document.body.classList.contains("light") ? "1" : "0"
    );
  });

  // Init
  dateInput.min = todayStr();
  dateInput.value = todayStr();
  if (localStorage.getItem("ainx_theme_light") === "1")
    document.body.classList.add("light");
  render();

  // Keyboard scrolling inside table
  document.addEventListener("keydown", (e) => {
    if (!scrollArea) return;
    if (e.key === "PageDown") {
      scrollArea.scrollBy({
        top: scrollArea.clientHeight * 0.9,
        behavior: "smooth",
      });
      e.preventDefault();
    } else if (e.key === "PageUp") {
      scrollArea.scrollBy({
        top: -scrollArea.clientHeight * 0.9,
        behavior: "smooth",
      });
      e.preventDefault();
    } else if (e.key === "Home") {
      scrollArea.scrollTo({ top: 0, behavior: "smooth" });
      e.preventDefault();
    } else if (e.key === "End") {
      scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: "smooth" });
      e.preventDefault();
    }
  });
})();
