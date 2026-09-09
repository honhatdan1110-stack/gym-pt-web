import type { AppState, AccountProfile, Client, Exercise, MealPlan, MemberPortalData, Metric, PublicScheduleSlot, PublicTrainerProfile, Session, UserRole, WorkoutPlan } from './types'
import { isSupabaseConfigured, supabase } from './supabase'

interface LegacyStateRecord { value?: AppState }

function loadLegacyState(): Promise<AppState | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('liftlog-pt-manager')
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const database = request.result
      if (!database.objectStoreNames.contains('state')) { database.close(); resolve(null); return }
      const transaction = database.transaction('state', 'readonly')
      const read = transaction.objectStore('state').get('app')
      read.onsuccess = () => { database.close(); resolve((read.result as LegacyStateRecord | undefined)?.value ?? null) }
      read.onerror = () => { database.close(); reject(read.error) }
    }
  })
}

function ensureConfigured() {
  if (!isSupabaseConfigured) throw new Error('Supabase chưa được cấu hình')
}

function assertNoError(error: { message?: string } | null, label: string) {
  if (error) throw new Error(`${label}: ${error.message ?? 'unknown error'}`)
}

function localParts(value: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(value))
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour') === '24' ? '00' : get('hour')}:${get('minute')}` }
}

function mapClient(row: any): Client {
  return {
    id: row.id, name: row.name, email: row.email ?? '', phone: row.phone ?? '', goal: row.goal ?? '', status: row.status,
    avatar: row.avatar ?? '', color: row.color ?? '#f97316', joinedAt: row.joined_at ?? '', weight: Number(row.weight ?? 0), weightStart: Number(row.weight_start ?? 0),
    sessionsThisMonth: Number(row.sessions_this_month ?? 0), progress: Number(row.progress ?? 0), nextSession: row.next_session ?? 'Chưa lên lịch', note: row.note ?? '',
    userId: row.user_id ?? null, accountStatus: row.account_status ?? 'none',
  }
}

function mapSession(row: any): Session {
  const local = localParts(row.starts_at)
  return {
    id: row.id, clientId: row.client_id ?? '', date: local.date, time: local.time, duration: Math.max(1, Math.round((new Date(row.ends_at).getTime() - new Date(row.starts_at).getTime()) / 60000)),
    type: row.title ?? 'Training session', status: row.status, accent: row.accent ?? '#f97316', startsAt: row.starts_at, endsAt: row.ends_at,
    isPublic: row.is_public ?? false, publicLabel: row.public_label ?? 'Đã có lịch', publicStatus: row.public_status ?? 'booked',
  }
}

function mapWorkout(row: any, links: any[]): WorkoutPlan {
  return { id: row.id, clientId: row.client_id, name: row.name, goal: row.goal ?? '', frequency: Number(row.frequency ?? 3), durationWeeks: Number(row.duration_weeks ?? 6), exerciseIds: links.filter((link) => link.plan_id === row.id).sort((a, b) => a.position - b.position).map((link) => link.exercise_id), status: row.status, updatedAt: row.updated_at }
}

function mapMeal(row: any, items: any[]): MealPlan {
  return { id: row.id, clientId: row.client_id, calories: Number(row.calories ?? 0), protein: Number(row.protein ?? 0), carbs: Number(row.carbs ?? 0), fat: Number(row.fat ?? 0), status: row.status, meals: Number(row.meals ?? 3), items: items.filter((item) => item.plan_id === row.id).sort((a, b) => a.position - b.position).map((item) => item.item) }
}

function mapExercise(row: any): Exercise {
  return { id: row.id, name: row.name, muscle: row.muscle ?? '', equipment: row.equipment ?? '', level: row.level, sets: Number(row.sets ?? 3), reps: row.reps ?? '10–12' }
}

function mapMetric(row: any): Metric {
  return { id: row.id, clientId: row.client_id, date: row.measured_on, weight: Number(row.weight ?? 0), bodyFat: Number(row.body_fat ?? 0), waist: Number(row.waist ?? 0), note: row.note ?? '' }
}

