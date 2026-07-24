"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { Plus, X, Check, Clock, Trash2, ArrowLeft, RotateCcw, Flame, MapPin, Lock } from "lucide-react";
import { INTERVALS, uid, todayISO, addDays, daysUntil, orderedItems } from "../lib/utils";

// Three.js touches the DOM/canvas directly — must be client-only, no SSR.
const Scene3D = dynamic(() => import("../components/Scene3D"), { ssr: false });

export default function Page() {
  const [palaces, setPalaces] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [view, setView] = useState({ screen: "dashboard" });

  useEffect(() => {
    fetch("/api/palaces")
      .then(async (res) => {
        if (res.status === 401) {
          setAuthed(false);
          setLoaded(true);
          return;
        }
        if (res.ok) {
          setPalaces(await res.json());
          setAuthed(true);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const persist = useCallback((next) => {
    setPalaces(next);
    fetch("/api/palaces", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => {});
  }, []);

  const updatePalace = (palaceId, updater) => {
    persist(palaces.map((p) => (p.id === palaceId ? updater(p) : p)));
  };

  const resetAll = () => {
    if (!window.confirm("Erase all palaces and progress? This can't be undone.")) return;
    persist([]);
    setView({ screen: "dashboard" });
  };

  const currentPalace = palaces.find((p) => p.id === view.palaceId);
  const currentList = currentPalace?.lists.find((l) => l.id === view.listId);

  if (!loaded) {
    return (
      <Shell>
        <div className="mp-mono" style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
          loading your palaces…
        </div>
      </Shell>
    );
  }

  if (!authed) {
    return (
      <Shell>
        <PasscodeGate
          onAuthed={() => {
            setAuthed(true);
            fetch("/api/palaces")
              .then((res) => (res.ok ? res.json() : []))
              .then(setPalaces)
              .catch(() => {});
          }}
        />
      </Shell>
    );
  }

  return (
    <Shell onReset={resetAll} showReset={palaces.length > 0}>
      {view.screen === "dashboard" && <Dashboard palaces={palaces} setView={setView} persist={persist} />}
      {view.screen === "palace" && <PalaceEditor palace={currentPalace} updatePalace={updatePalace} setView={setView} />}
      {view.screen === "study" && <StudyMode3D palace={currentPalace} list={currentList} setView={setView} />}
      {view.screen === "quiz" && (
        <QuizMode3D
          palace={currentPalace}
          list={currentList}
          setView={setView}
          onComplete={(result) => {
            updatePalace(view.palaceId, (p) => ({
              ...p,
              lists: p.lists.map((l) => {
                if (l.id !== view.listId) return l;
                const pct = result.total ? result.correct / result.total : 0;
                const nextIdx = pct >= 0.8 ? Math.min((l.intervalIndex ?? -1) + 1, INTERVALS.length - 1) : 0;
                return {
                  ...l,
                  intervalIndex: nextIdx,
                  nextReview: addDays(todayISO(), INTERVALS[nextIdx]),
                  history: [...(l.history || []), { date: todayISO(), correct: result.correct, total: result.total, timeSec: result.timeSec }],
                };
              }),
            }));
            setView({ screen: "results", palaceId: view.palaceId, listId: view.listId, result });
          }}
        />
      )}
      {view.screen === "results" && (
        <ResultsScreen palace={currentPalace} list={currentList} result={view.result} setView={setView} />
      )}
    </Shell>
  );
}

function PasscodeGate({ onAuthed }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!passcode || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        onAuthed();
      } else {
        setError("Incorrect passcode");
      }
    } catch {
      setError("Couldn't reach the server — try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mp-fade-in" style={{ textAlign: "center", padding: "60px 10px" }}>
      <Lock size={22} color="var(--brass)" style={{ marginBottom: 14 }} />
      <p className="mp-display" style={{ fontSize: 19, marginBottom: 20 }}>Enter passcode</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <input
          autoFocus
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={{ ...inputStyle, maxWidth: 200 }}
        />
        <button onClick={submit} disabled={submitting} className="mp-btn" style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}>
          <Check size={16} />
        </button>
      </div>
      {error && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 14 }}>{error}</p>}
    </div>
  );
}

function Shell({ children, onReset, showReset }) {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 60px" }}>
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 24,
          borderBottom: "1px solid var(--line)",
          paddingBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MapPin size={18} color="var(--brass)" strokeWidth={2} />
          <h1 className="mp-display" style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
            Memory Palace
          </h1>
        </div>
        {showReset && (
          <button
            onClick={onReset}
            className="mp-btn mp-mono"
            style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
          >
            <RotateCcw size={12} /> reset all
          </button>
        )}
      </header>
      {children}
    </div>
  );
}

