export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type ExerciseMetrics = {
    weight?: boolean
    reps?: boolean
    time?: boolean
    distance?: boolean
    unilateral?: boolean
    dual_implements?: boolean
}

export interface Database {
    public: {
        Tables: {
            exercises: {
                Row: {
                    id: number
                    name: string
                    metrics: ExerciseMetrics
                    is_deleted: boolean
                    created_at: string
                }
                Insert: {
                    id?: number
                    name: string
                    metrics?: ExerciseMetrics
                    is_deleted?: boolean
                    created_at?: string
                }
                Update: {
                    id?: number
                    name?: string
                    metrics?: ExerciseMetrics
                    is_deleted?: boolean
                    created_at?: string
                }
            }
            sets: {
                Row: {
                    id: number
                    exercise_id: number
                    logged_at: string
                    weight: number | null
                    reps: number | null
                    time: number | null
                    distance: number | null
                    rir: number | null
                    is_deleted: boolean
                }
                Insert: {
                    id?: number
                    exercise_id: number
                    logged_at?: string
                    weight?: number | null
                    reps?: number | null
                    time?: number | null
                    distance?: number | null
                    rir?: number | null
                    is_deleted?: boolean
                }
                Update: {
                    id?: number
                    exercise_id?: number
                    logged_at?: string
                    weight?: number | null
                    reps?: number | null
                    time?: number | null
                    distance?: number | null
                    rir?: number | null
                    is_deleted?: boolean
                }
            }
            workouts: {
                Row: {
                    id: number
                    date: string
                }
                Insert: {
                    id?: number
                    date: string
                }
                Update: {
                    id?: number
                    date?: string
                }
            }
            workouts_exercises: {
                Row: {
                    id: number
                    workout_id: number
                    exercise_id: number
                    sort_order: number
                    details: string | null
                }
                Insert: {
                    id?: number
                    workout_id: number
                    exercise_id: number
                    sort_order: number
                    details?: string | null
                }
                Update: {
                    id?: number
                    workout_id?: number
                    exercise_id?: number
                    sort_order?: number
                    details?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}

// Helper types for easier access
export type Exercise = Database['public']['Tables']['exercises']['Row']
export type ExerciseInsert = Database['public']['Tables']['exercises']['Insert']
export type ExerciseUpdate = Database['public']['Tables']['exercises']['Update']

export type Set = Database['public']['Tables']['sets']['Row']
export type SetInsert = Database['public']['Tables']['sets']['Insert']
export type SetUpdate = Database['public']['Tables']['sets']['Update']

export type Workout = Database['public']['Tables']['workouts']['Row']
export type WorkoutInsert = Database['public']['Tables']['workouts']['Insert']
export type WorkoutUpdate = Database['public']['Tables']['workouts']['Update']

export type WorkoutExercise = Database['public']['Tables']['workouts_exercises']['Row']
export type WorkoutExerciseInsert = Database['public']['Tables']['workouts_exercises']['Insert']
export type WorkoutExerciseUpdate = Database['public']['Tables']['workouts_exercises']['Update']

// Extended types with joins
export type WorkoutExerciseWithExercise = WorkoutExercise & {
    exercises: Exercise
}

export type SetWithExercise = Set & {
    exercises: Exercise
}

// Type for workout list with exercise preview
export type WorkoutWithPreview = Workout & {
    exercise_count: number
    exercise_names: string[]
}