function mapProfile(row: any, publicProfile?: any): AccountProfile {
  return {
    id: row.id, role: row.role as UserRole, name: row.full_name ?? '', email: row.email ?? '', phone: row.phone ?? '', bio: row.bio ?? '',
    timezone: row.timezone ?? 'Asia/Ho_Chi_Minh', mustChangePassword: row.must_change_password ?? false,
    publicSlug: publicProfile?.slug, publicEnabled: publicProfile?.enabled ?? false,
  }
}

export async function getCurrentProfile(): Promise<AccountProfile | null> {
  ensureConfigured()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userData.user.id).maybeSingle()
  assertNoError(error, 'Không thể tải profile')
  if (!data) return null
  const { data: publicProfile, error: publicError } = await supabase.from('pt_public_profiles').select('*').eq('pt_id', userData.user.id).maybeSingle()
  assertNoError(publicError, 'Không thể tải public profile')
  return mapProfile(data, publicProfile)
}

export async function loadState(): Promise<AppState | null> {
  ensureConfigured()
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'pt') return null

  const [clientsResult, sessionsResult, exercisesResult, plansResult, linksResult, mealsResult, itemsResult, metricsResult] = await Promise.all([
    supabase.from('clients').select('*').eq('pt_id', profile.id).order('created_at', { ascending: false }),
    supabase.from('schedule_slots').select('*').eq('pt_id', profile.id).order('starts_at'),
    supabase.from('exercises').select('*').eq('pt_id', profile.id).order('created_at'),
    supabase.from('workout_plans').select('*').eq('pt_id', profile.id).order('updated_at', { ascending: false }),
    supabase.from('workout_plan_exercises').select('*'),
    supabase.from('meal_plans').select('*').eq('pt_id', profile.id).order('updated_at', { ascending: false }),
    supabase.from('meal_plan_items').select('*'),
    supabase.from('metrics').select('*').eq('pt_id', profile.id).order('measured_on', { ascending: false }),
  ])
  assertNoError(clientsResult.error, 'Không thể tải gymer')
  assertNoError(sessionsResult.error, 'Không thể tải lịch')
  assertNoError(exercisesResult.error, 'Không thể tải bài tập')
  assertNoError(plansResult.error, 'Không thể tải giáo án')
  assertNoError(linksResult.error, 'Không thể tải bài tập trong giáo án')
  assertNoError(mealsResult.error, 'Không thể tải thực đơn')
  assertNoError(itemsResult.error, 'Không thể tải món ăn')
  assertNoError(metricsResult.error, 'Không thể tải chỉ số')

  const clients = (clientsResult.data ?? []).map(mapClient)
  if (!clients.length && !(exercisesResult.data ?? []).length) return loadLegacyState()
  return {
    profile: profile,
    clients,
    sessions: (sessionsResult.data ?? []).map(mapSession),
    exercises: (exercisesResult.data ?? []).map(mapExercise),
    workoutPlans: (plansResult.data ?? []).map((row) => mapWorkout(row, linksResult.data ?? [])),
    mealPlans: (mealsResult.data ?? []).map((row) => mapMeal(row, itemsResult.data ?? [])),
    metrics: (metricsResult.data ?? []).map(mapMetric),
  }
}

async function clearPTData(ptId: string) {
  for (const [table, label] of [['schedule_slots', 'lịch'], ['workout_plans', 'giáo án'], ['meal_plans', 'thực đơn'], ['metrics', 'chỉ số'], ['exercises', 'bài tập'], ['clients', 'gymer']] as const) {
    const result = await supabase.from(table).delete().eq('pt_id', ptId)
    assertNoError(result.error, `Không thể xóa ${label} cũ`)
  }
}

