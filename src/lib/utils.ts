import { RISK, NORMS } from "./constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calcPHR = (d: number, p: number, pa: number, f: number) => {
  return parseFloat((d * p * pa * f).toFixed(2));
};

export const getRisk = (phr: number) => {
  if (phr >= 500) return RISK["MUY ALTO"];
  if (phr >= 200) return RISK["ALTO"];
  if (phr >= 50) return RISK["SIGNIFICATIVO"];
  if (phr >= 10) return RISK["BAJO"];
  return RISK["DESPRECIABLE"];
};

export const getRiskLabel = (phr: number) => {
  if (phr >= 500) return "MUY ALTO";
  if (phr >= 200) return "ALTO";
  if (phr >= 50) return "SIGNIFICATIVO";
  if (phr >= 10) return "BAJO";
  return "DESPRECIABLE";
};

export const findNormType = (code: string) => {
  for (const [t, arr] of Object.entries(NORMS)) {
    if (arr.find((n) => n.code === code)) return t;
  }
  return "Local";
};

export const uid = () => {
  return "_" + Math.random().toString(36).substring(2, 9);
};

export const pct = (a: number, b: number) => {
  if (!a || !b) return 0;
  return Math.round(((a - b) / a) * 100);
};

export const getSFP = (dph: number, po: number, pa: number, fe: number) => {
  return {
    sev: dph >= 8 ? "S2" : "S1",
    freq: fe >= 2 ? "F2" : "F1",
    prob: pa >= 2.5 ? "P2" : "P1",
  };
};

export const getPLr = (sev: string, freq: string, prob: string) => {
  if (sev === "S1" && freq === "F1" && prob === "P1") return "a";
  if (sev === "S1" && freq === "F2" && prob === "P1") return "b";
  if (sev === "S1" && freq === "F1" && prob === "P2") return "b";
  if (sev === "S1" && freq === "F2" && prob === "P2") return "c";
  if (sev === "S2" && freq === "F1" && prob === "P1") return "c";
  if (sev === "S2" && freq === "F1" && prob === "P2") return "d";
  if (sev === "S2" && freq === "F2" && prob === "P1") return "d";
  return "e";
};

export const DPH_OPTIONS = [
  { v: 0.25, l: "0.25 — Rasguño/escoriación" },
  { v: 0.5, l: "0.5 — Corte/enfermedad/quemadura leve" },
  { v: 3, l: "3 — Fractura leve (dedos)" },
  { v: 5, l: "5 — Fractura grave (mano, brazo, pierna)" },
  { v: 8, l: "8 — Pérdida de 1-2 dedos / quemaduras graves" },
  { v: 11, l: "11 — Amputación pierna/mano, pérdida parcial visión/audición" },
  { v: 15, l: "15 — Amputación ambas piernas/manos, pérdida total" },
  { v: 25, l: "25 — Lesiones permanentes graves" },
  { v: 40, l: "40 — Muerte" },
  { v: 65, l: "65 — Catástrofe" },
];

export const PO_OPTIONS = [
  { v: 0.05, l: "0.05 — Casi imposible" },
  { v: 1.25, l: "1.25 — Improbable" },
  { v: 2.5, l: "2.5 — Posible" },
  { v: 4, l: "4 — Probable" },
  { v: 6, l: "6 — Seguramente ocurrirá" },
];

export const PA_OPTIONS = [
  { v: 0.75, l: "0.75 — Posible evitar" },
  { v: 2.5, l: "2.5 — Posible en ciertas circunstancias" },
  { v: 5, l: "5 — No es posible evitar" },
];

export const FE_OPTIONS = [
  { v: 0.5, l: "0.5 — Anualmente" },
  { v: 1, l: "1 — Mensualmente" },
  { v: 2, l: "2 — Semanalmente" },
  { v: 3, l: "3 — Diariamente" },
  { v: 4, l: "4 — En términos de hora" },
  { v: 5, l: "5 — Constante" },
];
