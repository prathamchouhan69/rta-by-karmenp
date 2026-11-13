import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { references } from "./references";
import { charts } from "./charts";

const screens = ["Home", "Nature Library", "Charts", "Business OS", "Projects", "Files", "Tasks", "Accounting", "Transportation", "HR", "Relationships", "Flux Assistant", "Notifications", "Audit", "Offline & Sync", "Favorites", "Settings", "Auth", "Onboarding"];

export default function App() {
  const [screen, setScreen] = useState("Home");
  const [query, setQuery] = useState("");
  const [chartQuery, setChartQuery] = useState("");
  const [theme, setTheme] = useState("Dark");
  const [selectedRef, setSelectedRef] = useState<Reference | null>(null);
  const [selectedChart, setSelectedChart] = useState<Chart | null>(null);
  const filteredRefs = references.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  );
  const filteredCharts = charts.filter((c) =>
    c.name.toLowerCase().includes(chartQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#05070c] text-white flex relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.065] flex items-center justify-center"><img src="/karm-logo-watermark.png" alt="" className="w-[60vw] max-w-3xl" /></div>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#05070c]/80 backdrop-blur-sm border-b border-white/10 flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 text-xs animate-pulse">● SCANNING ZOHO</span>
          <span className="px-3 py-1 rounded bg-white/5 text-white/60 text-sm truncate max-w-[200px]">Home / Dashboard / Home Command Center</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded bg-white/5 text-white/60 hover:bg-white/10" title="Flux Search">⌘K</button>
          <button className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center" title="Flux">Φ</button>
        </div>
      </header>
      <aside className="w-60 border-r border-white/10 p-4 flex flex-col gap-2 pt-16">
        <div className="flex items-center gap-2 mb-4">
          <img src="/karm-logo-watermark.png" alt="KARM" className="h-8 w-8" />
          <span className="font-bold">RTA by KARM</span>
        </div>
        {screens.map((s) => (
          <button
            key={s}
            onClick={() => setScreen(s)}
            className={`text-left px-3 py-2 rounded ${screen === s ? "bg-cyan-500/20 text-cyan-300" : "text-white/60 hover:text-white hover:bg-white/5"}`}
          >
            {s}
          </button>
        ))}
      </aside>
      <main className="flex-1 p-6 overflow-auto pt-16 lg:pt-20">
        {screen === "Home" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Home Command Center</h1>
            <p className="text-white/60">Live system status. {references.length} references, {charts.length} charts indexed.</p>
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-sm text-cyan-300 mb-1">Live Accounting Scan</div>
              <div className="text-white/60 text-sm">Tesla Coil + Electric Eel + Cash-Flow + Receivables Aging</div>
              <div className="mt-2 h-2 rounded bg-white/10 overflow-hidden">
                <div className="h-full bg-cyan-400 w-2/3 animate-pulse" />
              </div>
              <div className="text-xs text-white/30 mt-3 italic">Inspired by Tesla Coil, Electric Eel, Cash-Flow, and Receivables Aging.</div>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-sm text-cyan-300 mb-1">Recovery & Resilience</div>
              <div className="text-white/60 text-sm">Immortal Jellyfish + Tardigrade + Recovery History + Sync Health</div>
              <div className="text-xs text-white/30 mt-3 italic">Inspired by Immortal Jellyfish, Tardigrade, Recovery History, and Sync Health.</div>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-sm text-cyan-300 mb-1">Smart Routing & Workload</div>
              <div className="text-white/60 text-sm">Slime Mold + Ant Colony + Route Efficiency + Task Distribution</div>
              <div className="text-xs text-white/30 mt-3 italic">Inspired by Slime Mold, Ant Colony, Route Efficiency, and Task Distribution.</div>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-sm text-cyan-300 mb-1">Risk & Overdue Payments</div>
              <div className="text-white/60 text-sm">Black Hole + Time Dilation + Risk Concentration + Receivables Aging</div>
              <div className="text-xs text-white/30 mt-3 italic">Inspired by Black Hole, Time Dilation, Risk Concentration, and Receivables Aging.</div>
            </div>
          </div>
        )}
        {screen === "Nature Library" && (
          <div>
            <h1 className="text-3xl font-bold mb-4">Impossible Nature Library</h1>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 169 references..."
              className="w-full mb-4 px-4 py-2 rounded bg-white/5 border border-white/10"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredRefs.map((r) => (
                <div key={r.id} onClick={() => setSelectedRef(r)} className="p-3 rounded bg-white/5 border border-white/10 hover:border-cyan-500/40 cursor-pointer">
                  <div className="font-semibold text-sm">{r.name}</div>
                  <div className="text-xs text-white/40">{r.category}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-white/40 text-sm">Showing {filteredRefs.length} of {references.length}</div>
          </div>
        )}
        {screen === "Charts" && (
          <div>
            <h1 className="text-3xl font-bold mb-4">Charts Library</h1>
            <input
              value={chartQuery}
              onChange={(e) => setChartQuery(e.target.value)}
              placeholder="Search 95 charts..."
              className="w-full mb-4 px-4 py-2 rounded bg-white/5 border border-white/10"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredCharts.map((c) => (
                <div key={c.id} onClick={() => setSelectedChart(c)} className="p-3 rounded bg-white/5 border border-white/10 hover:border-cyan-500/40 cursor-pointer">
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs text-white/40">{c.module}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-white/40 text-sm">Showing {filteredCharts.length} of {charts.length}</div>
          </div>
        )}
        {screen === "Tasks" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Tasks</h1>
            <p className="text-white/60">Task management coming next.</p>
          </div>
        )}
        {screen === "Settings" && (
          <div>
            <h1 className="text-3xl font-bold mb-4">Settings</h1>
            <div className="flex gap-3">
              {["Light","Dark","Aurora"].map((t) => (
                <button key={t} onClick={() => setTheme(t)}
                  className={`px-4 py-2 rounded ${theme===t ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "bg-white/5 text-white/60 border border-white/10"}`}>
                  {t}
                </button>
              ))}
            </div>
            <p className="text-white/40 text-sm mt-3">Active theme: {theme}</p>
          </div>
        )}

        {screen === "Business OS" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Business OS Dashboard</h1>
            <p className="text-white/60">Macro health index, liquid runway, fleet & team velocity.</p>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {["Revenue","Profit","Cash Flow"].map((k) => (
                <div key={k} className="p-4 rounded bg-white/5 border border-white/10">
                  <div className="text-white/40 text-sm">{k}</div>
                  <div className="text-2xl font-bold mt-1">—</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {screen === "Projects" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Projects & Living S-Curve</h1>
            <p className="text-white/60">Gantt timeline & milestones coming next.</p>
          </div>
        )}
        {screen === "Files" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Files & Vault</h1>
            <p className="text-white/60">Fractal branching network visualization coming next.</p>
          </div>
        )}
        {screen === "Accounting" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Accounting & Zoho Books</h1>
            <p className="text-white/60">Live reconciliation, overdue invoices, payment triggers.</p>
          </div>
        )}
        {screen === "Transportation" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Transportation & Fleet</h1>
            <p className="text-white/60">Slime mold heuristic routing and dwell time tracking.</p>
          </div>
        )}
        {screen === "HR" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Human Resources & Talent</h1>
            <p className="text-white/60">Starling murmuration attendance & retention cohorts.</p>
          </div>
        )}
        {screen === "Relationships" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Relationships & CRM</h1>
            <p className="text-white/60">Mycorrhizal network graph and client ecosystem health.</p>
          </div>
        )}

        {screen === "Flux Assistant" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Flux Autonomous Assistant</h1>
            <p className="text-white/60">Universal search (Cmd+K) and AI briefing coming next.</p>
            <div className="mt-4 p-4 rounded bg-white/5 border border-white/10">
              <input placeholder="Ask Flux anything..." className="w-full px-4 py-2 rounded bg-white/5 border border-white/10" />
            </div>
          </div>
        )}
        {screen === "Notifications" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications & Dispatch Log</h1>
            <p className="text-white/60">Alerts and dispatch history coming next.</p>
          </div>
        )}
        {screen === "Audit" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Audit & Traceability Log</h1>
            <p className="text-white/60">System operations log coming next.</p>
          </div>
        )}

        {screen === "Offline & Sync" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Offline & Sync Recovery</h1>
            <p className="text-white/60">Sync health and offline queue status.</p>
          </div>
        )}
        {screen === "Favorites" && (
          <div>
            <h1 className="text-3xl font-bold mb-2">My Selections & Favorites</h1>
            <p className="text-white/60">Saved references and charts.</p>
          </div>
        )}
      {selectedChart && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6" onClick={() => setSelectedChart(null)}>
          <div className="bg-[#12151c] border border-white/10 rounded-xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-2">{selectedChart.name}</h2>
            <div className="text-xs text-cyan-300 mb-3">{selectedChart.module}</div>
            <div className="h-64 rounded bg-white/5 mb-3">
              <ResponsiveContainer width="100%" height="100%">
                {selectedChart.name.includes("Trend") || selectedChart.name.includes("Forecast") ? (
                  <LineChart data={[{t:1,v:10},{t:2,v:20},{t:3,v:15},{t:4,v:30},{t:5,v:25}]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="white/10" />
                    <XAxis dataKey="t" stroke="white/40" />
                    <YAxis stroke="white/40" />
                    <Tooltip />
                    <Line type="monotone" dataKey="v" stroke="#00f0ff" strokeWidth={2} dot={false} />
                  </LineChart>
                ) : selectedChart.name.includes("Donut") || selectedChart.name.includes("Breakdown") ? (
                  <PieChart>
                    <Pie data={[{name:"A",value:40},{name:"B",value:30},{name:"C",value:20},{name:"D",value:10}]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                      <Cell fill="#00f0ff" />
                      <Cell fill="#22d3a6" />
                      <Cell fill="#bd68f6" />
                      <Cell fill="#f4ba42" />
                    </Pie>
                  </PieChart>
                ) : (
                  <BarChart data={[{t:1,v:10},{t:2,v:20},{t:3,v:15},{t:3,v:30},{t:4,v:25}]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="white/10" />
                    <XAxis dataKey="t" stroke="white/40" />
                    <YAxis stroke="white/40" />
                    <Tooltip />
                    <Bar dataKey="v" fill="#00f0ff" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
            <p className="text-white/50 text-sm mt-2">Units, legend, data source, nature-reference connection, and export options.</p>
            <button onClick={() => setSelectedChart(null)} className="mt-4 px-4 py-2 rounded bg-cyan-500/20 text-cyan-300">Close</button>
          </div>
        </div>
      )}

        {screen === "Auth" && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="p-8 rounded-xl bg-white/5 border border-white/10 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
              <input placeholder="Email" className="w-full mb-4 px-4 py-2 rounded bg-white/5 border border-white/10" />
              <input type="password" placeholder="Password" className="w-full mb-4 px-4 py-2 rounded bg-white/5 border border-white/10" />
              <button className="w-full py-2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">Sign In</button>
              <p className="text-center text-white/40 text-sm mt-4">Or continue with Practice Sandbox</p>
            </div>
          </div>
        )}
        {screen === "Onboarding" && (
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Welcome to RTA by KARM</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["Nature-Connected OS","Financial Intelligence","Health & Safety"].map((t,i) => (
                <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-xl font-bold mb-2">{t}</h3>
                  <p className="text-white/60">Explore how nature principles guide your business, money, and health decisions.</p>
                </div>
              ))}
            </div>
          </div>
        )}
      {selectedRef && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6" onClick={() => setSelectedRef(null)}>
          <div className="bg-[#12151c] border border-white/10 rounded-xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-2">{selectedRef.name}</h2>
            <div className="text-xs text-cyan-300 mb-3">{selectedRef.category}</div>
            <p className="text-white/70 mb-2">{selectedRef.scientific}</p>
            <p className="text-white/50 text-sm mb-2"><b>Nature meaning:</b> {selectedRef.natureMeaning}</p>
            <p className="text-white/50 text-sm mb-2"><b>App meaning:</b> {selectedRef.appMeaning}</p>
            <p className="text-white/50 text-sm mb-2"><b>Module:</b> {selectedRef.module} · <b>Chart:</b> {selectedRef.chart}</p>
            <p className="text-white/40 text-xs italic mt-3">Inspired by {selectedRef.name}, {selectedRef.chart}.</p>
            <button onClick={() => setSelectedRef(null)} className="mt-4 px-4 py-2 rounded bg-cyan-500/20 text-cyan-300">Close</button>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
