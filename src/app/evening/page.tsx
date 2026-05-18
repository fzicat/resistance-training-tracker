'use client'

import { useState, useEffect, useCallback } from 'react'
import { getDailyLog, upsertDailyLog, getTodayDate } from '@/lib/api/daily-logs'
import { useToast } from '@/contexts/ToastContext'

type FormState = {
    calories: string
    proteinG: string
    fatG: string
    carbsG: string
    alcoholG: string
    steps: string
}

const EMPTY_FORM: FormState = {
    calories: '',
    proteinG: '',
    fatG: '',
    carbsG: '',
    alcoholG: '',
    steps: '',
}

function parseNum(s: string): number | null {
    const trimmed = s.trim()
    if (trimmed === '') return null
    const n = Number(trimmed)
    return Number.isFinite(n) ? n : null
}

function shiftDate(dateStr: string, days: number): string {
    const [y, m, d] = dateStr.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    dt.setDate(dt.getDate() + days)
    const year = dt.getFullYear()
    const month = String(dt.getMonth() + 1).padStart(2, '0')
    const day = String(dt.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

export default function EveningPage() {
    const [date, setDate] = useState(getTodayDate())
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const { showToast } = useToast()

    const loadEntry = useCallback(async () => {
        setIsLoading(true)
        try {
            const entry = await getDailyLog(date)
            if (entry) {
                setForm({
                    calories: entry.calories !== null ? String(entry.calories) : '',
                    proteinG: entry.protein_g !== null ? String(entry.protein_g) : '',
                    fatG: entry.fat_g !== null ? String(entry.fat_g) : '',
                    carbsG: entry.carbs_g !== null ? String(entry.carbs_g) : '',
                    alcoholG: entry.alcohol_g !== null ? String(entry.alcohol_g) : '',
                    steps: entry.steps !== null ? String(entry.steps) : '',
                })
            } else {
                setForm(EMPTY_FORM)
            }
        } catch {
            showToast('Failed to load entry', 'error')
        } finally {
            setIsLoading(false)
        }
    }, [date, showToast])

    useEffect(() => {
        loadEntry()
    }, [loadEntry])

    const handleField = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [key]: e.target.value }))
    }

    const handleSave = async () => {
        if (date < getTodayDate()) {
            if (!window.confirm('You are about to change past data. Are you certain?')) {
                return
            }
        }

        setIsSaving(true)
        try {
            await upsertDailyLog(date, {
                calories: parseNum(form.calories),
                protein_g: parseNum(form.proteinG),
                fat_g: parseNum(form.fatG),
                carbs_g: parseNum(form.carbsG),
                alcohol_g: parseNum(form.alcoholG),
                steps: parseNum(form.steps),
            })
            showToast('Saved', 'success')
        } catch {
            showToast('Failed to save', 'error')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="max-w-md mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Evening check-in</h1>

            <div className="bg-card rounded-xl p-4 border border-border mb-4">
                <label className="block text-sm font-medium mb-2" htmlFor="date">Date</label>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setDate(shiftDate(date, -1))}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        style={{ color: 'var(--orange)' }}
                        aria-label="Previous day"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <input
                        id="date"
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-base"
                    />
                    <button
                        type="button"
                        onClick={() => setDate(shiftDate(date, 1))}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        style={{ color: 'var(--orange)' }}
                        aria-label="Next day"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 6 15 12 9 18" />
                        </svg>
                    </button>
                </div>
            </div>

            <fieldset disabled={isLoading || isSaving} className="space-y-4">
                <NumberField
                    label="Calories"
                    suffix="kcal"
                    value={form.calories}
                    onChange={handleField('calories')}
                    min={0}
                />
                <NumberField
                    label="Protein"
                    suffix="g"
                    value={form.proteinG}
                    onChange={handleField('proteinG')}
                    step="0.1"
                    min={0}
                />
                <NumberField
                    label="Fat"
                    suffix="g"
                    value={form.fatG}
                    onChange={handleField('fatG')}
                    step="0.1"
                    min={0}
                />
                <NumberField
                    label="Carbs"
                    suffix="g"
                    value={form.carbsG}
                    onChange={handleField('carbsG')}
                    step="0.1"
                    min={0}
                />
                <NumberField
                    label="Alcohol"
                    suffix="g"
                    value={form.alcoholG}
                    onChange={handleField('alcoholG')}
                    step="0.1"
                    min={0}
                />
                <NumberField
                    label="Steps"
                    value={form.steps}
                    onChange={handleField('steps')}
                    min={0}
                />

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isLoading || isSaving}
                    className="w-full bg-primary text-background font-medium rounded-xl py-3 disabled:opacity-50"
                >
                    {isSaving ? 'Saving…' : 'Save'}
                </button>
            </fieldset>
        </div>
    )
}

function NumberField({
    label,
    suffix,
    value,
    onChange,
    min,
    max,
    step,
}: {
    label: string
    suffix?: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    min?: number
    max?: number
    step?: string
}) {
    return (
        <div className="bg-card rounded-xl p-4 border border-border">
            <label className="block text-sm font-medium mb-2">{label}</label>
            <div className="flex gap-2 items-center">
                <input
                    type="number"
                    inputMode="decimal"
                    value={value}
                    onChange={onChange}
                    min={min}
                    max={max}
                    step={step}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-base"
                />
                {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
            </div>
        </div>
    )
}