export async function saveState(value: AppState) {
  ensureConfigured()
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'pt') throw new Error('Chỉ PT mới có thể lưu workspace')

  const profileResult = await supabase.from('profiles').update({ full_name: value.profile.name, email: value.profile.email, phone: value.profile.phone, bio: value.profile.bio, timezone: value.profile.timezone ?? 'Asia/Ho_Chi_Minh', updated_at: new Date().toISOString() }).eq('id', profile.id)
  assertNoError(profileResult.error, 'Không thể lưu profile')
  const publicResult = await supabase.from('pt_public_profiles').upsert({ pt_id: profile.id, slug: value.profile.publicSlug || 'alex', display_name: value.profile.name, bio: value.profile.bio, timezone: value.profile.timezone ?? 'Asia/Ho_Chi_Minh', enabled: value.profile.publicEnabled ?? false, updated_at: new Date().toISOString() })
  assertNoError(publicResult.error, 'Không thể lưu public profile')

  await clearPTData(profile.id)
  const clients = await supabase.from('clients').insert(value.clients.map((item) => ({ id: item.id, pt_id: profile.id, user_id: item.userId ?? null, name: item.name, email: item.email, phone: item.phone, goal: item.goal, status: item.status, avatar: item.avatar, color: item.color, joined_at: item.joinedAt || null, weight: item.weight, weight_start: item.weightStart, sessions_this_month: item.sessionsThisMonth, progress: item.progress, next_session: item.nextSession, note: item.note, account_status: item.accountStatus ?? 'none' })))
  assertNoError(clients.error, 'Không thể lưu gymer')
  const exercises = await supabase.from('exercises').insert(value.exercises.map((item) => ({ id: item.id, pt_id: profile.id, name: item.name, muscle: item.muscle, equipment: item.equipment, level: item.level, sets: item.sets, reps: item.reps })))
  assertNoError(exercises.error, 'Không thể lưu bài tập')
  const sessions = await supabase.from('schedule_slots').insert(value.sessions.map((item) => {
    const start = item.startsAt ? new Date(item.startsAt) : new Date(`${item.date}T${item.time}:00+07:00`)
    const end = item.endsAt ? new Date(item.endsAt) : new Date(start.getTime() + item.duration * 60000)
    return { id: item.id, pt_id: profile.id, client_id: item.clientId || null, starts_at: start.toISOString(), ends_at: end.toISOString(), title: item.type, status: item.status, accent: item.accent, is_public: item.isPublic ?? false, public_label: item.publicLabel ?? 'Đã có lịch', public_status: item.publicStatus ?? 'booked' }
  }))
  assertNoError(sessions.error, 'Không thể lưu lịch')
  const plans = await supabase.from('workout_plans').insert(value.workoutPlans.map((item) => ({ id: item.id, pt_id: profile.id, client_id: item.clientId, name: item.name, goal: item.goal, frequency: item.frequency, duration_weeks: item.durationWeeks, status: item.status, updated_at: item.updatedAt })))
  assertNoError(plans.error, 'Không thể lưu giáo án')
  const planLinks = await supabase.from('workout_plan_exercises').insert(value.workoutPlans.flatMap((plan) => plan.exerciseIds.map((exerciseId, position) => ({ plan_id: plan.id, exercise_id: exerciseId, position }))))
  assertNoError(planLinks.error, 'Không thể lưu bài tập trong giáo án')
  const meals = await supabase.from('meal_plans').insert(value.mealPlans.map((item) => ({ id: item.id, pt_id: profile.id, client_id: item.clientId, calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat, status: item.status, meals: item.meals })))
  assertNoError(meals.error, 'Không thể lưu thực đơn')
  const mealItems = await supabase.from('meal_plan_items').insert(value.mealPlans.flatMap((plan) => plan.items.map((item, position) => ({ plan_id: plan.id, position, item }))))
  assertNoError(mealItems.error, 'Không thể lưu món ăn')
  const metrics = await supabase.from('metrics').insert(value.metrics.map((item) => ({ id: item.id, pt_id: profile.id, client_id: item.clientId, measured_on: item.date, weight: item.weight, body_fat: item.bodyFat, waist: item.waist, note: item.note })))
  assertNoError(metrics.error, 'Không thể lưu chỉ số')

  const backup = await supabase.from('app_states').upsert({ state: value, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  assertNoError(backup.error, 'Không thể lưu backup')
}

export async function loadMemberPortal(): Promise<MemberPortalData | null> {
  ensureConfigured()
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'member') return null
  const { data: clientRow, error: clientError } = await supabase.from('clients').select('*').eq('user_id', profile.id).in('account_status', ['active', 'invited']).maybeSingle()
  assertNoError(clientError, 'Không thể tải hồ sơ member')
  if (!clientRow) return null
  const client = mapClient(clientRow)
  const [sessionsResult, mealsResult, plansResult, metricsResult, publicResult] = await Promise.all([
    supabase.from('schedule_slots').select('*').eq('client_id', client.id).order('starts_at'),
    supabase.from('meal_plans').select('*').eq('client_id', client.id).order('updated_at', { ascending: false }),
    supabase.from('workout_plans').select('*').eq('client_id', client.id).order('updated_at', { ascending: false }),
    supabase.from('metrics').select('*').eq('client_id', client.id).order('measured_on', { ascending: false }),
    supabase.from('pt_public_profiles').select('*').eq('pt_id', clientRow.pt_id).maybeSingle(),
  ])
  assertNoError(sessionsResult.error, 'Không thể tải lịch member'); assertNoError(mealsResult.error, 'Không thể tải thực đơn member'); assertNoError(plansResult.error, 'Không thể tải giáo án member'); assertNoError(metricsResult.error, 'Không thể tải chỉ số member'); assertNoError(publicResult.error, 'Không thể tải thông tin PT')
  const planIds = (plansResult.data ?? []).map((item) => item.id)
  const mealIds = (mealsResult.data ?? []).map((item) => item.id)
  const [linksResult, itemsResult, exercisesResult] = await Promise.all([
    planIds.length ? supabase.from('workout_plan_exercises').select('*').in('plan_id', planIds) : Promise.resolve({ data: [], error: null } as any),
    mealIds.length ? supabase.from('meal_plan_items').select('*').in('plan_id', mealIds) : Promise.resolve({ data: [], error: null } as any),
    supabase.from('exercises').select('*'),
  ])
  assertNoError(linksResult.error, 'Không thể tải bài tập member'); assertNoError(itemsResult.error, 'Không thể tải món ăn member'); assertNoError(exercisesResult.error, 'Không thể tải thư viện member')
  const selectedExerciseIds = new Set((linksResult.data ?? []).map((item: any) => item.exercise_id))
  return {
    profile, client, sessions: (sessionsResult.data ?? []).map(mapSession), mealPlans: (mealsResult.data ?? []).map((row) => mapMeal(row, itemsResult.data ?? [])),
    workoutPlans: (plansResult.data ?? []).map((row) => mapWorkout(row, linksResult.data ?? [])), exercises: (exercisesResult.data ?? []).filter((row: any) => selectedExerciseIds.has(row.id)).map(mapExercise), metrics: (metricsResult.data ?? []).map(mapMetric),
    pt: publicResult.data ? { ptId: publicResult.data.pt_id, slug: publicResult.data.slug, displayName: publicResult.data.display_name, bio: publicResult.data.bio, timezone: publicResult.data.timezone, enabled: publicResult.data.enabled } : null,
  }
}

