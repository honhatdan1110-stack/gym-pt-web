import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Apple,
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Dumbbell,
  FileDown,
  Filter,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Pencil,
  RotateCcw,
  Save,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Target,
  KeyRound,
  TrendingDown,
  TrendingUp,
  Trash2,
  Users,
  Utensils,
  X,
} from 'lucide-react'
import { getCurrentProfile, loadState, saveState } from './db'
import { IssueAccountModal, MemberPortal, PublicTrainerPage, TimelineScheduleView } from './portal'
import { seedState } from './seed'
import { isSupabaseConfigured, supabase } from './supabase'
import type { AppState, Client, ClientStatus, Exercise, MealPlan, Metric, Session, TrainerProfile, UserRole, View, WorkoutPlan } from './types'

const navItems: { id: View; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'clients', label: 'Gymer', icon: Users },
  { id: 'workouts', label: 'Giáo án', icon: ClipboardList },
  { id: 'schedule', label: 'Lịch tập', icon: CalendarDays },
  { id: 'exercises', label: 'Bài tập', icon: Dumbbell },
  { id: 'nutrition', label: 'Thực đơn', icon: Utensils },
  { id: 'progress', label: 'Tiến độ', icon: TrendingUp },
  { id: 'settings', label: 'Cài đặt', icon: Settings },
]

const viewTitles: Record<View, { eyebrow: string; title: string; description: string }> = {
  overview: { eyebrow: 'Workspace', title: 'Tổng quan', description: 'Theo dõi nhịp độ coaching của bạn hôm nay.' },
  clients: { eyebrow: 'People', title: 'Gymer của bạn', description: 'Quản lý hồ sơ và hành trình của từng học viên.' },
  workouts: { eyebrow: 'Programming', title: 'Giáo án', description: 'Thiết kế chương trình tập phù hợp với từng mục tiêu.' },
  schedule: { eyebrow: 'Planning', title: 'Lịch tập', description: 'Lên lịch, ghi nhận và giữ nhịp cho từng buổi tập.' },
  exercises: { eyebrow: 'Library', title: 'Thư viện bài tập', description: 'Bộ sưu tập bài tập để xây giáo án nhanh hơn.' },
  nutrition: { eyebrow: 'Fuel', title: 'Thực đơn', description: 'Dinh dưỡng rõ ràng để biến nỗ lực thành kết quả.' },
  progress: { eyebrow: 'Insights', title: 'Tiến độ', description: 'Nhìn thấy những thay đổi nhỏ đang tạo nên khác biệt.' },
  settings: { eyebrow: 'System', title: 'Cài đặt', description: 'Kiểm soát dữ liệu và trải nghiệm sử dụng của bạn.' },
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).slice(-2).join('').toUpperCase()
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function Avatar({ client, size = 'medium' }: { client: Client; size?: 'small' | 'medium' | 'large' }) {
  return <span className={`avatar avatar-${size}`} style={{ backgroundColor: client.color }}>{client.avatar || initials(client.name)}</span>
}

function StatusPill({ status }: { status: ClientStatus | Session['status'] | 'on-track' | 'needs-review' }) {
  const labels: Record<string, string> = {
    active: 'Đang tập', paused: 'Tạm nghỉ', lead: 'Tiềm năng', upcoming: 'Sắp tới', completed: 'Hoàn thành', missed: 'Bỏ lỡ', 'on-track': 'Đúng kế hoạch', 'needs-review': 'Cần xem lại',
  }
  return <span className={`status-pill status-${status}`}><i />{labels[status]}</span>
}

function LoginScreen({ profile, onLogin }: { profile: TrainerProfile; onLogin: (email: string, password: string) => Promise<string | null> }) {
  const [email, setEmail] = useState(profile.email)
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  useEffect(() => setEmail(profile.email), [profile.email])
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const loginError = await onLogin(email, password)
    if (loginError) setError(loginError)
    setSubmitting(false)
  }
  return <div className="login-page"><div className="login-decoration login-decoration-one" /><div className="login-decoration login-decoration-two" /><div className="login-card"><div className="login-brand"><div className="brand-mark"><Activity size={19} strokeWidth={2.5} /></div><span className="brand-name">lift<span>log</span></span></div><span className="eyebrow">Personal trainer workspace</span><h1>Đưa mỗi buổi tập<br /><em>tiến gần mục tiêu.</em></h1><p className="login-description">Đăng nhập để quản lý gymer, giáo án và tiến độ của bạn.</p><form onSubmit={submit} className="login-form"><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></label><label>Mật khẩu<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>{error && <p className="login-error">{error}</p>}<button className="primary-button login-button" type="submit" disabled={submitting}><LogIn size={17} /> {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</button></form><button className="demo-login" onClick={() => { setEmail(profile.email); setPassword('123456'); setError('') }}>Điền tài khoản mẫu <span>{profile.email}</span></button><p className="local-note">Dữ liệu được lưu an toàn trên Supabase.</p></div></div>
}

