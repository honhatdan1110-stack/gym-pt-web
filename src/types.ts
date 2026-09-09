export type View = 'overview' | 'clients' | 'workouts' | 'schedule' | 'exercises' | 'nutrition' | 'progress' | 'settings'

export type ClientStatus = 'active' | 'paused' | 'lead'

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  goal: string
  status: ClientStatus
  avatar: string
  color: string
  joinedAt: string
  weight: number
  weightStart: number
  sessionsThisMonth: number
  progress: number
  nextSession: string
  note: string
  userId?: string | null
  accountStatus?: 'none' | 'invited' | 'active' | 'disabled'
}

export interface TrainerProfile {
  name: string
  email: string
  phone: string
  bio: string
  publicSlug?: string
  publicEnabled?: boolean
  timezone?: string
}

export type SessionStatus = 'upcoming' | 'completed' | 'missed'

export interface Session {
  id: string
  clientId: string
  time: string
  date: string
  duration: number
  type: string
  status: SessionStatus
  accent: string
  startsAt?: string
  endsAt?: string
  isPublic?: boolean
  publicLabel?: string
  publicStatus?: 'available' | 'booked' | 'blocked' | 'completed' | 'hidden'
}

export interface Exercise {
  id: string
  name: string
  muscle: string
  equipment: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  sets: number
  reps: string
}

export interface WorkoutPlan {
  id: string
  clientId: string
  name: string
  goal: string
  frequency: number
  durationWeeks: number
  exerciseIds: string[]
  status: 'active' | 'draft'
  updatedAt: string
}

export interface MealPlan {
  id: string
  clientId: string
  calories: number
  protein: number
  carbs: number
  fat: number
  status: 'on-track' | 'needs-review'
  meals: number
  items: string[]
}

export interface Metric {
  id: string
  clientId: string
  date: string
  weight: number
  bodyFat: number
  waist: number
  note: string
}

export interface AppState {
  profile: TrainerProfile
  clients: Client[]
  sessions: Session[]
  exercises: Exercise[]
  workoutPlans: WorkoutPlan[]
  mealPlans: MealPlan[]
  metrics: Metric[]
}

export type UserRole = 'pt' | 'member'

export interface AccountProfile extends TrainerProfile {
  id: string
  role: UserRole
  mustChangePassword?: boolean
}

export interface PublicTrainerProfile {
  ptId: string
  slug: string
  displayName: string
  bio: string
  timezone: string
  enabled: boolean
}

export interface PublicScheduleSlot {
  id: string
  ptId: string
  startsAt: string
  endsAt: string
  publicLabel: string
  publicStatus: 'available' | 'booked' | 'blocked' | 'completed' | 'hidden'
}

export interface MemberPortalData {
  profile: AccountProfile
  client: Client
  sessions: Session[]
  mealPlans: MealPlan[]
  workoutPlans: WorkoutPlan[]
  exercises: Exercise[]
  metrics: Metric[]
  pt: PublicTrainerProfile | null
}