// ---------------- Dashboard ----------------
function Dashboard({ palaces, setView, persist }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const createPalace = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const p = { id: uid(), name: trimmed, createdAt: todayISO(), stops: [], lists: [] };
    persist([...palaces, p]);
    setName("");
    setCreating(false);
    setView({ screen: "palace", palaceId: p.id });
  };

  if (palaces.length === 0 && !creating) {
    return (
      <div className="mp-fade-in" style={{ textAlign: "center", padding: "60px 10px" }}>
        <p className="mp-display" style={{ fontSize: 19, marginBottom: 8 }}>No palaces yet.</p>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 28, lineHeight: 1.6 }}>
          Build a palace, add stops along the route, then place what you want to remember at each stop.
        </p>
        <button onClick={() => setCreating(true)} className="mp-btn" style={btnPrimary}>
          <Plus size={16} /> Build your first palace
        </button>
      </div>
    );
  }

  return (
    <div className="mp-fade-in">
      {creating ? (
        <div style={panelStyle}>
          <label className="mp-mono" style={labelStyle}>PALACE NAME</label>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createPalace()} placeholder="e.g. Childhood home" style={inputStyle} />
            <button onClick={createPalace} className="mp-btn" style={btnPrimarySmall}><Check size={16} /></button>
            <button onClick={() => { setCreating(false); setName(""); }} className="mp-btn" style={btnGhostSmall}><X size={16} /></button>
          </div>
        </div>
      ) : (
        <button onClick={() => setCreating(true)} className="mp-btn" style={{ ...btnGhost, width: "100%", marginBottom: 20, justifyContent: "center" }}>
          <Plus size={15} /> New palace
        </button>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {palaces.map((p) => (
          <PalaceCard key={p.id} palace={p} setView={setView} />
        ))}
      </div>
    </div>
  );
}