function PTApp() {
  const [view, setView] = useState<View>('overview')
  const [state, setState] = useState<AppState>(seedState)
  const [hydrated, setHydrated] = useState(false)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const [authenticated, setAuthenticated] = useState(false)
  const [authEmail, setAuthEmail] = useState('')
  const [role, setRole] = useState<UserRole | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [clientModal, setClientModal] = useState<Client | 'new' | null>(null)
  const [sessionModal, setSessionModal] = useState<Session | 'new' | null>(null)
  const [exerciseModal, setExerciseModal] = useState<Exercise | 'new' | null>(null)
  const [workoutModal, setWorkoutModal] = useState<WorkoutPlan | 'new' | null>(null)
  const [mealModal, setMealModal] = useState<MealPlan | 'new' | null>(null)
  const [metricModal, setMetricModal] = useState<Metric | 'new' | null>(null)
  const [accountModal, setAccountModal] = useState<Client | null>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [toast, setToast] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured) return 'Chưa cấu hình Supabase. Hãy điền các biến VITE_SUPABASE_URL và VITE_SUPABASE_PUBLISHABLE_KEY.'

    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) return 'Email hoặc mật khẩu chưa đúng.'
    setAuthEmail(data.user?.email ?? email.trim())
    setAuthenticated(Boolean(data.session))
    return null
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setAuthenticated(false)
    setRole(null)
    setHydrated(false)
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setAuthEmail(data.session?.user.email ?? '')
      setAuthenticated(Boolean(data.session))
      setAuthReady(true)
    }).catch(() => setAuthReady(true))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthEmail(session?.user.email ?? '')
      setAuthenticated(Boolean(session))
      if (!session) setHydrated(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!authenticated) { setRole(null); return }
    getCurrentProfile().then((profile) => setRole(profile?.role ?? null)).catch(() => setRole(null))
  }, [authenticated])

  useEffect(() => {
    if (!authenticated || role !== 'pt') return
    let active = true
    setHydrated(false)
    loadState().then((saved) => {
      if (!active) return
      if (saved) {
        setState({ ...seedState, ...saved, profile: { ...seedState.profile, ...saved.profile, ...(authEmail ? { email: authEmail } : {}) }, workoutPlans: saved.workoutPlans ?? [], metrics: saved.metrics ?? [] })
      } else {
        setState({ ...seedState, profile: { ...seedState.profile, ...(authEmail ? { email: authEmail } : {}) } })
      }
      setHydrated(true)
    }).catch(() => {
      if (!active) return
      setHydrated(true)
      setToast('Không thể tải dữ liệu từ Supabase')
    })
    return () => { active = false }
  }, [authenticated, authEmail, role])

  useEffect(() => {
    if (authenticated && role === 'pt' && hydrated) saveState(state).catch(() => setToast('Không thể lưu dữ liệu lên Supabase'))
  }, [state, hydrated, authenticated, role])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const activeClients = state.clients.filter((client) => client.status === 'active')
  const goTo = (nextView: View) => {
    setView(nextView)
    setMobileNavOpen(false)
  }

  const completeSession = (sessionId: string) => {
    setState((current) => {
      const target = current.sessions.find((session) => session.id === sessionId)
      if (!target || target.status === 'completed') return current
      return { ...current, sessions: current.sessions.map((session) => session.id === sessionId ? { ...session, status: 'completed' } : session), clients: current.clients.map((client) => client.id === target.clientId ? { ...client, sessionsThisMonth: client.sessionsThisMonth + 1 } : client) }
    })
    setToast('Đã cập nhật trạng thái buổi tập')
  }

  const saveClient = (client: Client) => {
    setState((current) => ({ ...current, clients: current.clients.some((item) => item.id === client.id) ? current.clients.map((item) => item.id === client.id ? client : item) : [client, ...current.clients] }))
    setClientModal(null)
    setToast(`Đã lưu hồ sơ ${client.name}`)
  }

  const deleteClient = (clientId: string) => {
    if (!window.confirm('Xóa gymer này và toàn bộ dữ liệu liên quan?')) return
    setState((current) => ({ ...current, clients: current.clients.filter((client) => client.id !== clientId), sessions: current.sessions.filter((session) => session.clientId !== clientId), workoutPlans: current.workoutPlans.filter((plan) => plan.clientId !== clientId), mealPlans: current.mealPlans.filter((plan) => plan.clientId !== clientId), metrics: current.metrics.filter((metric) => metric.clientId !== clientId) }))
    setToast('Đã xóa hồ sơ gymer')
  }

  const saveSession = (session: Session) => {
    setState((current) => ({ ...current, sessions: current.sessions.some((item) => item.id === session.id) ? current.sessions.map((item) => item.id === session.id ? session : item) : [session, ...current.sessions] }))
    setSessionModal(null)
    setToast('Đã lưu buổi tập')
  }

  const deleteSession = (sessionId: string) => {
    if (!window.confirm('Xóa buổi tập này?')) return
    setState((current) => ({ ...current, sessions: current.sessions.filter((session) => session.id !== sessionId) }))
    setToast('Đã xóa buổi tập')
  }

  const saveExercise = (exercise: Exercise) => {
    setState((current) => ({ ...current, exercises: current.exercises.some((item) => item.id === exercise.id) ? current.exercises.map((item) => item.id === exercise.id ? exercise : item) : [exercise, ...current.exercises] }))
    setExerciseModal(null)
    setToast('Đã lưu bài tập')
  }

  const deleteExercise = (exerciseId: string) => {
    if (!window.confirm('Xóa bài tập này khỏi thư viện?')) return
    setState((current) => ({ ...current, exercises: current.exercises.filter((exercise) => exercise.id !== exerciseId), workoutPlans: current.workoutPlans.map((plan) => ({ ...plan, exerciseIds: plan.exerciseIds.filter((id) => id !== exerciseId) })) }))
    setToast('Đã xóa bài tập')
  }

  const saveWorkout = (plan: WorkoutPlan) => {
    setState((current) => ({ ...current, workoutPlans: current.workoutPlans.some((item) => item.id === plan.id) ? current.workoutPlans.map((item) => item.id === plan.id ? plan : item) : [plan, ...current.workoutPlans] }))
    setWorkoutModal(null)
    setToast('Đã lưu giáo án')
  }

  const deleteWorkout = (planId: string) => {
    if (!window.confirm('Xóa giáo án này?')) return
    setState((current) => ({ ...current, workoutPlans: current.workoutPlans.filter((plan) => plan.id !== planId) }))
    setToast('Đã xóa giáo án')
  }

  const saveMeal = (plan: MealPlan) => {
    setState((current) => ({ ...current, mealPlans: current.mealPlans.some((item) => item.id === plan.id) ? current.mealPlans.map((item) => item.id === plan.id ? plan : item) : [plan, ...current.mealPlans] }))
    setMealModal(null)
    setToast('Đã lưu thực đơn')
  }

  const deleteMeal = (planId: string) => {
    if (!window.confirm('Xóa thực đơn này?')) return
    setState((current) => ({ ...current, mealPlans: current.mealPlans.filter((plan) => plan.id !== planId) }))
    setToast('Đã xóa thực đơn')
  }

  const saveMetric = (metric: Metric) => {
    setState((current) => ({ ...current, metrics: current.metrics.some((item) => item.id === metric.id) ? current.metrics.map((item) => item.id === metric.id ? metric : item) : [metric, ...current.metrics], clients: current.clients.map((client) => client.id === metric.clientId ? { ...client, weight: metric.weight } : client) }))
    setMetricModal(null)
    setToast('Đã cập nhật chỉ số')
  }

  const handleCreate = () => {
    if (view === 'overview' || view === 'clients') setClientModal('new')
    else if (view === 'workouts') setWorkoutModal('new')
    else if (view === 'schedule') setSessionModal('new')
    else if (view === 'exercises') setExerciseModal('new')
    else if (view === 'nutrition') setMealModal('new')
    else setMetricModal('new')
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), version: 1, data: state }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `liftlog-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setToast('Đã xuất file backup JSON')
  }

  const resetData = () => {
    if (!window.confirm('Đặt lại toàn bộ dữ liệu về dữ liệu mẫu?')) return
    setState({ ...seedState, profile: { ...seedState.profile, ...(authEmail ? { email: authEmail } : {}) } })
    setToast('Đã khôi phục dữ liệu mẫu')
  }

  const saveProfile = (profile: TrainerProfile) => {
    setState((current) => ({ ...current, profile }))
    setShowProfile(false)
    setToast('Đã cập nhật profile')
  }

  const importData = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const nextState = parsed.data ?? parsed
        if (!nextState.clients || !nextState.sessions || !nextState.exercises || !nextState.mealPlans) throw new Error('invalid')
        setState(nextState)
        setToast('Đã khôi phục dữ liệu từ backup')
      } catch {
        setToast('File backup không hợp lệ')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const page = viewTitles[view]

  if (!authReady) return <div className="auth-loading">Đang kết nối Supabase...</div>
  if (!authenticated) return <LoginScreen profile={state.profile} onLogin={login} />
  if (!role) return <div className="auth-loading">Đang tải quyền truy cập...</div>
  if (role === 'member') return <MemberPortal onLogout={logout} />

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark"><Activity size={19} strokeWidth={2.5} /></div>
          <span className="brand-name">lift<span>log</span></span>
          <button className="mobile-close icon-button" onClick={() => setMobileNavOpen(false)} aria-label="Đóng menu"><X size={20} /></button>
        </div>
        <div className="workspace-switcher"><div className="workspace-avatar">{initials(state.profile.name).slice(0, 1)}</div><div><strong>{state.profile.name}</strong><span>{state.profile.bio || 'Personal Trainer'}</span></div><ChevronRight size={15} /></div>
        <nav className="main-nav" aria-label="Điều hướng chính">
          <p className="nav-label">Workspace</p>
          {navItems.map((item) => <button key={item.id} className={`nav-item ${view === item.id ? 'nav-item-active' : ''}`} onClick={() => goTo(item.id)}><item.icon size={18} strokeWidth={view === item.id ? 2.4 : 1.8} /><span>{item.label}</span>{item.id === 'clients' && <b>{activeClients.length}</b>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <p className="nav-label">System</p>
          <button className="nav-item" onClick={exportData}><FileDown size={18} /><span>Backup dữ liệu</span></button>
          <button className="nav-item" onClick={() => importRef.current?.click()}><ArrowUpRight size={18} /><span>Khôi phục backup</span></button>
          <input ref={importRef} type="file" accept="application/json" hidden onChange={importData} />
          <div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={16} /></div><strong>Keep showing up.</strong><p>Consistency beats intensity.</p><div className="upgrade-line"><span /></div><small>12 / 15 buổi tháng này</small></div>
          <div className="sidebar-user"><div className="user-photo">{initials(state.profile.name)}</div><div><strong>{state.profile.name}</strong><span>Gói Pro</span></div><button className="logout-button" onClick={logout} aria-label="Đăng xuất"><LogOut size={16} /></button></div>
        </div>
      </aside>
      {mobileNavOpen && <button className="mobile-overlay" onClick={() => setMobileNavOpen(false)} aria-label="Đóng menu" />}
      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileNavOpen(true)} aria-label="Mở menu"><Menu size={21} /></button>
          <div className="breadcrumbs"><span>{page.eyebrow}</span><ChevronRight size={14} /><strong>{page.title}</strong></div>
          <div className="topbar-actions"><button className="search-button" onClick={() => goTo('clients')}><Search size={17} /><span>Tìm kiếm gymer...</span><kbd>⌘ K</kbd></button><div className="topbar-avatar">{initials(state.profile.name)}</div></div>
        </header>
        <div className="page-wrap">
          <div className="page-heading"><div><p className="eyebrow">{page.eyebrow}</p><h1>{page.title}</h1><p className="page-description">{page.description}</p></div><button className={view === 'overview' || view === 'clients' ? 'primary-button' : 'secondary-button'} onClick={handleCreate}><Plus size={17} /> {view === 'overview' || view === 'clients' ? 'Thêm gymer' : 'Tạo mới'}</button></div>
          {view === 'overview' && <Dashboard state={state} onNavigate={goTo} onComplete={completeSession} />}
          {view === 'clients' && <ClientsView clients={state.clients} onAdd={() => setClientModal('new')} onEdit={(client) => setClientModal(client)} onDelete={deleteClient} onIssueAccount={(client) => setAccountModal(client)} />}
          {view === 'workouts' && <WorkoutsView state={state} onEdit={(plan) => setWorkoutModal(plan)} onDelete={deleteWorkout} />}
          {view === 'schedule' && <TimelineScheduleView sessions={state.sessions} clients={state.clients} onComplete={completeSession} onAdd={() => setSessionModal('new')} onEdit={(session) => setSessionModal(session)} onDelete={deleteSession} />}
          {view === 'exercises' && <ExercisesView exercises={state.exercises} onAdd={() => setExerciseModal('new')} onEdit={(exercise) => setExerciseModal(exercise)} onDelete={deleteExercise} />}
          {view === 'nutrition' && <NutritionView state={state} onAdd={() => setMealModal('new')} onEdit={(plan) => setMealModal(plan)} onDelete={deleteMeal} />}
          {view === 'progress' && <ProgressView clients={activeClients} metrics={state.metrics} onAdd={() => setMetricModal('new')} onEdit={(metric) => setMetricModal(metric)} />}
          {view === 'settings' && <SettingsView state={state} onExport={exportData} onImport={() => importRef.current?.click()} onReset={resetData} onEditProfile={() => setShowProfile(true)} />}
        </div>
      </main>
      {clientModal && <ClientModal existing={clientModal === 'new' ? undefined : clientModal} onClose={() => setClientModal(null)} onSave={saveClient} />}
      {sessionModal && <SessionModal existing={sessionModal === 'new' ? undefined : sessionModal} clients={activeClients} onClose={() => setSessionModal(null)} onSave={saveSession} />}
      {exerciseModal && <ExerciseModal existing={exerciseModal === 'new' ? undefined : exerciseModal} onClose={() => setExerciseModal(null)} onSave={saveExercise} />}
      {workoutModal && <WorkoutModal existing={workoutModal === 'new' ? undefined : workoutModal} clients={activeClients} exercises={state.exercises} onClose={() => setWorkoutModal(null)} onSave={saveWorkout} />}
      {mealModal && <MealModal existing={mealModal === 'new' ? undefined : mealModal} clients={activeClients} onClose={() => setMealModal(null)} onSave={saveMeal} />}
      {metricModal && <MetricModal existing={metricModal === 'new' ? undefined : metricModal} clients={activeClients} onClose={() => setMetricModal(null)} onSave={saveMetric} />}
      {accountModal && <IssueAccountModal client={accountModal} onClose={() => setAccountModal(null)} onDone={(message) => { setAccountModal(null); setToast(message); setHydrated(false); loadState().then((saved) => { if (saved) setState(saved); setHydrated(true) }).catch(() => setHydrated(true)) }} />}
      {showProfile && <ProfileModal profile={state.profile} onClose={() => setShowProfile(false)} onSave={saveProfile} />}
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, change, detail, tone }: { icon: LucideIcon; label: string; value: string; change?: string; detail: string; tone: string }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19} /></div><div className="stat-label">{label}<span className={change?.startsWith('-') ? 'change-down' : 'change-up'}>{change && <ArrowUpRight size={13} />}{change}</span></div><strong className="stat-value">{value}</strong><span className="stat-detail">{detail}</span></div>
}

function Dashboard({ state, onNavigate, onComplete }: { state: AppState; onNavigate: (view: View) => void; onComplete: (id: string) => void }) {
  const upcoming = state.sessions.filter((session) => session.status === 'upcoming').slice(0, 3)
  return <div className="dashboard-grid">
    <section className="welcome-card"><div className="welcome-copy"><span className="mini-kicker"><Sparkles size={13} /> Monday momentum</span><h2>Small steps.<br /><em>Strong results.</em></h2><p>Chào Alex, bạn có <strong>2 buổi tập</strong> và 3 việc cần follow-up hôm nay.</p><button className="light-button" onClick={() => onNavigate('schedule')}>Xem lịch hôm nay <ArrowUpRight size={16} /></button></div><div className="welcome-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="target-circle"><Target size={36} /></div><span className="art-label art-label-top">+18%</span><span className="art-label art-label-bottom">consistency</span></div></section>
    <div className="stat-grid"><StatCard icon={Users} label="Gymer active" value="12" change="+2" detail="so với tháng trước" tone="orange" /><StatCard icon={CalendarDays} label="Buổi tháng này" value="86" change="+12.4%" detail="86 / 100 mục tiêu" tone="purple" /><StatCard icon={TrendingUp} label="Tỉ lệ duy trì" value="91%" change="+4.8%" detail="cao hơn tháng trước" tone="green" /><StatCard icon={Apple} label="Kế hoạch dinh dưỡng" value="8" detail="3 cần xem lại" tone="yellow" /></div>
    <section className="panel schedule-panel"><PanelHeading title="Lịch hôm nay" subtitle="01 tháng 09, 2024" action="Xem tất cả" onAction={() => onNavigate('schedule')} /><div className="session-list">{upcoming.length ? upcoming.map((session) => <SessionRow key={session.id} session={session} client={state.clients.find((client) => client.id === session.clientId)} onComplete={onComplete} />) : <EmptyState text="Không còn buổi tập sắp tới" />}</div><button className="add-slot" onClick={() => onNavigate('schedule')}><Plus size={16} /> Thêm khung giờ</button></section>
    <section className="panel progress-panel"><PanelHeading title="Tổng quan tiến độ" subtitle="12 gymer đang active" action="Chi tiết" onAction={() => onNavigate('progress')} /><div className="chart-header"><div><strong>+6.8%</strong><span>trung bình cân nặng mục tiêu</span></div><span className="chart-period">30 ngày <ChevronRight size={14} /></span></div><ProgressChart /></section>
    <section className="panel clients-panel"><PanelHeading title="Gymer cần chú ý" subtitle="Follow-up trong tuần này" action="Xem danh sách" onAction={() => onNavigate('clients')} /><div className="attention-list">{state.clients.slice(0, 4).map((client, index) => <div className="attention-row" key={client.id}><Avatar client={client} size="small" /><div className="attention-info"><strong>{client.name}</strong><span>{index === 0 ? 'Chưa cập nhật chỉ số 7 ngày' : index === 1 ? 'Có buổi tập ngày hôm nay' : 'Đang theo sát mục tiêu'}</span></div><span className={`attention-dot attention-${index}`} /></div>)}</div></section>
    <section className="panel focus-panel"><div className="focus-top"><span className="mini-kicker dark"><Dumbbell size={13} /> Focus of the week</span><MoreHorizontal size={19} /></div><h3>Build the habit,<br /><span>not the hype.</span></h3><p>Consistency là lợi thế cạnh tranh bền vững nhất của một PT.</p><div className="focus-footer"><div className="focus-avatars">{state.clients.slice(0, 3).map((client) => <Avatar key={client.id} client={client} size="small" />)}</div><span>12 người đang tin bạn</span></div></section>
  </div>
}

function PanelHeading({ title, subtitle, action, onAction }: { title: string; subtitle: string; action?: string; onAction?: () => void }) {
  return <div className="panel-heading"><div><h3>{title}</h3><p>{subtitle}</p></div>{action && <button className="text-button" onClick={onAction}>{action}<ChevronRight size={15} /></button>}</div>
}

function ProgressChart() {
  return <div className="chart-wrap"><svg viewBox="0 0 540 168" role="img" aria-label="Biểu đồ tiến độ tăng trưởng"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity=".2" /><stop offset="100%" stopColor="#f97316" stopOpacity="0" /></linearGradient></defs><path d="M0 136 C36 126 44 115 72 119 S112 102 140 110 S178 78 214 91 S260 74 288 80 S321 50 350 61 S382 38 412 48 S452 20 486 28 S518 13 540 18 L540 168 L0 168 Z" fill="url(#chartFill)" /><path d="M0 136 C36 126 44 115 72 119 S112 102 140 110 S178 78 214 91 S260 74 288 80 S321 50 350 61 S382 38 412 48 S452 20 486 28 S518 13 540 18" fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" /><circle cx="486" cy="28" r="5" fill="#fff" stroke="#f97316" strokeWidth="3" /></svg><div className="chart-labels"><span>01/08</span><span>08/08</span><span>15/08</span><span>22/08</span><span>01/09</span></div></div>
}

function ClientsView({ clients, onAdd, onEdit, onDelete, onIssueAccount }: { clients: Client[]; onAdd: () => void; onEdit: (client: Client) => void; onDelete: (id: string) => void; onIssueAccount: (client: Client) => void }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | ClientStatus>('all')
  const visible = clients.filter((client) => (filter === 'all' || client.status === filter) && client.name.toLowerCase().includes(query.toLowerCase()))
  return <div className="view-stack"><div className="toolbar"><div className="input-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên gymer..." /></div><div className="filter-group"><button className={filter === 'all' ? 'filter-active' : ''} onClick={() => setFilter('all')}>Tất cả <b>{clients.length}</b></button><button className={filter === 'active' ? 'filter-active' : ''} onClick={() => setFilter('active')}>Đang tập <b>{clients.filter((client) => client.status === 'active').length}</b></button><button className={filter === 'paused' ? 'filter-active' : ''} onClick={() => setFilter('paused')}>Tạm nghỉ</button></div><button className="outline-button" onClick={onAdd}><Plus size={16} /> Thêm nhanh</button></div><div className="client-table panel"><div className="table-head"><span>Gymer</span><span>Mục tiêu</span><span>Trạng thái</span><span>Tiến độ</span><span>Buổi tháng này</span><span /></div>{visible.map((client) => <div className="client-table-row" key={client.id}><div className="client-cell"><Avatar client={client} /><div><strong>{client.name}</strong><span>{client.email}</span></div></div><span className="goal-tag">{client.goal}</span><StatusPill status={client.status} /><div className="table-progress"><div><span style={{ width: `${client.progress}%` }} /></div><small>{client.progress}%</small></div><strong className="session-count">{client.sessionsThisMonth} <small>/ 15 buổi</small></strong><div className="row-actions"><button className={`account-button ${client.accountStatus === 'active' ? 'account-active' : ''}`} disabled={Boolean(client.userId)} onClick={() => onIssueAccount(client)} title={client.userId ? 'Member đã có account' : 'Cấp account member'}>{client.userId ? <Check size={14} /> : <KeyRound size={14} />}</button><button className="more-button" onClick={() => onEdit(client)} aria-label={`Sửa ${client.name}`}><Pencil size={15} /></button><button className="more-button danger-button" onClick={() => onDelete(client.id)} aria-label={`Xóa ${client.name}`}><Trash2 size={15} /></button></div></div>)}{!visible.length && <EmptyState text="Không tìm thấy gymer phù hợp" />}</div></div>
}

function WorkoutsView({ state, onEdit, onDelete }: { state: AppState; onEdit: (plan: WorkoutPlan) => void; onDelete: (id: string) => void }) {
  return <div className="view-stack"><div className="workout-intro panel"><div><span className="eyebrow">Programming library</span><h2>Giáo án rõ ràng, tiến bộ có chủ đích.</h2><p>Tạo chương trình theo mục tiêu, tần suất và nhóm bài tập của từng gymer.</p></div><div className="workout-stat"><strong>{state.workoutPlans.length}</strong><span>giáo án đang quản lý</span></div></div><div className="workout-grid">{state.workoutPlans.map((plan, index) => { const client = state.clients.find((item) => item.id === plan.clientId); return <article className="workout-card panel" key={plan.id}><div className={`workout-cover workout-cover-${index % 3}`}><span>{plan.status === 'active' ? 'Đang áp dụng' : 'Bản nháp'}</span><Dumbbell size={31} /></div><div className="workout-card-body"><div className="card-title-row"><div><h3>{plan.name}</h3><p>{client?.name ?? 'Không xác định'} · {plan.goal}</p></div><div className="row-actions"><button className="more-button" onClick={() => onEdit(plan)} aria-label="Sửa giáo án"><Pencil size={15} /></button><button className="more-button danger-button" onClick={() => onDelete(plan.id)} aria-label="Xóa giáo án"><Trash2 size={15} /></button></div></div><div className="workout-meta"><span><strong>{plan.frequency}x</strong> / tuần</span><span><strong>{plan.durationWeeks}</strong> tuần</span><span><strong>{plan.exerciseIds.length}</strong> bài</span></div><small className="updated-label">Cập nhật {plan.updatedAt}</small></div></article> })}{!state.workoutPlans.length && <EmptyState text="Chưa có giáo án nào" />}</div></div>
}

function ScheduleView({ state, onComplete, onAdd, onEdit, onDelete }: { state: AppState; onComplete: (id: string) => void; onAdd: () => void; onEdit: (session: Session) => void; onDelete: (id: string) => void }) {
  const [tab, setTab] = useState('week')
  const [monthCursor, setMonthCursor] = useState(new Date(2024, 8, 1))
  const [selectedDate, setSelectedDate] = useState('2024-09-01')
  const year = monthCursor.getFullYear()
  const month = monthCursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7
  const monthCells = Array.from({ length: startOffset + daysInMonth }, (_, index) => index < startOffset ? null : index - startOffset + 1)
  const monthTitle = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(monthCursor)
  const visibleSessions = tab === 'month' ? state.sessions.filter((session) => session.date === selectedDate) : state.sessions
  const changeMonth = (delta: number) => { const next = new Date(year, month + delta, 1); setMonthCursor(next); setSelectedDate(next.toISOString().slice(0, 8) + '01') }
  return <div className="view-stack"><div className="calendar-toolbar"><div className="view-tabs"><button className={tab === 'week' ? 'tab-active' : ''} onClick={() => setTab('week')}>Tuần này</button><button className={tab === 'month' ? 'tab-active' : ''} onClick={() => setTab('month')}>Tháng này</button></div><button className="outline-button" onClick={onAdd}><Plus size={16} /> Thêm buổi tập</button><button className="outline-button"><SlidersHorizontal size={16} /> Lọc lịch</button></div>{tab === 'week' ? <div className="week-strip">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, index) => <div className={index === 0 ? 'day-cell day-selected' : 'day-cell'} key={day}><span>{day}</span><strong>{index + 1}</strong>{index < 5 && <i />}</div>)}</div> : <section className="panel month-calendar"><div className="month-heading"><button className="icon-button" onClick={() => changeMonth(-1)} aria-label="Tháng trước"><ChevronLeft size={18} /></button><h2>{monthTitle}</h2><button className="icon-button" onClick={() => changeMonth(1)} aria-label="Tháng sau"><ChevronRight size={18} /></button></div><div className="month-weekdays">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => <span key={day}>{day}</span>)}</div><div className="month-grid">{monthCells.map((day, index) => { const date = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : ''; const count = date ? state.sessions.filter((session) => session.date === date).length : 0; return <button className={`month-day ${date === selectedDate ? 'month-day-selected' : ''} ${!day ? 'month-day-empty' : ''}`} key={`${date}-${index}`} disabled={!day} onClick={() => date && setSelectedDate(date)}><span>{day}</span>{count > 0 && <i>{count}</i>}</button> })}</div></section>}<section className="panel agenda-panel"><PanelHeading title={tab === 'month' ? `Buổi tập ngày ${selectedDate.split('-').reverse().join('/')}` : 'Lịch agenda'} subtitle={`${visibleSessions.filter((session) => session.status === 'upcoming').length} buổi sắp tới`} action="Sync calendar" /><div className="agenda-list">{visibleSessions.map((session) => <SessionRow key={session.id} session={session} client={state.clients.find((client) => client.id === session.clientId)} onComplete={onComplete} onEdit={onEdit} onDelete={onDelete} />)}</div>{!visibleSessions.length && <EmptyState text={tab === 'month' ? 'Ngày này chưa có buổi tập' : 'Chưa có buổi tập nào'} />}</section></div>
}

function ExercisesView({ exercises, onAdd, onEdit, onDelete }: { exercises: Exercise[]; onAdd: () => void; onEdit: (exercise: Exercise) => void; onDelete: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const visible = exercises.filter((exercise) => `${exercise.name} ${exercise.muscle} ${exercise.equipment}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="view-stack"><div className="toolbar"><div className="input-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm bài tập, nhóm cơ..." /></div><button className="outline-button" onClick={onAdd}><Plus size={16} /> Thêm bài tập</button><button className="outline-button"><Filter size={16} /> Nhóm cơ</button><button className="outline-button">Dụng cụ <ChevronRight size={15} /></button></div><div className="exercise-grid">{visible.map((exercise, index) => <div className="exercise-card" key={exercise.id}><div className={`exercise-art exercise-art-${index % 4}`}><Dumbbell size={28} /><span>{exercise.level}</span></div><div className="exercise-card-body"><div className="card-title-row"><div><h3>{exercise.name}</h3><p>{exercise.muscle}</p></div><div className="row-actions"><button className="more-button" onClick={() => onEdit(exercise)} aria-label="Sửa bài tập"><Pencil size={15} /></button><button className="more-button danger-button" onClick={() => onDelete(exercise.id)} aria-label="Xóa bài tập"><Trash2 size={15} /></button></div></div><div className="exercise-meta"><span><strong>{exercise.sets}</strong> sets</span><span><strong>{exercise.reps}</strong> reps</span><span>{exercise.equipment}</span></div></div></div>)}</div></div>
}

