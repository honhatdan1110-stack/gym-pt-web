import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Copy, Dumbbell, LogOut, Mail, Pencil, Trash2, Utensils, Users, X } from 'lucide-react'
import { issueMemberAccount, loadMemberPortal, loadPublicSchedule } from './db'
import { supabase } from './supabase'
import type { Client, MemberPortalData, PublicScheduleSlot, PublicTrainerProfile, Session } from './types'

type TimelineMode = 'pt' | 'member' | 'public'

const DAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const START_HOUR = 6
const END_HOUR = 22
const HOUR_HEIGHT = 64

function localParts(value: string) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(value))
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour') === '24' ? '00' : get('hour')}:${get('minute')}` }
}

function dateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

function mondayOf(value: Date) {
  const date = new Date(value)
  const offset = (date.getDay() + 6) % 7
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - offset)
  return date
}

function isoDateTime(date: Date, end = false) {
  const value = new Date(date)
  value.setDate(value.getDate() + (end ? 7 : 0))
  return new Date(`${dateKey(value)}T00:00:00+07:00`)
}

function timeMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function formatDate(value: Date, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', ...options }).format(value)
}

interface TimelineEvent {
  id: string
  day: string
  time: string
  endTime: string
  title: string
  subtitle: string
  color: string
  status: string
  publicLabel?: string
}

function sessionEvent(session: Session, mode: TimelineMode, client?: Client): TimelineEvent {
  const startsAt = session.startsAt ?? `${session.date}T${session.time}:00+07:00`
  const endsAt = session.endsAt ?? new Date(new Date(startsAt).getTime() + session.duration * 60000).toISOString()
  const start = localParts(startsAt)
  const end = localParts(endsAt)
  return {
    id: session.id, day: start.date, time: start.time, endTime: end.time,
    title: mode === 'public' ? session.publicLabel ?? 'Đã có lịch' : client?.name ?? 'Member',
    subtitle: mode === 'public' ? (session.publicStatus === 'available' ? 'Còn lịch' : 'Đã kín') : session.type,
    color: session.accent, status: mode === 'public' ? session.publicStatus ?? 'booked' : session.status, publicLabel: session.publicLabel,
  }
}

function publicEvent(slot: PublicScheduleSlot): TimelineEvent {
  const start = localParts(slot.startsAt)
  const end = localParts(slot.endsAt)
  return { id: slot.id, day: start.date, time: start.time, endTime: end.time, title: slot.publicLabel, subtitle: slot.publicStatus === 'available' ? 'Còn lịch' : 'Đã kín', color: slot.publicStatus === 'available' ? '#0f9f72' : '#6656d9', status: slot.publicStatus }
}

export function WeeklyTimeline({ weekStart, events, mode, onEventClick }: { weekStart: Date; events: TimelineEvent[]; mode: TimelineMode; onEventClick?: (event: TimelineEvent) => void }) {
  const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(weekStart); date.setDate(date.getDate() + index); return date })
  const hourRows = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index)
  const dayIndex = new Map(days.map((day, index) => [dateKey(day), index]))
  return <div className={`timeline-shell timeline-${mode}`}>
    <div className="timeline-head"><div className="timeline-time-spacer" />{days.map((day, index) => <div className="timeline-day-head" key={dateKey(day)}><span>{DAY_NAMES[index]}</span><strong>{formatDate(day, { day: '2-digit', month: '2-digit' })}</strong>{index === 0 && <i />}</div>)}</div>
    <div className="timeline-body"><div className="timeline-hours">{hourRows.map((hour) => <span key={hour}>{String(hour).padStart(2, '0')}:00</span>)}</div><div className="timeline-grid">{days.map((day) => <div className="timeline-day-column" key={dateKey(day)}>{hourRows.map((hour) => <i key={hour} />)}</div>)}{events.map((event) => {
      const index = dayIndex.get(event.day)
      if (index === undefined) return null
      const start = Math.max(START_HOUR * 60, timeMinutes(event.time))
      let end = timeMinutes(event.endTime)
      if (end <= timeMinutes(event.time)) end = timeMinutes(event.time) + 60
      const top = ((start - START_HOUR * 60) / 60) * HOUR_HEIGHT
      const height = Math.max(42, ((end - start) / 60) * HOUR_HEIGHT - 5)
      return <button type="button" className={`timeline-event event-${event.status}`} key={event.id} onClick={() => onEventClick?.(event)} style={{ left: `calc(${index * (100 / 7)}% + 5px)`, width: `calc(${100 / 7}% - 10px)`, top, height, borderLeftColor: event.color }}><strong>{event.time}<span>–{event.endTime}</span></strong><b>{event.title}</b><small>{event.subtitle}</small></button>
    })}</div></div>
  </div>
}

