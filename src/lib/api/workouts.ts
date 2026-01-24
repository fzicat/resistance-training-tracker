import {
    Workout,
    WorkoutExercise,
    WorkoutExerciseWithExercise,
    WorkoutExerciseInsert
} from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { getExercisesFromDate } from './sets'

// Get workout for a specific date
export async function getWorkoutForDate(date: string): Promise<{
    workout: Workout | null
    exercises: WorkoutExerciseWithExercise[]
}> {
    const supabase = createClient()

    // Get workout
    const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('date', date)
        .single()

    if (workoutError) {
        if (workoutError.code === 'PGRST116') {
            return { workout: null, exercises: [] }
        }
        throw workoutError
    }

    // Get exercises for this workout
    const { data: exercises, error: exercisesError } = await supabase
        .from('workouts_exercises')
        .select(`
      *,
      exercises!inner(*)
    `)
        .eq('workout_id', workout.id)
        .eq('exercises.is_deleted', false)
        .order('sort_order', { ascending: true })

    if (exercisesError) throw exercisesError

    return {
        workout,
        exercises: (exercises ?? []) as WorkoutExerciseWithExercise[]
    }
}

// Get or create workout for a date
export async function getOrCreateWorkout(date: string): Promise<Workout> {
    const supabase = createClient()

    // Try to get existing
    const { data: existing } = await supabase
        .from('workouts')
        .select('*')
        .eq('date', date)
        .single()

    if (existing) return existing

    // Create new
    const { data, error } = await supabase
        .from('workouts')
        .insert({ date })
        .select()
        .single()

    if (error) throw error
    return data
}

// Add exercise to workout
export async function addExerciseToWorkout(
    workoutId: number,
    exerciseId: number,
    details?: string
): Promise<WorkoutExercise> {
    const supabase = createClient()

    // Get current max sort_order
    const { data: existing } = await supabase
        .from('workouts_exercises')
        .select('sort_order')
        .eq('workout_id', workoutId)
        .order('sort_order', { ascending: false })
        .limit(1)

    const maxOrder = existing?.[0]?.sort_order ?? -1

    const insert: WorkoutExerciseInsert = {
        workout_id: workoutId,
        exercise_id: exerciseId,
        sort_order: maxOrder + 1,
        details: details ?? null
    }

    const { data, error } = await supabase
        .from('workouts_exercises')
        .insert(insert)
        .select()
        .single()

    if (error) throw error
    return data
}

// Remove exercise from workout
export async function removeExerciseFromWorkout(
    workoutExerciseId: number
): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
        .from('workouts_exercises')
        .delete()
        .eq('id', workoutExerciseId)

    if (error) throw error
}

// Update exercise details in workout
export async function updateWorkoutExerciseDetails(
    workoutExerciseId: number,
    details: string
): Promise<WorkoutExercise> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('workouts_exercises')
        .update({ details })
        .eq('id', workoutExerciseId)
        .select()
        .single()

    if (error) throw error
    return data
}

// Reorder exercises in workout
export async function reorderWorkoutExercises(
    workoutId: number,
    orderedIds: number[]
): Promise<void> {
    const supabase = createClient()

    // Update each exercise's sort_order
    const updates = orderedIds.map((id, index) =>
        supabase
            .from('workouts_exercises')
            .update({ sort_order: index })
            .eq('id', id)
            .eq('workout_id', workoutId)
    )

    await Promise.all(updates)
}

// Repeat a day: copy exercises from another date to today's workout
export async function repeatDay(
    sourceDate: string,
    targetDate: string
): Promise<void> {
    const supabase = createClient()

    // Get exercises from source date (based on logged sets)
    const exercisesFromDate = await getExercisesFromDate(sourceDate)

    if (exercisesFromDate.length === 0) {
        throw new Error('No exercises found on that date')
    }

    // Get or create target workout
    const targetWorkout = await getOrCreateWorkout(targetDate)

    // Clear existing exercises from target workout
    await supabase
        .from('workouts_exercises')
        .delete()
        .eq('workout_id', targetWorkout.id)

    // Add exercises from source date
    const inserts: WorkoutExerciseInsert[] = exercisesFromDate.map((item, index) => ({
        workout_id: targetWorkout.id,
        exercise_id: item.exercise.id,
        sort_order: index,
        details: item.summary
    }))

    const { error } = await supabase
        .from('workouts_exercises')
        .insert(inserts)

    if (error) throw error
}