function NutritionView({ state, onAdd, onEdit, onDelete }: { state: AppState; onAdd: () => void; onEdit: (plan: MealPlan) => void; onDelete: (id: string) => void }) {
  return <div className="view-stack"><div className="nutrition-summary"><div><span className="eyebrow">Weekly adherence</span><strong>84%</strong><p>+8.2% so với tuần trước</p></div><div className="adherence-bars">{[64, 82, 70, 92, 85, 76, 55].map((height, index) => <div key={index}><span style={{ height: `${height}%` }} /><small>{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][index]}</small></div>)}</div></div><section className="panel meal-table"><PanelHeading title="Kế hoạch hiện tại" subtitle={`${state.mealPlans.length} gymer có thực đơn đang áp dụng`} action="Tạo thực đơn" onAction={onAdd} /><div className="table-head meal-head"><span>Gymer</span><span>Calories / ngày</span><span>Macro</span><span>Bữa ăn</span><span>Trạng thái</span><span /></div>{state.mealPlans.map((plan) => { const client = state.clients.find((item) => item.id === plan.clientId); if (!client) return null; return <div className="meal-row" key={plan.id}><div className="client-cell"><Avatar client={client} size="small" /><div><strong>{client.name}</strong><span>{client.goal}</span></div></div><strong>{formatNumber(plan.calories)} <small>kcal</small></strong><div className="macro-stack"><span className="meal-items">{plan.items?.slice(0, 2).join(' · ') || 'Chưa thêm món'}{plan.items?.length > 2 ? ' ...' : ''}</span><span><i className="protein" />{plan.protein}g protein</span><span><i className="carbs" />{plan.carbs}g carbs</span><span><i className="fat" />{plan.fat}g fat</span></div><span>{plan.meals} bữa</span><StatusPill status={plan.status} /><div className="row-actions"><button className="more-button" onClick={() => onEdit(plan)} aria-label="Sửa thực đơn"><Pencil size={15} /></button><button className="more-button danger-button" onClick={() => onDelete(plan.id)} aria-label="Xóa thực đơn"><Trash2 size={15} /></button></div></div> })}</section></div>
}

