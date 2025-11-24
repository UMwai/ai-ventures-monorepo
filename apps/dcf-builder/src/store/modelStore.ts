import { create } from "zustand";
import type {
  CompanyData,
  DCFAssumptions,
  WACCInputs,
  TerminalValueInputs,
  DCFResult,
  SensitivityTable,
} from "@/lib/dcf/types";

export type Scenario = "bull" | "base" | "bear";

interface ModelState {
  // Company data
  company: CompanyData | null;
  riskFreeRate: number;
  isLoadingCompany: boolean;

  // Assumptions (by scenario)
  assumptions: Record<Scenario, DCFAssumptions | null>;
  waccInputs: WACCInputs | null;
  terminalInputs: TerminalValueInputs | null;

  // AI-generated context
  aiReasoning: {
    revenueGrowth: string;
    margins: string;
    wacc: string;
    terminalValue: string;
  } | null;
  risks: string[];
  catalysts: string[];

  // Results (by scenario)
  results: Record<Scenario, DCFResult | null>;
  sensitivityTable: SensitivityTable | null;
  impliedGrowth: number | null;
  investmentThesis: string | null;

  // UI state
  activeScenario: Scenario;
  isCalculating: boolean;
  isGeneratingAI: boolean;

  // Actions
  setCompany: (company: CompanyData, riskFreeRate: number) => void;
  setLoadingCompany: (loading: boolean) => void;
  setAssumptions: (scenario: Scenario, assumptions: DCFAssumptions) => void;
  setAllAssumptions: (assumptions: Record<Scenario, DCFAssumptions>) => void;
  setWACCInputs: (inputs: WACCInputs) => void;
  setTerminalInputs: (inputs: TerminalValueInputs) => void;
  setAIContext: (
    reasoning: ModelState["aiReasoning"],
    risks: string[],
    catalysts: string[]
  ) => void;
  setResult: (scenario: Scenario, result: DCFResult) => void;
  setSensitivityTable: (table: SensitivityTable) => void;
  setImpliedGrowth: (growth: number) => void;
  setInvestmentThesis: (thesis: string) => void;
  setActiveScenario: (scenario: Scenario) => void;
  setCalculating: (calculating: boolean) => void;
  setGeneratingAI: (generating: boolean) => void;
  reset: () => void;

  // Computed helpers
  getCurrentAssumptions: () => DCFAssumptions | null;
  getCurrentResult: () => DCFResult | null;
}

const initialState = {
  company: null,
  riskFreeRate: 0.045,
  isLoadingCompany: false,
  assumptions: { bull: null, base: null, bear: null },
  waccInputs: null,
  terminalInputs: null,
  aiReasoning: null,
  risks: [],
  catalysts: [],
  results: { bull: null, base: null, bear: null },
  sensitivityTable: null,
  impliedGrowth: null,
  investmentThesis: null,
  activeScenario: "base" as Scenario,
  isCalculating: false,
  isGeneratingAI: false,
};

export const useModelStore = create<ModelState>((set, get) => ({
  ...initialState,

  setCompany: (company, riskFreeRate) =>
    set({ company, riskFreeRate, isLoadingCompany: false }),

  setLoadingCompany: (loading) => set({ isLoadingCompany: loading }),

  setAssumptions: (scenario, assumptions) =>
    set((state) => ({
      assumptions: { ...state.assumptions, [scenario]: assumptions },
    })),

  setAllAssumptions: (assumptions) => set({ assumptions }),

  setWACCInputs: (inputs) => set({ waccInputs: inputs }),

  setTerminalInputs: (inputs) => set({ terminalInputs: inputs }),

  setAIContext: (reasoning, risks, catalysts) =>
    set({ aiReasoning: reasoning, risks, catalysts }),

  setResult: (scenario, result) =>
    set((state) => ({
      results: { ...state.results, [scenario]: result },
    })),

  setSensitivityTable: (table) => set({ sensitivityTable: table }),

  setImpliedGrowth: (growth) => set({ impliedGrowth: growth }),

  setInvestmentThesis: (thesis) => set({ investmentThesis: thesis }),

  setActiveScenario: (scenario) => set({ activeScenario: scenario }),

  setCalculating: (calculating) => set({ isCalculating: calculating }),

  setGeneratingAI: (generating) => set({ isGeneratingAI: generating }),

  reset: () => set(initialState),

  getCurrentAssumptions: () => {
    const state = get();
    return state.assumptions[state.activeScenario];
  },

  getCurrentResult: () => {
    const state = get();
    return state.results[state.activeScenario];
  },
}));
