import { useMemo } from 'react'
import { create } from 'zustand'
import {
  computeAccrual,
  initialAdjustments,
  initialAssignments,
  initialPayouts,
  initialPeriods,
  initialSchemes,
  staffForPeriod,
  type Adjustment,
  type Assignment,
  type Payout,
  type Period,
  type Scheme,
} from './data'
import { TODAY } from '@/lib/time'

type Modal = 'period' | 'payout' | 'adjustment' | 'assign' | 'timesheet' | null

type Payroll = {
  periods: Period[]
  schemes: Scheme[]
  assignments: Assignment[]
  adjustments: Adjustment[]
  payouts: Payout[]
  /** Manual corrections keyed by `${staffId}-${day}`. */
  corrections: Record<string, { in: string; out: string; hours: number; reason: string }>
  modal: Modal
  setModal: (m: Modal) => void
  addPeriod: (p: Period) => void
  setPeriodStatus: (id: string, status: Period['status']) => void
  saveScheme: (s: Scheme) => void
  addAssignment: (a: Assignment) => void
  addAdjustment: (a: Adjustment) => void
  removeAdjustment: (id: string) => void
  addPayout: (p: Payout) => void
  correct: (key: string, v: { in: string; out: string; hours: number; reason: string }) => void
}

export const usePayroll = create<Payroll>()((set) => ({
  periods: initialPeriods,
  schemes: initialSchemes,
  assignments: initialAssignments,
  adjustments: initialAdjustments,
  payouts: initialPayouts(initialPeriods, initialSchemes, initialAssignments, initialAdjustments),
  corrections: {},
  modal: null,
  setModal: (modal) => set({ modal }),
  addPeriod: (p) => set((s) => ({ periods: [p, ...s.periods] })),
  setPeriodStatus: (id, status) =>
    set((s) => ({
      periods: s.periods.map((p) =>
        p.id === id ? { ...p, status, ...(status === 'approved' ? { approvedAt: TODAY, approvedBy: 'Zarina Karimova' } : {}) } : p,
      ),
    })),
  saveScheme: (scheme) =>
    set((s) => ({
      schemes: s.schemes.some((x) => x.id === scheme.id) ? s.schemes.map((x) => (x.id === scheme.id ? scheme : x)) : [...s.schemes, scheme],
    })),
  addAssignment: (a) =>
    set((s) => ({
      // A new assignment for the same person or position replaces the old one.
      assignments: [
        ...s.assignments.filter((x) =>
          a.target.kind === 'staff'
            ? !(x.target.kind === 'staff' && x.target.staffId === (a.target as { staffId: string }).staffId)
            : !(x.target.kind === 'position' && x.target.position === (a.target as { position: string }).position),
        ),
        a,
      ],
    })),
  addAdjustment: (a) => set((s) => ({ adjustments: [a, ...s.adjustments] })),
  removeAdjustment: (id) => set((s) => ({ adjustments: s.adjustments.filter((a) => a.id !== id) })),
  addPayout: (p) => set((s) => ({ payouts: [p, ...s.payouts] })),
  correct: (key, v) => set((s) => ({ corrections: { ...s.corrections, [key]: v } })),
}))

export function usePeriodAccruals(period: Period | undefined) {
  const schemes = usePayroll((s) => s.schemes)
  const assignments = usePayroll((s) => s.assignments)
  const adjustments = usePayroll((s) => s.adjustments)
  const payouts = usePayroll((s) => s.payouts)
  return useMemo(
    () => (period ? staffForPeriod(period).map((s) => computeAccrual(period, s, { schemes, assignments, adjustments, payouts })) : []),
    [period, schemes, assignments, adjustments, payouts],
  )
}

/** Totals for every period at once, for the periods list. */
export function useAllTotals() {
  const periods = usePayroll((s) => s.periods)
  const schemes = usePayroll((s) => s.schemes)
  const assignments = usePayroll((s) => s.assignments)
  const adjustments = usePayroll((s) => s.adjustments)
  const payouts = usePayroll((s) => s.payouts)
  return useMemo(() => {
    const out: Record<string, { total: number; paid: number; people: number }> = {}
    for (const p of periods) {
      const list = staffForPeriod(p).map((s) => computeAccrual(p, s, { schemes, assignments, adjustments, payouts }))
      out[p.id] = { total: list.reduce((m, a) => m + a.total, 0), paid: list.reduce((m, a) => m + a.paid, 0), people: list.length }
    }
    return out
  }, [periods, schemes, assignments, adjustments, payouts])
}