function ProgressView({ clients, metrics, onAdd, onEdit }: { clients: Client[]; metrics: Metric[]; onAdd: () => void; onEdit: (metric: Metric) => void }) {
  const averageWeight = clients.length ? (clients.reduce((sum, client) => sum + client.weight, 0) / clients.length).toFixed(1) : '0.0'
  return <div className="view-stack"><div className="progress-kpi-grid"><div className="progress-kpi"><span>Cân nặng trung bình</span><strong>{averageWeight} <small>kg</small></strong><p className="positive"><TrendingDown size={14} /> Theo dõi realtime</p></div><div className="progress-kpi"><span>Goal completion</span><strong>{clients.length ? Math.round(clients.reduce((sum, client) => sum + client.progress, 0) / clients.length) : 0}<small>%</small></strong><p className="positive"><ArrowUpRight size={14} /> Từ hồ sơ gymer</p></div><div className="progress-kpi"><span>Check-in đã lưu</span><strong>{metrics.length}<small> lần</small></strong><p><Check size={14} /> Cập nhật liên tục</p></div></div><section className="panel progress-table"><PanelHeading title="Theo dõi từng gymer" subtitle="Cập nhật gần nhất của các gymer active" action="+ Ghi chỉ số" onAction={onAdd} /><div className="progress-client-list">{clients.map((client) => { const latest = metrics.find((metric) => metric.clientId === client.id); return <div className="progress-client-row" key={client.id}><Avatar client={client} /><div className="progress-client-name"><strong>{client.name}</strong><span>{client.goal}</span></div><div className="weight-change"><span>Cân nặng</span><strong>{client.weight || '—'} kg</strong><small className={client.weight <= client.weightStart ? 'positive' : 'negative'}>{client.weightStart ? `${Math.abs(client.weight - client.weightStart).toFixed(1)} kg` : 'Chưa có baseline'}</small></div><div className="goal-progress"><div><span style={{ width: `${client.progress}%` }} /></div><small>{client.progress}% goal</small></div>{latest && <button className="more-button" onClick={() => onEdit(latest)} aria-label={`Sửa chỉ số của ${client.name}`}><Pencil size={15} /></button>}<ChevronRight size={17} className="muted-icon" /></div> })}</div></section><section className="panel metric-history"><PanelHeading title="Lịch sử check-in" subtitle="Các lần đo gần đây" action="+ Ghi chỉ số" onAction={onAdd} />{metrics.slice(0, 10).map((metric) => { const client = clients.find((item) => item.id === metric.clientId); if (!client) return null; return <div className="metric-row" key={metric.id}><Avatar client={client} size="small" /><div><strong>{client.name}</strong><span>{metric.date}</span></div><b>{metric.weight} kg</b><span>{metric.bodyFat ? `${metric.bodyFat}% body fat` : 'Chưa có body fat'}</span><span>{metric.waist ? `${metric.waist} cm eo` : '—'}</span><button className="more-button" onClick={() => onEdit(metric)} aria-label="Sửa check-in"><Pencil size={15} /></button></div>})}{!metrics.length && <EmptyState text="Chưa có lần check-in nào" />}</section></div>
}

