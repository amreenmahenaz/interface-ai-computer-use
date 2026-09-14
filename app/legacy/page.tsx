"use client";

import { useState } from "react";

const members: Record<string, { name: string; balance: string }> = {
  "12345": { name: "Demo Member", balance: "$4,218.37" },
  "54321": { name: "Sample Member", balance: "$950.00" },
};

export default function LegacyMemberConsole() {
  const [memberId, setMemberId] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "found" | "missing" | "invalid">("idle");
  const find = () => {
    if (!/^\d{5}$/.test(memberId)) return setState("invalid");
    setState("loading");
    window.setTimeout(() => setState(members[memberId] ? "found" : "missing"), 450);
  };
  return (
    <main className="min-h-screen bg-[#d8d3c5] p-8 font-mono text-black">
      <section className="mx-auto max-w-3xl border-4 border-double border-black bg-[#eee9d8] p-4 shadow-[8px_8px_0_#555]">
        <header className="mb-5 bg-[#162b59] p-3 text-center text-xl font-bold text-white">HERITAGE CORE :: MEMBER SERVICING</header>
        <table className="w-full border-collapse"><tbody><tr><td className="border border-black p-3">Member number</td><td className="border border-black p-3"><input aria-label="Member number" value={memberId} onChange={e => setMemberId(e.target.value)} className="border-2 border-inset border-gray-500 bg-white px-2 py-1" /></td><td className="border border-black p-3"><button onClick={find} className="border-2 border-outset border-gray-500 bg-gray-200 px-4 py-1">Find member</button></td></tr></tbody></table>
        {state === "loading" && <p role="status" className="mt-5 border border-black bg-yellow-100 p-3">Loading host record…</p>}
        {state === "invalid" && <p role="alert" className="mt-5 border border-red-900 bg-red-100 p-3">Validation error: member number must be 5 digits.</p>}
        {state === "missing" && <p role="alert" className="mt-5 border border-amber-900 bg-amber-100 p-3">No member found for this number.</p>}
        {state === "found" && <div aria-label="Member record" className="mt-5 border-2 border-black bg-white p-4"><h2 className="font-bold">MEMBER DETAIL</h2><p>Name: {members[memberId].name}</p><p>Savings balance: <output aria-label="Savings balance">{members[memberId].balance}</output></p><button className="mt-4 border-2 border-outset border-gray-500 bg-red-100 px-3 py-1">Close account</button></div>}
        <footer className="mt-6 text-xs">F1 Help · F3 Exit · SESSION: TRAINING-NO-PII</footer>
      </section>
    </main>
  );
}