function PalaceCard({ palace, setView }) {
  const dueLists = palace.lists.filter((l) => l.nextReview && daysUntil(l.nextReview) <= 0);
  return (
    <div style={{ ...panelStyle, cursor: "pointer" }} onClick={() => setView({ screen: "palace", palaceId: palace.id })} className="mp-btn">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="mp-display" style={{ fontSize: 17, fontWeight: 500 }}>{palace.name}</div>
          <div className="mp-mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
            {palace.stops.length} stop{palace.stops.length !== 1 ? "s" : ""} · {palace.lists.length} list{palace.lists.length !== 1 ? "s" : ""}
          </div>
        </div>
        {dueLists.length > 0 && (
          <div className="mp-mono mp-pulse" style={{ fontSize: 10, color: "var(--brass)", display: "flex", alignItems: "center", gap: 4 }}>
            <Flame size={12} /> {dueLists.length} due
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Palace Editor (2D — defining the route & lists) ----------------
function PalaceEditor({ palace, updatePalace, setView }) {
  const [newStop, setNewStop] = useState("");
  const [addingList, setAddingList] = useState(false);

  if (!palace) return null;

  const addStop = () => {
    const t = newStop.trim();
    if (!t) return;
    updatePalace(palace.id, (p) => ({ ...p, stops: [...p.stops, { id: uid(), label: t }] }));
    setNewStop("");
  };
  const removeStop = (stopId) => {
    updatePalace(palace.id, (p) => ({
      ...p,
      stops: p.stops.filter((s) => s.id !== stopId),
      lists: p.lists.map((l) => ({ ...l, items: l.items.map((it) => (it.stopId === stopId ? { ...it, stopId: null } : it)) })),
    }));
  };

  return (
    <div className="mp-fade-in">
      <BackRow onClick={() => setView({ screen: "dashboard" })} label="all palaces" />
      <h2 className="mp-display" style={{ fontSize: 20, margin: "6px 0 4px" }}>{palace.name}</h2>
      <p className="mp-mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 22 }}>the route (arranged automatically in the 3D room)</p>

      <div style={{ ...panelStyle, marginBottom: 24 }}>
        {palace.stops.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>Add stops — front door, hallway, kitchen…</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {palace.stops.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="mp-mono" style={{ fontSize: 11, color: "var(--brass)", width: 18 }}>{i + 1}</span>
              <span style={{ flexGrow: 1, fontSize: 14 }}>{s.label}</span>
              <button onClick={() => removeStop(s.id)} className="mp-btn" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={13} /></button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: palace.stops.length ? 14 : 0 }}>
          <input type="text" value={newStop} onChange={(e) => setNewStop(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addStop()} placeholder="Next stop…" style={inputStyle} />
          <button onClick={addStop} className="mp-btn" style={btnPrimarySmall}><Plus size={16} /></button>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <ScenePreview stops={palace.stops} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <p className="mp-mono" style={{ fontSize: 11, color: "var(--muted)" }}>things to remember</p>
        <button onClick={() => setAddingList(true)} className="mp-btn" style={{ ...btnGhostSmall, display: "flex", alignItems: "center", gap: 4 }}>
          <Plus size={13} /> list
        </button>
      </div>

      {addingList && (
        <NewListForm palace={palace} onCancel={() => setAddingList(false)} onCreate={(list) => { updatePalace(palace.id, (p) => ({ ...p, lists: [...p.lists, list] })); setAddingList(false); }} />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {palace.lists.map((list) => (
          <ListCard key={list.id} palace={palace} list={list} updatePalace={updatePalace} setView={setView} />
        ))}
      </div>
    </div>
  );
}

function ScenePreview({ stops }) {
  const [active, setActive] = useState(null);
  return (
    <Scene3D
      stops={stops}
      stateByStop={active ? { [active]: "active" } : {}}
      activeStopId={active}
      onStopClick={(id) => setActive((cur) => (cur === id ? null : id))}
      overlayContent={
        active ? (
          <div style={overlayCardStyle}>{stops.find((s) => s.id === active)?.label}</div>
        ) : null
      }
    />
  );
}

function NewListForm({ palace, onCancel, onCreate }) {
  const [name, setName] = useState("");
  const [items, setItems] = useState([{ id: uid(), text: "", stopId: "", image: "" }]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const updateItem = (id, field, val) => setItems(items.map((it) => (it.id === id ? { ...it, [field]: val } : it)));
  const addItem = () => setItems([...items, { id: uid(), text: "", stopId: "", image: "" }]);
  const removeItem = (id) => setItems(items.filter((it) => it.id !== id));
  const canSave = name.trim() && items.some((it) => it.text.trim());

  const parsedLines = bulkText
    .split("\n")
    .map((l) => l.trim().replace(/^[\d]+[.)]\s*|^[-•*]\s*/, "").trim())
    .filter(Boolean);

  const importBulk = () => {
    if (!parsedLines.length) return;
    setItems(parsedLines.map((text, i) => ({ id: uid(), text, stopId: palace.stops[i]?.id || "", image: "" })));
    setBulkMode(false);
    setBulkText("");
  };

  const save = () => {
    if (!canSave) return;
    onCreate({
      id: uid(),
      name: name.trim(),
      items: items.filter((it) => it.text.trim()).map((it) => ({ ...it, text: it.text.trim() })),
      history: [],
      intervalIndex: -1,
      nextReview: todayISO(),
    });
  };

  return (
    <div style={{ ...panelStyle, marginBottom: 14 }} className="mp-fade-in">
      <label className="mp-mono" style={labelStyle}>LIST NAME</label>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grocery run" style={{ ...inputStyle, width: "100%", marginTop: 6, marginBottom: 16 }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label className="mp-mono" style={labelStyle}>ITEMS</label>
        <button
          onClick={() => setBulkMode((b) => !b)}
          className="mp-btn mp-mono"
          style={{ background: "none", border: "none", color: "var(--brass)", fontSize: 10, cursor: "pointer", letterSpacing: 0.4, padding: 0 }}
        >
          {bulkMode ? "← manual" : "paste from Claude"}
        </button>
      </div>

      {bulkMode ? (
        <div style={{ marginTop: 8 }}>
          <textarea
            autoFocus
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"Paste one item per line — numbered lists, bullets, plain lines all work:\n\n1. Battle of Hastings — 1066\n2. Magna Carta — 1215\n3. Black Death arrives — 1348"}
            style={{ ...inputStyle, width: "100%", height: 180, resize: "vertical", lineHeight: 1.7, fontSize: 13 }}
          />
          <div className="mp-mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 6 }}>
            {parsedLines.length > 0
              ? `${parsedLines.length} item${parsedLines.length !== 1 ? "s" : ""} detected — will be assigned to stops in order`
              : "paste your Claude output above"}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={importBulk}
              disabled={!parsedLines.length}
              className="mp-btn"
              style={{ ...btnPrimary, opacity: parsedLines.length ? 1 : 0.4, cursor: parsedLines.length ? "pointer" : "not-allowed" }}
            >
              <Check size={14} /> Import {parsedLines.length || ""} items
            </button>
            <button onClick={onCancel} className="mp-btn" style={btnGhost}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            {items.map((it) => (
              <div key={it.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input type="text" value={it.text} onChange={(e) => updateItem(it.id, "text", e.target.value)} placeholder="item" style={{ ...inputStyle, flex: 2 }} />
                <select value={it.stopId} onChange={(e) => updateItem(it.id, "stopId", e.target.value)} style={{ ...inputStyle, flex: 1.4, color: it.stopId ? "var(--parchment)" : "var(--muted)" }}>
                  <option value="">stop…</option>
                  {palace.stops.map((s) => (
                    <option key={s.id} value={s.id} style={{ color: "#1B2129" }}>{s.label}</option>
                  ))}
                </select>
                <button onClick={() => removeItem(it.id)} className="mp-btn" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={14} /></button>
              </div>
            ))}
          </div>
          <button onClick={addItem} className="mp-btn" style={{ ...btnGhostSmall, marginTop: 10, display: "flex", alignItems: "center", gap: 4 }}>
            <Plus size={12} /> item
          </button>
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button onClick={save} disabled={!canSave} className="mp-btn" style={{ ...btnPrimary, opacity: canSave ? 1 : 0.4, cursor: canSave ? "pointer" : "not-allowed" }}>
              <Check size={14} /> Save list
            </button>
            <button onClick={onCancel} className="mp-btn" style={btnGhost}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}

function ListCard({ palace, list, updatePalace, setView }) {
  const due = list.nextReview && daysUntil(list.nextReview) <= 0;
  const dueLabel = !list.history.length ? "not studied yet" : due ? "due now" : `due in ${daysUntil(list.nextReview)}d`;
  const lastEntry = list.history[list.history.length - 1];

  const remove = (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${list.name}"?`)) return;
    updatePalace(palace.id, (p) => ({ ...p, lists: p.lists.filter((l) => l.id !== list.id) }));
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>{list.name}</div>
          <div className="mp-mono" style={{ fontSize: 11, color: due ? "var(--brass)" : "var(--muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
            {list.history.length > 0 && <Clock size={11} />} {dueLabel}
            {lastEntry && <span style={{ color: "var(--muted)" }}> · last {lastEntry.correct}/{lastEntry.total}</span>}
          </div>
        </div>
        <button onClick={remove} className="mp-btn" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><Trash2 size={14} /></button>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={() => setView({ screen: "study", palaceId: palace.id, listId: list.id })} className="mp-btn" style={btnGhostSmall}>Walk through</button>
        <button onClick={() => setView({ screen: "quiz", palaceId: palace.id, listId: list.id })} className="mp-btn" style={btnPrimarySmall}>Test recall</button>
      </div>
    </div>
  );
}

// ---------------- Study Mode (3D — click a stop to reveal) ----------------
function StudyMode3D({ palace, list, setView }) {
  const [revealedId, setRevealedId] = useState(null);
  const [seen, setSeen] = useState(new Set());
  if (!palace || !list) return null;
  const items = orderedItems(palace, list);
  const back = () => setView({ screen: "palace", palaceId: palace.id });

  if (items.length === 0) {
    return (
      <div className="mp-fade-in">
        <BackRow onClick={back} label={palace.name} />
        <p style={{ marginTop: 40, textAlign: "center", color: "var(--muted)" }}>No items assigned to stops yet.</p>
      </div>
    );
  }

  const stopsWithItems = items.map((it) => ({ id: it.stopId, label: it.stopLabel }));
  const current = items.find((it) => it.stopId === revealedId);

  return (
    <div className="mp-fade-in">
      <BackRow onClick={back} label={palace.name} />
      <div className="mp-mono" style={{ fontSize: 11, color: "var(--muted)", margin: "18px 0 10px" }}>
        click a pedestal to reveal what's there — {seen.size}/{items.length} seen
      </div>
      <Scene3D
        stops={stopsWithItems}
        stateByStop={Object.fromEntries(stopsWithItems.map((s) => [s.id, seen.has(s.id) ? "correct" : s.id === revealedId ? "active" : "default"]))}
        activeStopId={revealedId}
        onStopClick={(id) => {
          setRevealedId(id);
          setSeen((prev) => new Set(prev).add(id));
        }}
        overlayContent={current ? <div style={overlayCardStyle}>{current.text}{current.image && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{current.image}</div>}</div> : null}
      />
      <button onClick={() => setView({ screen: "quiz", palaceId: palace.id, listId: list.id })} className="mp-btn" style={{ ...btnPrimary, width: "100%", justifyContent: "center", marginTop: 18 }}>
        test recall
      </button>
    </div>
  );
}

// ---------------- Quiz Mode (3D — click a stop to answer) ----------------
function QuizMode3D({ palace, list, onComplete, setView }) {
  const [activeId, setActiveId] = useState(null);
  const [answer, setAnswer] = useState("");
  const [answered, setAnswered] = useState({}); // stopId -> { correct, given }
  const [startTime] = useState(Date.now());
  const back = () => setView({ screen: "palace", palaceId: palace.id });

  if (!palace || !list) return null;
  const items = orderedItems(palace, list);
  if (items.length === 0) {
    return (
      <div className="mp-fade-in">
        <BackRow onClick={back} label={palace.name} />
        <p style={{ marginTop: 40, textAlign: "center", color: "var(--muted)" }}>No items assigned to stops yet.</p>
      </div>
    );
  }

  const stopsWithItems = items.map((it) => ({ id: it.stopId, label: it.stopLabel }));
  const allAnswered = Object.keys(answered).length === items.length;
  const activeItem = items.find((it) => it.stopId === activeId);

  const submitAnswer = () => {
    if (!activeItem) return;
    const correct = answer.trim().toLowerCase() === activeItem.text.trim().toLowerCase();
    const next = { ...answered, [activeItem.stopId]: { correct, given: answer } };
    setAnswered(next);
    setAnswer("");
    if (Object.keys(next).length === items.length) {
      const correctCount = Object.values(next).filter((r) => r.correct).length;
      const details = items.map((it) => ({ ...it, given: next[it.stopId]?.given, correct: next[it.stopId]?.correct }));
      setTimeout(() => onComplete({ correct: correctCount, total: items.length, timeSec: Math.round((Date.now() - startTime) / 1000), details }), 400);
    } else {
      setActiveId(null);
    }
  };

  return (
    <div className="mp-fade-in">
      <BackRow onClick={back} label={palace.name} />
      <div className="mp-mono" style={{ fontSize: 11, color: "var(--muted)", margin: "18px 0 10px" }}>
        {Object.keys(answered).length}/{items.length} answered — click each pedestal
      </div>
      <Scene3D
        stops={stopsWithItems}
        stateByStop={Object.fromEntries(
          stopsWithItems.map((s) => [s.id, answered[s.id] ? (answered[s.id].correct ? "correct" : "wrong") : s.id === activeId ? "active" : "default"])
        )}
        activeStopId={activeId}
        onStopClick={(id) => {
          if (answered[id]) return;
          setActiveId(id);
          setAnswer("");
        }}
        overlayContent={
          activeItem ? (
            <div style={overlayCardStyle}>
              <input
                autoFocus
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
                placeholder="what's here?"
                style={{ ...inputStyle, width: 160, fontSize: 13, padding: "6px 8px" }}
              />
              <button onClick={submitAnswer} className="mp-btn" style={{ ...btnPrimarySmall, marginTop: 6, width: "100%", justifyContent: "center" }}>
                check
              </button>
            </div>
          ) : null
        }
      />
      {!allAnswered && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12, textAlign: "center" }}>Answer every stop to see your score.</p>}
    </div>
  );
}

// ---------------- Results ----------------
function ResultsScreen({ palace, list, result, setView }) {
  if (!palace || !list || !result) return null;
  const pct = Math.round((result.correct / result.total) * 100);
  const nextIdx = list.intervalIndex ?? 0;
  return (
    <div className="mp-fade-in" style={{ textAlign: "center", padding: "30px 0" }}>
      <div className="mp-mono" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>RESULT</div>
      <div className="mp-display" style={{ fontSize: 44, fontWeight: 600, color: pct >= 80 ? "var(--success)" : "var(--brass)" }}>
        {result.correct}/{result.total}
      </div>
      <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>{pct}% · {result.timeSec}s</div>

      <div style={{ ...panelStyle, textAlign: "left", marginTop: 28 }}>
        {result.details.map((d, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: idx < result.details.length - 1 ? "1px solid var(--line)" : "none", fontSize: 13 }}>
            <span style={{ color: "var(--muted)" }}>{d.stopLabel}</span>
            <span style={{ color: d.correct ? "var(--success)" : "var(--danger)" }}>{d.text}</span>
          </div>
        ))}
      </div>

      <div className="mp-mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 20 }}>
        next review in {INTERVALS[nextIdx]} day{INTERVALS[nextIdx] !== 1 ? "s" : ""}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 24, justifyContent: "center" }}>
        <button onClick={() => setView({ screen: "quiz", palaceId: palace.id, listId: list.id })} className="mp-btn" style={btnGhost}>try again</button>
        <button onClick={() => setView({ screen: "palace", palaceId: palace.id })} className="mp-btn" style={btnPrimary}>done</button>
      </div>
    </div>
  );
}

// ---------------- shared bits ----------------
function BackRow({ onClick, label }) {
  return (
    <button onClick={onClick} className="mp-btn mp-mono" style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
      <ArrowLeft size={12} /> {label}
    </button>
  );
}

const panelStyle = { background: "var(--blueprint)", border: "1px solid var(--line)", borderRadius: 10, padding: "18px 20px" };
const labelStyle = { fontSize: 10, color: "var(--muted)", letterSpacing: 0.5 };
const inputStyle = { background: "var(--ink)", border: "1px solid var(--line)", borderRadius: 6, padding: "9px 12px", color: "var(--parchment)", fontSize: 14, width: "100%" };
const btnPrimary = { background: "var(--brass)", color: "var(--ink)", border: "none", borderRadius: 7, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 };
const btnPrimarySmall = { ...btnPrimary, padding: "8px 12px" };
const btnGhost = { background: "none", color: "var(--parchment)", border: "1px solid var(--line)", borderRadius: 7, padding: "10px 18px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 };
const btnGhostSmall = { ...btnGhost, padding: "7px 12px", fontSize: 12 };
const overlayCardStyle = {
  background: "rgba(27,33,41,0.95)",
  border: "1px solid var(--brass)",
  borderRadius: 8,
  padding: "10px 14px",
  color: "var(--parchment)",
  fontSize: 13,
  fontFamily: "Inter, sans-serif",
  minWidth: 120,
  textAlign: "center",
  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
};