function SessionRow({ session, client, onComplete, onEdit, onDelete }: { session: Session; client?: Client; onComplete: (id: string) => void; onEdit?: (session: Session) => void; onDelete?: (id: string) => void }) {
  if (!client) return null
  return <div className="session-row"><div className="session-time"><strong>{session.time}</strong><span>{session.date}</span></div><div className="session-divider" style={{ background: session.accent }} /><Avatar client={client} size="small" /><div className="session-info"><strong>{client.name}</strong><span>{session.type} · {session.duration} min</span></div><StatusPill status={session.status} /><div className="row-actions"><button className="session-action" onClick={() => onComplete(session.id)} aria-label={`Đánh dấu buổi tập của ${client.name} hoàn thành`}><Check size={16} /></button>{onEdit && <button className="more-button" onClick={() => onEdit(session)} aria-label="Sửa buổi tập"><Pencil size={15} /></button>}{onDelete && <button className="more-button danger-button" onClick={() => onDelete(session.id)} aria-label="Xóa buổi tập"><Trash2 size={15} /></button>}</div></div>
}

function ModalFrame({ title, eyebrow, onClose, children }: { title: string; eyebrow: string; onClose: () => void; children: ReactNode }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}><div className="modal"><div className="modal-header"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Đóng"><X size={19} /></button></div>{children}</div></div>
}