function weekLabel(start: Date) {
  const end = new Date(start); end.setDate(end.getDate() + 6)
  return `${formatDate(start, { day: '2-digit', month: 'short' })} – ${formatDate(end, { day: '2-digit', month: 'short', year: 'numeric' })}`
}

export function TimelineScheduleView({ sessions, clients, onAdd, onEdit, onDelete, onComplete }: { sessions: Session[]; clients: Client[]; onAdd: () => void; onEdit: (session: Session) => void; onDelete: (id: string) => void; onComplete: (id: string) => void }) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()))
  const [picked, setPicked] = useState<TimelineEvent | null>(null)
  const visible = useMemo(() => { const end = new Date(weekStart); end.setDate(end.getDate() + 7); return sessions.filter((session) => { const date = session.startsAt ? localParts(session.startsAt).date : session.date; return date >= dateKey(weekStart) && date < dateKey(end) }).map((session) => sessionEvent(session, 'pt', clients.find((client) => client.id === session.clientId))) }, [sessions, clients, weekStart])
  const pickedSession = picked ? sessions.find((s) => s.id === picked.id) : null
  const pickedClient = pickedSession ? clients.find((c) => c.id === pickedSession.clientId) : null
  return <div className="view-stack"><div className="timeline-toolbar"><div><span className="eyebrow">Shared calendar</span><h2>{weekLabel(weekStart)}</h2><p>Lịch này được đồng bộ với member portal và public page.</p></div><div className="timeline-actions"><button className="icon-button" onClick={() => { const next = new Date(weekStart); next.setDate(next.getDate() - 7); setWeekStart(next) }} aria-label="Tuần trước"><ChevronLeft size={18} /></button><button className="secondary-button" onClick={() => setWeekStart(mondayOf(new Date()))}>Hôm nay</button><button className="icon-button" onClick={() => { const next = new Date(weekStart); next.setDate(next.getDate() + 7); setWeekStart(next) }} aria-label="Tuần sau"><ChevronRight size={18} /></button><button className="primary-button" onClick={onAdd}><CalendarDays size={16} /> Thêm buổi</button></div></div><section className="panel timeline-panel"><WeeklyTimeline weekStart={weekStart} events={visible} mode="pt" onEventClick={setPicked} /></section><section className="panel timeline-agenda"><div className="panel-heading"><div><h3>Danh sách tuần</h3><p>{visible.length} buổi trong tuần này</p></div></div>{visible.length ? visible.sort((a, b) => `${a.day}${a.time}`.localeCompare(`${b.day}${b.time}`)).map((event) => <div className="timeline-agenda-row" key={event.id}><Clock3 size={16} /><strong>{event.time}</strong><span>{event.title}</span><small>{event.day} · {event.subtitle}</small><div className="row-actions"><button className="more-button" onClick={() => onComplete(event.id)} aria-label="Hoàn thành"><Check size={15} /></button><button className="more-button" onClick={() => { const session = sessions.find((item) => item.id === event.id); if (session) onEdit(session) }} aria-label="Sửa lịch">Sửa</button><button className="more-button danger-button" onClick={() => onDelete(event.id)} aria-label="Xóa lịch"><X size={15} /></button></div></div>) : <div className="empty-state"><CalendarDays size={20} /><span>Chưa có buổi tập trong tuần này</span></div>}</section>
  {picked && pickedSession && <div className="modal-backdrop" onMouseDown={(e) => { if (e.currentTarget === e.target) setPicked(null) }}><div className="modal session-detail-modal"><div className="modal-header"><div><span className="eyebrow">Chi tiết buổi tập</span><h2>{pickedClient?.name ?? 'Member'}</h2></div><button className="icon-button" onClick={() => setPicked(null)} aria-label="Đóng"><X size={19} /></button></div><div className="session-detail-body"><div className="session-detail-info"><div className="session-detail-row"><Clock3 size={15} /><span>{picked.time} – {picked.endTime}</span></div><div className="session-detail-row"><CalendarDays size={15} /><span>{picked.day}</span></div><div className="session-detail-row"><Dumbbell size={15} /><span>{pickedSession.type}</span></div><div className="session-detail-row"><span className={`status-pill status-${picked.status}`}>{picked.status === 'completed' ? 'Hoàn thành' : picked.status === 'missed' ? 'Bỏ lỡ' : 'Sắp tới'}</span></div></div><div className="session-detail-actions"><button className="primary-button" onClick={() => { onEdit(pickedSession); setPicked(null) }}><Pencil size={15} /> Chỉnh sửa</button><button className="secondary-button" onClick={() => { onComplete(picked.id); setPicked(null) }}><Check size={15} /> Hoàn thành</button><button className="danger-button" onClick={() => { if (window.confirm('Xóa buổi tập này?')) { onDelete(picked.id); setPicked(null) } }}><Trash2 size={15} /> Xóa</button></div></div></div></div>}</div>
}