export async function loadPublicSchedule(slug: string, start: Date, end: Date): Promise<{ profile: PublicTrainerProfile; slots: PublicScheduleSlot[] } | null> {
  ensureConfigured()
  const { data: profileRow, error: profileError } = await supabase.from('pt_public_profiles').select('*').eq('slug', slug).eq('enabled', true).maybeSingle()
  assertNoError(profileError, 'Không thể tải public profile')
  if (!profileRow) return null
  const { data, error } = await supabase.from('schedule_slots').select('id,pt_id,starts_at,ends_at,public_label,public_status').eq('pt_id', profileRow.pt_id).gte('starts_at', start.toISOString()).lt('starts_at', end.toISOString()).order('starts_at')
  assertNoError(error, 'Không thể tải public schedule')
  return {
    profile: { ptId: profileRow.pt_id, slug: profileRow.slug, displayName: profileRow.display_name, bio: profileRow.bio, timezone: profileRow.timezone, enabled: profileRow.enabled },
    slots: (data ?? []).map((row: any) => ({ id: row.id, ptId: row.pt_id, startsAt: row.starts_at, endsAt: row.ends_at, publicLabel: row.public_label, publicStatus: row.public_status })),
  }
}

export async function issueMemberAccount(clientId: string, mode: 'invite' | 'temporary', temporaryPassword?: string) {
  ensureConfigured()
  const { data, error } = await supabase.functions.invoke('create-member-account', { body: { clientId, mode, temporaryPassword } })
  if (error) throw new Error(error.message || 'Không thể cấp tài khoản member')
  if (data?.error) throw new Error(data.error)
  return data as { email: string; accountStatus: string; temporaryPassword?: string }
}