function ClientModal({ existing, onClose, onSave }: { existing?: Client; onClose: () => void; onSave: (client: Client) => void }) {
  const [name, setName] = useState(existing?.name ?? '')
  const [email, setEmail] = useState(existing?.email ?? '')
  const [phone, setPhone] = useState(existing?.phone ?? '')
  const [goal, setGoal] = useState(existing?.goal ?? 'Tăng cơ')
  const [status, setStatus] = useState<ClientStatus>(existing?.status ?? 'active')
  const [weight, setWeight] = useState(existing?.weight ? String(existing.weight) : '')
  const [progress, setProgress] = useState(String(existing?.progress ?? 0))
  const [note, setNote] = useState(existing?.note ?? '')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    const colorOptions = ['#f97316', '#4f46e5', '#0f766e', '#db2777', '#ca8a04']
    const parsedWeight = Number(weight) || 0
    onSave({ id: existing?.id ?? `c-${Date.now()}`, name: name.trim(), email: email.trim() || 'Chưa cập nhật email', phone: phone.trim(), goal, status, avatar: existing?.avatar || initials(name), color: existing?.color || colorOptions[Math.floor(Math.random() * colorOptions.length)], joinedAt: existing?.joinedAt ?? new Date().toISOString(), weight: parsedWeight, weightStart: existing?.weightStart || parsedWeight, sessionsThisMonth: existing?.sessionsThisMonth ?? 0, progress: Math.min(100, Math.max(0, Number(progress) || 0)), nextSession: existing?.nextSession ?? 'Chưa lên lịch', note, userId: existing?.userId ?? null, accountStatus: existing?.accountStatus ?? 'none' })
  }
  return <ModalFrame title={existing ? 'Sửa hồ sơ gymer' : 'Thêm gymer mới'} eyebrow={existing ? 'Edit profile' : 'New profile'} onClose={onClose}><form onSubmit={submit}><label>Họ và tên<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Nguyễn Minh Anh" required /></label><div className="form-grid"><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" /></label><label>Số điện thoại<input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="090 123 4567" /></label></div><div className="form-grid"><label>Mục tiêu<select value={goal} onChange={(event) => setGoal(event.target.value)}><option>Tăng cơ</option><option>Giảm mỡ</option><option>Cải thiện sức bền</option><option>Phục hồi</option></select></label><label>Trạng thái<select value={status} onChange={(event) => setStatus(event.target.value as ClientStatus)}><option value="active">Đang tập</option><option value="paused">Tạm nghỉ</option><option value="lead">Tiềm năng</option></select></label></div><div className="form-grid"><label>Cân nặng (kg)<input type="number" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="0" /></label><label>Tiến độ mục tiêu (%)<input type="number" min="0" max="100" value={progress} onChange={(event) => setProgress(event.target.value)} /></label></div><label>Ghi chú<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Mục tiêu, lưu ý sức khỏe..." /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Hủy</button><button type="submit" className="primary-button"><Save size={16} /> Lưu hồ sơ</button></div></form></ModalFrame>
}

function SessionModal({ existing, clients, onClose, onSave }: { existing?: Session; clients: Client[]; onClose: () => void; onSave: (session: Session) => void }) {
  const [clientId, setClientId] = useState(existing?.clientId ?? clients[0]?.id ?? '')
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState(existing?.time ?? '08:00')
  const [duration, setDuration] = useState(String(existing?.duration ?? 60))
  const [type, setType] = useState(existing?.type ?? 'Strength training')
  const [status, setStatus] = useState<Session['status']>(existing?.status ?? 'upcoming')
  const [isPublic, setIsPublic] = useState(existing?.isPublic ?? false)
  const [publicStatus, setPublicStatus] = useState<NonNullable<Session['publicStatus']>>(existing?.publicStatus ?? 'booked')
  const [publicLabel, setPublicLabel] = useState(existing?.publicLabel ?? 'Đã có lịch')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!clientId) return
    onSave({ id: existing?.id ?? `s-${Date.now()}`, clientId, date, time, duration: Number(duration) || 60, type: type.trim() || 'Training session', status, accent: existing?.accent ?? '#f97316', isPublic, publicStatus, publicLabel: publicLabel.trim() || 'Đã có lịch' })
  }
  return <ModalFrame title={existing ? 'Sửa buổi tập' : 'Tạo buổi tập'} eyebrow={existing ? 'Edit session' : 'New session'} onClose={onClose}><form onSubmit={submit}><label>Gymer<select value={clientId} onChange={(event) => setClientId(event.target.value)}>{clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label><div className="form-grid"><label>Ngày<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label>Giờ<input type="time" value={time} onChange={(event) => setTime(event.target.value)} required /></label></div><div className="form-grid"><label>Thời lượng (phút)<input type="number" min="15" step="15" value={duration} onChange={(event) => setDuration(event.target.value)} /></label><label>Trạng thái<select value={status} onChange={(event) => setStatus(event.target.value as Session['status'])}><option value="upcoming">Sắp tới</option><option value="completed">Hoàn thành</option><option value="missed">Bỏ lỡ</option></select></label></div><label>Nội dung buổi tập<input value={type} onChange={(event) => setType(event.target.value)} placeholder="Ví dụ: Lower body strength" /></label><label className="public-toggle"><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} /><span><strong>Hiển thị trên lịch public</strong><small>Không hiển thị tên hoặc thông tin member</small></span></label>{isPublic && <div className="form-grid"><label>Nhãn public<input value={publicLabel} onChange={(event) => setPublicLabel(event.target.value)} placeholder="Đã có lịch" /></label><label>Trạng thái public<select value={publicStatus} onChange={(event) => setPublicStatus(event.target.value as NonNullable<Session['publicStatus']>)}><option value="available">Còn lịch</option><option value="booked">Đã kín</option><option value="blocked">Không nhận lịch</option></select></label></div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Hủy</button><button type="submit" className="primary-button"><Save size={16} /> Lưu buổi tập</button></div></form></ModalFrame>
}

