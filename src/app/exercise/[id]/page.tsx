'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { Exercise, Set } from '@/types/database'
import { getExercise } from '@/lib/api/exercises'
import {
    getSetsForExercise,
    getLastSetForExercise,
    createSet,
    updateSet,
    deleteSet
} from '@/lib/api/sets'
import { useToast } from '@/contexts/ToastContext'

interface PageProps {
    params: Promise<{ id: string }>
}

export default function ExercisePage({ params }: PageProps) {
    const { id } = use(params)
    const exerciseId = parseInt(id, 10)
    const router = useRouter()
    const { showToast } = useToast()

    const [exercise, setExercise] = useState<Exercise | null>(null)
    const [sets, setSets] = useState<Set[]>([])
    const [hasMore, setHasMore] = useState(false)
    const [page, setPage] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [showStopwatch, setShowStopwatch] = useState(false)
    const [editingSet, setEditingSet] = useState<Set | null>(null)

    // Form state
    const [weight, setWeight] = useState<string>('')
    const [reps, setReps] = useState<string>('')
    const [time, setTime] = useState<string>('')
    const [distance, setDistance] = useState<string>('')
    const [rir, setRir] = useState<string>('')

    const loadExercise = useCallback(async () => {
        try {
            const data = await getExercise(exerciseId)
            if (!data) {
                showToast('Exercise not found', 'error')
                router.push('/')
                return
            }
            setExercise(data)

            // Pre-fill from last set
            const lastSet = await getLastSetForExercise(exerciseId)
            if (lastSet) {
                if (lastSet.weight !== null) setWeight(lastSet.weight.toString())
                if (lastSet.reps !== null) setReps(lastSet.reps.toString())
                if (lastSet.time !== null) setTime(lastSet.time.toString())
                if (lastSet.distance !== null) setDistance(lastSet.distance.toString())
                if (lastSet.rir !== null) setRir(lastSet.rir.toString())
            }

            // Load history
            const { sets: setsData, hasMore: more } = await getSetsForExercise(exerciseId, 1)
            setSets(setsData)
            setHasMore(more)
        } catch {
            showToast('Failed to load exercise', 'error')
        } finally {
            setIsLoading(false)
        }
    }, [exerciseId, router, showToast])

    useEffect(() => {
        loadExercise()
    }, [loadExercise])

    const loadMoreSets = async () => {
        const nextPage = page + 1
        const { sets: moreSets, hasMore: more } = await getSetsForExercise(exerciseId, nextPage)
        setSets(prev => [...prev, ...moreSets])
        setHasMore(more)
        setPage(nextPage)
    }

    const handleSave = async () => {
        if (!exercise) return

        setIsSaving(true)
        try {
            const values = {
                weight: weight ? parseInt(weight, 10) : null,
                reps: reps ? parseInt(reps, 10) : null,
                time: time ? parseInt(time, 10) : null,
                distance: distance ? parseInt(distance, 10) : null,
                rir: rir ? parseInt(rir, 10) : null,
            }

            if (editingSet) {
                await updateSet(editingSet.id, values)
                setEditingSet(null)
                showToast('Set updated!', 'success')
            } else {
                await createSet(exerciseId, values)
                showToast('Set saved! 💪', 'success')
            }

            // Refresh history
            const { sets: setsData, hasMore: more } = await getSetsForExercise(exerciseId, 1)
            setSets(setsData)
            setHasMore(more)
            setPage(1)
        } catch {
            showToast('Failed to save set', 'error', {
                label: 'Retry',
                onClick: handleSave
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handleEdit = (set: Set) => {
        setEditingSet(set)
        if (set.weight !== null) setWeight(set.weight.toString())
        else setWeight('')
        if (set.reps !== null) setReps(set.reps.toString())
        else setReps('')
        if (set.time !== null) setTime(set.time.toString())
        else setTime('')
        if (set.distance !== null) setDistance(set.distance.toString())
        else setDistance('')
        if (set.rir !== null) setRir(set.rir.toString())
        else setRir('')
    }

    const handleCancelEdit = () => {
        setEditingSet(null)
        // Restore from last set
        const lastSet = sets[0]
        if (lastSet) {
            if (lastSet.weight !== null) setWeight(lastSet.weight.toString())
            if (lastSet.reps !== null) setReps(lastSet.reps.toString())
            if (lastSet.time !== null) setTime(lastSet.time.toString())
            if (lastSet.distance !== null) setDistance(lastSet.distance.toString())
            if (lastSet.rir !== null) setRir(lastSet.rir.toString())
        }
    }

    const handleDelete = async (setId: number) => {
        try {
            await deleteSet(setId)
            setSets(prev => prev.filter(s => s.id !== setId))
            showToast('Set deleted', 'info')
        } catch {
            showToast('Failed to delete set', 'error')
        }
    }

    if (isLoading) {
        return (
            <div className="max-w-md mx-auto py-6 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    if (!exercise) {
        return null
    }

    const metrics = exercise.metrics

    return (
        <div className="max-w-md mx-auto py-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
                    aria-label="Go back"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold">{exercise.name}</h1>
            </div>

            {/* Input Form */}
            <div className="bg-card rounded-xl p-4 border border-border mb-6">
                {editingSet && (
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
                        <span className="text-sm text-muted-foreground">Editing set</span>
                        <button
                            onClick={handleCancelEdit}
                            className="text-sm text-primary hover:underline"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                <div className="space-y-4">
                    {metrics.weight && (
                        <div>
                            <label htmlFor="weight" className="block text-sm font-medium mb-1.5">
                                Weight (lbs)
                            </label>
                            <input
                                id="weight"
                                type="number"
                                inputMode="numeric"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-muted border border-border
                         text-foreground text-lg
                         focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="0"
                            />
                        </div>
                    )}

                    {metrics.reps && (
                        <div>
                            <label htmlFor="reps" className="block text-sm font-medium mb-1.5">
                                Reps
                            </label>
                            <input
                                id="reps"
                                type="number"
                                inputMode="numeric"
                                value={reps}
                                onChange={(e) => setReps(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-muted border border-border
                         text-foreground text-lg
                         focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="0"
                            />
                        </div>
                    )}

                    {metrics.time && (
                        <div>
                            <label htmlFor="time" className="block text-sm font-medium mb-1.5">
                                Time (seconds)
                            </label>
                            <input
                                id="time"
                                type="number"
                                inputMode="numeric"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-muted border border-border
                         text-foreground text-lg
                         focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="0"
                            />
                        </div>
                    )}

                    {metrics.distance && (
                        <div>
                            <label htmlFor="distance" className="block text-sm font-medium mb-1.5">
                                Distance (meters)
                            </label>
                            <input
                                id="distance"
                                type="number"
                                inputMode="numeric"
                                value={distance}
                                onChange={(e) => setDistance(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-muted border border-border
                         text-foreground text-lg
                         focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="0"
                            />
                        </div>
                    )}

                    {/* RIR is always available */}
                    <div>
                        <label htmlFor="rir" className="block text-sm font-medium mb-1.5">
                            RIR (0-10)
                        </label>
                        <input
                            id="rir"
                            type="number"
                            inputMode="numeric"
                            value={rir}
                            onChange={(e) => setRir(e.target.value)}
                            min="0"
                            max="10"
                            className="w-full px-4 py-3 rounded-lg bg-muted border border-border
                       text-foreground text-lg
                       focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="0"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full py-4 px-4 rounded-lg bg-primary text-background
                     font-semibold text-lg
                     hover:bg-primary-dim transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed
                     active:scale-[0.98] transition-transform"
                    >
                        {isSaving
                            ? 'Saving...'
                            : editingSet
                                ? 'Update Set'
                                : 'Save Set'
                        }
                    </button>
                </div>
            </div>

            {/* Set History */}
            <div>
                <h2 className="text-lg font-semibold mb-3">History</h2>
                {sets.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                        No history yet
                    </p>
                ) : (
                    <>
                        <ul className="space-y-2">
                            {sets.map(set => (
                                <SetHistoryItem
                                    key={set.id}
                                    set={set}
                                    metrics={metrics}
                                    onEdit={() => handleEdit(set)}
                                    onDelete={() => handleDelete(set.id)}
                                />
                            ))}
                        </ul>
                        {hasMore && (
                            <button
                                onClick={loadMoreSets}
                                className="w-full mt-4 py-3 text-primary hover:underline"
                            >
                                Load more
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Stopwatch FAB */}
            <button
                onClick={() => setShowStopwatch(true)}
                className="fixed bottom-6 right-6 p-4 rounded-full bg-bg2 text-foreground
                 shadow-lg hover:bg-bg3 transition-colors
                 active:scale-95 transition-transform z-30"
                aria-label="Open stopwatch"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            </button>

            {/* Stopwatch Modal */}
            {showStopwatch && (
                <StopwatchModal onClose={() => setShowStopwatch(false)} />
            )}
        </div>
    )
}

interface SetHistoryItemProps {
    set: Set
    metrics: Exercise['metrics']
    onEdit: () => void
    onDelete: () => void
}

function SetHistoryItem({ set, metrics, onEdit, onDelete }: SetHistoryItemProps) {
    const [showActions, setShowActions] = useState(false)
    const [startX, setStartX] = useState(0)
    const [offsetX, setOffsetX] = useState(0)

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartX(e.touches[0].clientX)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        const diff = startX - e.touches[0].clientX
        if (diff > 0) {
            setOffsetX(Math.min(diff, 80))
        }
    }

    const handleTouchEnd = () => {
        if (offsetX > 40) {
            setShowActions(true)
            setOffsetX(80)
        } else {
            setShowActions(false)
            setOffsetX(0)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })
    }

    const buildMetricsDisplay = () => {
        const parts: string[] = []
        if (metrics.weight && set.weight !== null) parts.push(`${set.weight} lbs`)
        if (metrics.reps && set.reps !== null) parts.push(`${set.reps} reps`)
        if (metrics.time && set.time !== null) parts.push(`${set.time}s`)
        if (metrics.distance && set.distance !== null) parts.push(`${set.distance}m`)
        if (set.rir !== null) parts.push(`RIR ${set.rir}`)
        return parts.join(' • ')
    }

    return (
        <li className="relative overflow-hidden rounded-lg">
            {/* Delete action background */}
            <div
                className="absolute inset-y-0 right-0 w-20 bg-destructive flex items-center justify-center"
                style={{ opacity: showActions ? 1 : offsetX / 80 }}
            >
                <button
                    onClick={onDelete}
                    className="p-2"
                    aria-label="Delete set"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-background">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                </button>
            </div>

            {/* Main content */}
            <div
                className="relative bg-card border border-border p-3 transition-transform"
                style={{ transform: `translateX(-${offsetX}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => {
                    if (!showActions) onEdit()
                    else {
                        setShowActions(false)
                        setOffsetX(0)
                    }
                }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">{buildMetricsDisplay()}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(set.logged_at)}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </div>
            </div>
        </li>
    )
}

interface StopwatchModalProps {
    onClose: () => void
}

function StopwatchModal({ onClose }: StopwatchModalProps) {
    const [seconds, setSeconds] = useState(0)
    const [isRunning, setIsRunning] = useState(false)

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null
        if (isRunning) {
            interval = setInterval(() => {
                setSeconds(s => s + 1)
            }, 1000)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isRunning])

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60)
        const secs = totalSeconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const handleReset = () => {
        setIsRunning(false)
        setSeconds(0)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-card rounded-xl p-6 w-full max-w-xs border border-border shadow-xl text-center">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1"
                    aria-label="Close stopwatch"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <h2 className="text-lg font-semibold mb-4">Rest Timer</h2>

                <div className="text-5xl font-mono font-bold text-primary mb-6">
                    {formatTime(seconds)}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        className="flex-1 py-3 px-4 rounded-lg border border-border
                     font-medium hover:bg-muted transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors
                      ${isRunning
                                ? 'bg-yellow text-background'
                                : 'bg-primary text-background hover:bg-primary-dim'
                            }`}
                    >
                        {isRunning ? 'Pause' : 'Start'}
                    </button>
                </div>
            </div>
        </div>
    )
}
