'use client'

import { useState, useEffect, useCallback } from 'react'
import { getDailyLog, upsertDailyLog, getTodayDate } from '@/lib/api/daily-logs'
import { useToast } from '@/contexts/ToastContext'

type FormState = {
    sleepHours: string
    sleepMinutes: string
    sleepScore: string
    sleepHrvRmssd: string
    morningHrvRmssd: string
    weightLbs: string
}

const EMPTY_FORM: FormState = {
    sleepHours: '',
    sleepMinutes: '',
    sleepScore: '',
    sleepHrvRmssd: '',
    morningHrvRmssd: '',
    weightLbs: '',
}

function parseNum(s: string): number | null {
    const trimmed = s.trim()
    if (trimmed === '') return null
    const n = Number(trimmed)
    return Number.isFinite(n) ? n : null
}

export default function MorningPage() {
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
                const total = entry.sleep_duration_minutes
                const hours = total !== null ? Math.floor(total / 60) : null
                const minutes = total !== null ? total % 60 : null
                setForm({
                    sleepHours: hours !== null ? String(hours) : '',
                    sleepMinutes: minutes !== null ? String(minutes) : '',
                    sleepScore: entry.sleep_score !== null ? String(entry.sleep_score) : '',
                    sleepHrvRmssd: entry.sleep_hrv_rmssd !== null ? String(entry.sleep_hrv_rmssd) : '',
                    morningHrvRmssd: entry.morning_hrv_rmssd !== null ? String(entry.morning_hrv_rmssd) : '',
                    weightLbs: entry.weight_lbs !== null ? String(entry.weight_lbs) : '',
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

        const hours = parseNum(form.sleepHours)
        const minutes = parseNum(form.sleepMinutes)
        const sleepTotal =
            hours === null && minutes === null
                ? null
                : (hours ?? 0) * 60 + (minutes ?? 0)

        setIsSaving(true)
        try {
            await upsertDailyLog(date, {
                sleep_duration_minutes: sleepTotal,
                sleep_score: parseNum(form.sleepScore),
                sleep_hrv_rmssd: parseNum(form.sleepHrvRmssd),
                morning_hrv_rmssd: parseNum(form.morningHrvRmssd),
                weight_lbs: parseNum(form.weightLbs),
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
            <h1 className="text-2xl font-bold mb-6">Morning check-in</h1>

            <div className="bg-card rounded-xl p-4 border border-border mb-4">
                <label className="block text-sm font-medium mb-2" htmlFor="date">Date</label>
                <input
                    id="date"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-base"
                />
            </div>

            <fieldset disabled={isLoading || isSaving} className="space-y-4">
                <div className="bg-card rounded-xl p-4 border border-border">
                    <label className="block text-sm font-medium mb-2">Sleep duration</label>
                    <div className="flex gap-2 items-center">
                        <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={24}
                            value={form.sleepHours}
                            onChange={handleField('sleepHours')}
                            placeholder="0"
                            className="w-20 bg-background border border-border rounded-lg px-3 py-2 text-base"
                            aria-label="Sleep hours"
                        />
                        <span className="text-sm text-muted-foreground">hours</span>
                        <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={59}
                            value={form.sleepMinutes}
                            onChange={handleField('sleepMinutes')}
                            placeholder="0"
                            className="w-20 bg-background border border-border rounded-lg px-3 py-2 text-base"
                            aria-label="Sleep minutes"
                        />
                        <span className="text-sm text-muted-foreground">minutes</span>
                    </div>
                </div>

                <NumberField
                    label="Sleep score"
                    suffix="/ 100"
                    value={form.sleepScore}
                    onChange={handleField('sleepScore')}
                    min={0}
                    max={100}
                />
                <NumberField
                    label="Sleep HRV (RMSSD)"
                    suffix="ms"
                    value={form.sleepHrvRmssd}
                    onChange={handleField('sleepHrvRmssd')}
                    step="0.1"
                    min={0}
                />
                <NumberField
                    label="Morning HRV (RMSSD)"
                    suffix="ms"
                    value={form.morningHrvRmssd}
                    onChange={handleField('morningHrvRmssd')}
                    step="0.1"
                    min={0}
                />
                <NumberField
                    label="Weight"
                    suffix="lbs"
                    value={form.weightLbs}
                    onChange={handleField('weightLbs')}
                    step="0.1"
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