function ExerciseModal({ existing, onClose, onSave }: { existing?: Exercise; onClose: () => void; onSave: (exercise: Exercise) => void }) {
  const [name, setName] = useState(existing?.name ?? '')
  const [muscle, setMuscle] = useState(existing?.muscle ?? '')
  const [equipment, setEquipment] = useState(existing?.equipment ?? 'Bodyweight')
  const [level, setLevel] = useState<Exercise['level']>(existing?.level ?? 'Beginner')
  const [sets, setSets] = useState(String(existing?.sets ?? 3))
  const [reps, setReps] = useState(existing?.reps ?? '10–12')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    onSave({ id: existing?.id ?? `e-${Date.now()}`, name: name.trim(), muscle: muscle.trim() || 'Full body', equipment: equipment.trim() || 'Bodyweight', level, sets: Number(sets) || 3, reps: reps.trim() || '10–12' })
  }
  return <ModalFrame title={existing ? 'Sửa bài tập' : 'Thêm bài tập'} eyebrow={existing ? 'Edit exercise' : 'New exercise'} onClose={onClose}><form onSubmit={submit}><label>Tên bài tập<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Barbell Back Squat" required /></label><div className="form-grid"><label>Nhóm cơ<input value={muscle} onChange={(event) => setMuscle(event.target.value)} placeholder="Quads · Glutes" /></label><label>Dụng cụ<input value={equipment} onChange={(event) => setEquipment(event.target.value)} placeholder="Barbell" /></label></div><div className="form-grid"><label>Độ khó<select value={level} onChange={(event) => setLevel(event.target.value as Exercise['level'])}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label>Sets<input type="number" min="1" value={sets} onChange={(event) => setSets(event.target.value)} /></label></div><label>Số reps<input value={reps} onChange={(event) => setReps(event.target.value)} placeholder="8–10" /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Hủy</button><button type="submit" className="primary-button"><Save size={16} /> Lưu bài tập</button></div></form></ModalFrame>
}

function WorkoutModal({ existing, clients, exercises, onClose, onSave }: { existing?: WorkoutPlan; clients: Client[]; exercises: Exercise[]; onClose: () => void; onSave: (plan: WorkoutPlan) => void }) {
  const [clientId, setClientId] = useState(existing?.clientId ?? clients[0]?.id ?? '')
  const [name, setName] = useState(existing?.name ?? '')
  const [goal, setGoal] = useState(existing?.goal ?? 'Tăng cơ')
  const [frequency, setFrequency] = useState(String(existing?.frequency ?? 3))
  const [durationWeeks, setDurationWeeks] = useState(String(existing?.durationWeeks ?? 6))
  const [status, setStatus] = useState<WorkoutPlan['status']>(existing?.status ?? 'draft')
  const [exerciseIds, setExerciseIds] = useState<string[]>(existing?.exerciseIds ?? [])
  const toggleExercise = (id: string) => setExerciseIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!clientId || !name.trim()) return
    onSave({ id: existing?.id ?? `w-${Date.now()}`, clientId, name: name.trim(), goal, frequency: Number(frequency) || 3, durationWeeks: Number(durationWeeks) || 6, exerciseIds, status, updatedAt: new Date().toISOString().slice(0, 10) })
  }
  return <ModalFrame title={existing ? 'Sửa giáo án' : 'Tạo giáo án'} eyebrow={existing ? 'Edit program' : 'New program'} onClose={onClose}><form onSubmit={submit}><div className="form-grid"><label>Gymer<select value={clientId} onChange={(event) => setClientId(event.target.value)}>{clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label><label>Trạng thái<select value={status} onChange={(event) => setStatus(event.target.value as WorkoutPlan['status'])}><option value="draft">Bản nháp</option><option value="active">Đang áp dụng</option></select></label></div><label>Tên giáo án<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Hypertrophy Phase 01" required /></label><div className="form-grid"><label>Mục tiêu<select value={goal} onChange={(event) => setGoal(event.target.value)}><option>Tăng cơ</option><option>Giảm mỡ</option><option>Cải thiện sức bền</option><option>Phục hồi</option></select></label><label>Tần suất / tuần<input type="number" min="1" max="7" value={frequency} onChange={(event) => setFrequency(event.target.value)} /></label></div><label>Số tuần<input type="number" min="1" max="52" value={durationWeeks} onChange={(event) => setDurationWeeks(event.target.value)} /></label><fieldset className="exercise-picker"><legend>Chọn bài tập ({exerciseIds.length})</legend>{exercises.map((exercise) => <label className="check-row" key={exercise.id}><input type="checkbox" checked={exerciseIds.includes(exercise.id)} onChange={() => toggleExercise(exercise.id)} /><span>{exercise.name}<small>{exercise.muscle}</small></span><Check size={15} /></label>)}</fieldset><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Hủy</button><button type="submit" className="primary-button"><Save size={16} /> Lưu giáo án</button></div></form></ModalFrame>
}