export function MemberPortal({ onLogout }: { onLogout: () => Promise<void> }) {
  const [data, setData] = useState<MemberPortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()))
  const refresh = () => { setLoading(true); loadMemberPortal().then(setData).catch((reason) => setError(reason instanceof Error ? reason.message : 'Không thể tải dữ liệu')).finally(() => setLoading(false)) }
  useEffect(refresh, [])
  useEffect(() => { if (!data?.client.id) return; const channel = supabase.channel(`member-schedule-${data.client.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_slots', filter: `client_id=eq.${data.client.id}` }, refresh).subscribe(); return () => { void supabase.removeChannel(channel) } }, [data?.client.id])
  if (loading && !data) return <div className="portal-loading">Đang tải workspace member...</div>
  if (error && !data) return <div className="portal-loading"><p>{error}</p><button className="primary-button" onClick={refresh}>Thử lại</button></div>
  if (!data) return <div className="portal-loading">Tài khoản chưa được liên kết với hồ sơ member.</div>
  const visibleSessions = data.sessions.map((session) => sessionEvent(session, 'member', data.client)).filter((event) => { const end = new Date(weekStart); end.setDate(end.getDate() + 7); return event.day >= dateKey(weekStart) && event.day < dateKey(end) })
  return <div className="member-shell"><header className="member-topbar"><div className="portal-brand"><span className="brand-mark"><Activity size={18} /></span><span className="brand-name">lift<span>log</span></span></div><div className="member-top-actions"><span>Xin chào, <strong>{data.client.name}</strong></span><button className="outline-button" onClick={onLogout}><LogOut size={15} /> Đăng xuất</button></div></header><main className="member-main"><section className="member-hero"><div><span className="eyebrow">Member space</span><h1>Lịch tập của bạn,<br /><em>rõ ràng từng tuần.</em></h1><p>{data.pt?.displayName ? `Được sắp xếp bởi ${data.pt.displayName}.` : 'Lịch và kế hoạch được PT cập nhật cho bạn.'}</p></div><div className="member-hero-art"><CalendarDays size={54} /><span>Asia / Ho Chi Minh</span></div></section><div className="member-grid"><section className="panel member-calendar-card"><div className="timeline-toolbar"><div><span className="eyebrow">Weekly schedule</span><h2>{weekLabel(weekStart)}</h2></div><div className="timeline-actions"><button className="icon-button" onClick={() => { const next = new Date(weekStart); next.setDate(next.getDate() - 7); setWeekStart(next) }} aria-label="Tuần trước"><ChevronLeft size={18} /></button><button className="icon-button" onClick={() => { const next = new Date(weekStart); next.setDate(next.getDate() + 7); setWeekStart(next) }} aria-label="Tuần sau"><ChevronRight size={18} /></button></div></div><WeeklyTimeline weekStart={weekStart} events={visibleSessions} mode="member" /></section><section className="panel member-meals"><div className="panel-heading"><div><h3>Thực đơn của bạn</h3><p>Meal plan được PT cập nhật</p></div><Utensils size={18} /></div>{data.mealPlans.length ? data.mealPlans.map((meal) => <article className="member-meal" key={meal.id}><div><strong>{meal.calories} kcal</strong><span>{meal.meals} bữa / ngày</span></div><div className="member-macros"><b>{meal.protein}g<small> protein</small></b><b>{meal.carbs}g<small> carbs</small></b><b>{meal.fat}g<small> fat</small></b></div><p>{meal.items.join(' · ')}</p></article>) : <div className="empty-state"><Utensils size={20} /><span>PT chưa thêm thực đơn</span></div>}</section></div><section className="member-info-row"><div className="member-info-card"><Users size={18} /><div><span>PT phụ trách</span><strong>{data.pt?.displayName ?? 'Chưa cập nhật'}</strong></div></div><div className="member-info-card"><CalendarDays size={18} /><div><span>Buổi đã lên lịch</span><strong>{data.sessions.length} buổi</strong></div></div><div className="member-info-card"><Check size={18} /><div><span>Mục tiêu</span><strong>{data.client.goal}</strong></div></div></section></main></div>
}

export function PublicTrainerPage({ slug }: { slug: string }) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()))
  const [profile, setProfile] = useState<PublicTrainerProfile | null>(null)
  const [slots, setSlots] = useState<PublicScheduleSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { setLoading(true); loadPublicSchedule(slug, isoDateTime(weekStart), isoDateTime(weekStart, true)).then((result) => { setProfile(result?.profile ?? null); setSlots(result?.slots ?? []) }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Không thể tải lịch PT')).finally(() => setLoading(false)) }, [slug, weekStart])
  useEffect(() => { if (!profile?.ptId) return; const channel = supabase.channel(`public-schedule-${profile.ptId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_slots', filter: `pt_id=eq.${profile.ptId}` }, () => setWeekStart((current) => new Date(current))).subscribe(); return () => { void supabase.removeChannel(channel) } }, [profile?.ptId])
  if (loading && !profile) return <div className="portal-loading">Đang tải lịch PT...</div>
  if (error && !profile) return <div className="portal-loading"><p>{error}</p></div>
  if (!profile) return <div className="portal-loading"><h1>Không tìm thấy lịch PT</h1><p>Link có thể đã bị tắt hoặc không tồn tại.</p></div>
  const events = slots.map(publicEvent)
  const copyLink = () => { void navigator.clipboard?.writeText(window.location.href) }
  return <div className="public-shell"><header className="public-topbar"><div className="portal-brand"><span className="brand-mark"><Activity size={18} /></span><span className="brand-name">lift<span>log</span></span></div><button className="outline-button" onClick={copyLink}><Copy size={15} /> Sao chép link</button></header><main className="public-main"><section className="public-hero"><div><span className="eyebrow">Public schedule</span><h1>{profile.displayName}</h1><p>{profile.bio || 'Personal trainer · Lịch hỗ trợ theo tuần'}</p><span className="public-note"><Clock3 size={14} /> Múi giờ {profile.timezone}</span></div><div className="public-hero-badge"><CalendarDays size={30} /><strong>Lịch tuần</strong><span>Chọn khung giờ phù hợp với bạn</span></div></section><section className="panel public-calendar"><div className="timeline-toolbar"><div><span className="eyebrow">Availability</span><h2>{weekLabel(weekStart)}</h2><p>Chỉ hiển thị trạng thái khung giờ, không hiển thị thông tin member.</p></div><div className="timeline-actions"><button className="icon-button" onClick={() => { const next = new Date(weekStart); next.setDate(next.getDate() - 7); setWeekStart(next) }} aria-label="Tuần trước"><ChevronLeft size={18} /></button><button className="secondary-button" onClick={() => setWeekStart(mondayOf(new Date()))}>Hôm nay</button><button className="icon-button" onClick={() => { const next = new Date(weekStart); next.setDate(next.getDate() + 7); setWeekStart(next) }} aria-label="Tuần sau"><ChevronRight size={18} /></button></div></div>{loading ? <div className="timeline-loading">Đang cập nhật lịch...</div> : <WeeklyTimeline weekStart={weekStart} events={events} mode="public" />}<div className="public-legend"><span><i className="legend-open" /> Còn lịch</span><span><i className="legend-booked" /> Đã kín</span></div></section><section className="public-cta"><div><span className="eyebrow">Ready when you are</span><h2>Khung giờ nào phù hợp với bạn?</h2><p>Hãy liên hệ trực tiếp với PT để trao đổi mục tiêu và đăng ký buổi đầu tiên.</p></div><ArrowRight size={26} /></section></main></div>
}

export function IssueAccountModal({ client, onClose, onDone }: { client: Client; onClose: () => void; onDone: (message: string) => void }) {
  const [mode, setMode] = useState<'invite' | 'temporary'>('invite')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSubmitting(true); setError(''); try { const result = await issueMemberAccount(client.id, mode, password); onDone(mode === 'invite' ? `Đã gửi lời mời đến ${result.email}` : `Đã tạo account cho ${result.email}`) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể cấp tài khoản') } finally { setSubmitting(false) } }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}><div className="modal account-modal"><div className="modal-header"><div><span className="eyebrow">Member access</span><h2>Cấp account cho {client.name}</h2></div><button className="icon-button" onClick={onClose} aria-label="Đóng"><X size={19} /></button></div><div className="account-recipient"><Mail size={16} /><div><strong>{client.email}</strong><span>Member sẽ đăng nhập bằng email này</span></div></div><form onSubmit={submit}><div className="account-mode-tabs"><button type="button" className={mode === 'invite' ? 'tab-active' : ''} onClick={() => setMode('invite')}>Gửi lời mời</button><button type="button" className={mode === 'temporary' ? 'tab-active' : ''} onClick={() => setMode('temporary')}>Mật khẩu tạm</button></div>{mode === 'invite' ? <p className="form-help">Supabase sẽ gửi email để member tự đặt mật khẩu an toàn.</p> : <label>Mật khẩu tạm<input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tối thiểu 8 ký tự" required /><span className="field-hint">PT gửi mật khẩu này cho member và nên yêu cầu đổi sau lần đăng nhập đầu tiên.</span></label>}{error && <p className="login-error">{error}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Hủy</button><button type="submit" className="primary-button" disabled={submitting}>{mode === 'invite' ? <Mail size={16} /> : <Check size={16} />}{submitting ? 'Đang xử lý...' : mode === 'invite' ? 'Gửi lời mời' : 'Tạo account'}</button></div></form></div></div>
}