function MealModal({ existing, clients, onClose, onSave }: { existing?: MealPlan; clients: Client[]; onClose: () => void; onSave: (plan: MealPlan) => void }) {
  const [clientId, setClientId] = useState(existing?.clientId ?? clients[0]?.id ?? '')
  const [calories, setCalories] = useState(String(existing?.calories ?? 2000))
  const [protein, setProtein] = useState(String(existing?.protein ?? 140))
  const [carbs, setCarbs] = useState(String(existing?.carbs ?? 220))
  const [fat, setFat] = useState(String(existing?.fat ?? 60))
  const [meals, setMeals] = useState(String(existing?.meals ?? 4))
  const [items, setItems] = useState<string[]>(existing?.items ?? [])
  const [newItem, setNewItem] = useState('')
  const [status, setStatus] = useState<MealPlan['status']>(existing?.status ?? 'on-track')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!clientId) return
    onSave({ id: existing?.id ?? `m-${Date.now()}`, clientId, calories: Number(calories) || 0, protein: Number(protein) || 0, carbs: Number(carbs) || 0, fat: Number(fat) || 0, meals: Number(meals) || 3, status, items })
  }
  const addItem = () => { const value = newItem.trim(); if (!value) return; setItems((current) => [...current, value]); setNewItem('') }
  return <ModalFrame title={existing ? 'Sửa thực đơn' : 'Tạo thực đơn'} eyebrow={existing ? 'Edit meal plan' : 'New meal plan'} onClose={onClose}><form onSubmit={submit}><label>Gymer<select value={clientId} onChange={(event) => setClientId(event.target.value)}>{clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label><div className="form-grid"><label>Calories / ngày<input type="number" min="0" value={calories} onChange={(event) => setCalories(event.target.value)} /></label><label>Số bữa<input type="number" min="1" max="8" value={meals} onChange={(event) => setMeals(event.target.value)} /></label></div><div className="form-grid"><label>Protein (g)<input type="number" min="0" value={protein} onChange={(event) => setProtein(event.target.value)} /></label><label>Carbs (g)<input type="number" min="0" value={carbs} onChange={(event) => setCarbs(event.target.value)} /></label></div><div className="form-grid"><label>Fat (g)<input type="number" min="0" value={fat} onChange={(event) => setFat(event.target.value)} /></label><label>Trạng thái<select value={status} onChange={(event) => setStatus(event.target.value as MealPlan['status'])}><option value="on-track">Đúng kế hoạch</option><option value="needs-review">Cần xem lại</option></select></label></div><label>Danh sách món ăn<span className="field-hint">Thêm từng món vào thực đơn trong ngày</span><div className="food-editor">{items.map((item, index) => <span className="food-chip" key={`${item}-${index}`}>{item}<button type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Xóa ${item}`}><X size={12} /></button></span>)}<div className="food-add-row"><input value={newItem} onChange={(event) => setNewItem(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addItem() } }} placeholder="Ví dụ: Ức gà + cơm gạo lứt" /><button type="button" className="outline-button" onClick={addItem}><Plus size={15} /> Thêm món</button></div></div></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Hủy</button><button type="submit" className="primary-button"><Save size={16} /> Lưu thực đơn</button></div></form></ModalFrame>
}

function MetricModal({ existing, clients, onClose, onSave }: { existing?: Metric; clients: Client[]; onClose: () => void; onSave: (metric: Metric) => void }) {
  const [clientId, setClientId] = useState(existing?.clientId ?? clients[0]?.id ?? '')
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0, 10))
  const [weight, setWeight] = useState(String(existing?.weight ?? ''))
  const [bodyFat, setBodyFat] = useState(String(existing?.bodyFat ?? ''))
  const [waist, setWaist] = useState(String(existing?.waist ?? ''))
  const [note, setNote] = useState(existing?.note ?? '')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!clientId || !weight) return
    onSave({ id: existing?.id ?? `mt-${Date.now()}`, clientId, date, weight: Number(weight) || 0, bodyFat: Number(bodyFat) || 0, waist: Number(waist) || 0, note })
  }
  return <ModalFrame title={existing ? 'Sửa chỉ số' : 'Ghi chỉ số mới'} eyebrow={existing ? 'Edit check-in' : 'New check-in'} onClose={onClose}><form onSubmit={submit}><div className="form-grid"><label>Gymer<select value={clientId} onChange={(event) => setClientId(event.target.value)}>{clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label><label>Ngày<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label></div><div className="form-grid"><label>Cân nặng (kg)<input type="number" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} required /></label><label>Body fat (%)<input type="number" step="0.1" value={bodyFat} onChange={(event) => setBodyFat(event.target.value)} /></label></div><label>Vòng eo (cm)<input type="number" step="0.1" value={waist} onChange={(event) => setWaist(event.target.value)} /></label><label>Ghi chú<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Cảm nhận, năng lượng, lưu ý..." /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Hủy</button><button type="submit" className="primary-button"><Save size={16} /> Lưu chỉ số</button></div></form></ModalFrame>
}

function SettingsView({ state, onExport, onImport, onReset, onEditProfile }: { state: AppState; onExport: () => void; onImport: () => void; onReset: () => void; onEditProfile: () => void }) {
  const [unit, setUnit] = useState('metric')
  return <div className="settings-grid"><section className="panel settings-profile"><div className="settings-profile-mark">{initials(state.profile.name)}</div><div><span className="eyebrow">Your workspace</span><h2>{state.profile.name}</h2><p>{state.profile.bio || 'Personal Trainer'}</p>{state.profile.publicSlug && <a className="public-link" href={`/pt/${state.profile.publicSlug}`} target="_blank" rel="noreferrer">Lịch công khai /pt/{state.profile.publicSlug}</a>}</div><button className="outline-button" onClick={onEditProfile}><Pencil size={15} /> Sửa profile</button></section><section className="panel settings-card"><div className="settings-card-heading"><div><h3>Dữ liệu local</h3><p>Tất cả dữ liệu được lưu trên thiết bị này.</p></div><span className="saved-indicator"><i /> Đang hoạt động</span></div><div className="data-counts"><div><strong>{state.clients.length}</strong><span>Gymer</span></div><div><strong>{state.sessions.length}</strong><span>Buổi tập</span></div><div><strong>{state.workoutPlans.length}</strong><span>Giáo án</span></div><div><strong>{state.metrics.length}</strong><span>Check-in</span></div></div><div className="settings-actions"><button className="outline-button" onClick={onExport}><FileDown size={16} /> Xuất backup JSON</button><button className="outline-button" onClick={onImport}><ArrowUpRight size={16} /> Khôi phục backup</button></div></section><section className="panel settings-card"><div className="settings-card-heading"><div><h3>Tùy chọn hiển thị</h3><p>Thiết lập cách hiển thị thông tin cho bạn.</p></div></div><label className="settings-select">Đơn vị đo<select value={unit} onChange={(event) => setUnit(event.target.value)}><option value="metric">Metric · kg / cm</option><option value="imperial">Imperial · lb / in</option></select></label><div className="setting-toggle"><div><strong>Nhắc lịch trong app</strong><span>Hiển thị lịch hẹn trong workspace</span></div><span className="toggle-on"><i /></span></div></section><section className="panel settings-card danger-zone"><div className="settings-card-heading"><div><h3>Vùng nguy hiểm</h3><p>Xóa dữ liệu hiện tại và bắt đầu lại với dữ liệu mẫu.</p></div></div><button className="danger-outline" onClick={onReset}><RotateCcw size={16} /> Khôi phục dữ liệu mẫu</button></section></div>
}

function ProfileModal({ profile, onClose, onSave }: { profile: TrainerProfile; onClose: () => void; onSave: (profile: TrainerProfile) => void }) {
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [phone, setPhone] = useState(profile.phone)
  const [bio, setBio] = useState(profile.bio)
  const [publicSlug, setPublicSlug] = useState(profile.publicSlug ?? 'alex')
  const [publicEnabled, setPublicEnabled] = useState(profile.publicEnabled ?? true)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !email.trim()) return
    onSave({ name: name.trim(), email: email.trim(), phone: phone.trim(), bio: bio.trim(), publicSlug: publicSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'pt', publicEnabled, timezone: profile.timezone ?? 'Asia/Ho_Chi_Minh' })
  }
  return <ModalFrame title="Chỉnh sửa profile" eyebrow="Your identity" onClose={onClose}><form onSubmit={submit}><label>Họ và tên<input autoFocus value={name} onChange={(event) => setName(event.target.value)} required /></label><div className="form-grid"><label>Email đăng nhập<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Số điện thoại<input value={phone} onChange={(event) => setPhone(event.target.value)} /></label></div><label>Mô tả ngắn<input value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Strength & conditioning" /></label><div className="form-grid"><label>Link lịch công khai<input value={publicSlug} onChange={(event) => setPublicSlug(event.target.value)} placeholder="alex" /><span className="field-hint">/pt/{publicSlug || 'ten-pt'}</span></label><label className="checkbox-field"><input type="checkbox" checked={publicEnabled} onChange={(event) => setPublicEnabled(event.target.checked)} />Hiển thị lịch công khai<span className="field-hint">Người xem không cần đăng nhập</span></label></div><p className="form-help">Mật khẩu demo hiện tại: <strong>123456</strong></p><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Hủy</button><button type="submit" className="primary-button"><Save size={16} /> Lưu profile</button></div></form></ModalFrame>
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state"><CircleHelp size={20} /><span>{text}</span></div>
}

function App() {
  const publicMatch = window.location.pathname.match(/^\/pt\/([^/]+)/)
  if (publicMatch) return <PublicTrainerPage slug={decodeURIComponent(publicMatch[1])} />
  return <PTApp />
}

export default App
