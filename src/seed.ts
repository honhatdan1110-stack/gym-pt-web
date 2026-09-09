import type { AppState } from './types'

export const seedState: AppState = {
  profile: { name: 'Alex Trần', email: 'alex@liftlog.local', phone: '090 888 6868', bio: 'Personal Trainer · Strength & conditioning', publicSlug: 'alex', publicEnabled: true, timezone: 'Asia/Ho_Chi_Minh' },
  clients: [
    { id: 'c1', name: 'Minh Anh', email: 'minhanh@gmail.com', phone: '090 123 4567', goal: 'Tăng cơ', status: 'active', avatar: 'MA', color: '#f97316', joinedAt: '2024-02-12', weight: 58.4, weightStart: 55.2, sessionsThisMonth: 12, progress: 78, nextSession: 'Hôm nay, 08:00', note: 'Ưu tiên kỹ thuật squat và ngủ đủ giấc.' },
    { id: 'c2', name: 'Quang Huy', email: 'quanghuy@gmail.com', phone: '091 888 2345', goal: 'Giảm mỡ', status: 'active', avatar: 'QH', color: '#4f46e5', joinedAt: '2024-03-08', weight: 74.8, weightStart: 79.3, sessionsThisMonth: 9, progress: 64, nextSession: 'Hôm nay, 10:30', note: 'Theo dõi calories cuối tuần.' },
    { id: 'c3', name: 'Thuỳ Dương', email: 'duong.tran@gmail.com', phone: '098 333 1212', goal: 'Cải thiện sức bền', status: 'active', avatar: 'TD', color: '#0f766e', joinedAt: '2024-04-20', weight: 52.1, weightStart: 53.8, sessionsThisMonth: 8, progress: 52, nextSession: 'Ngày mai, 17:30', note: 'Bổ sung cardio zone 2.' },
    { id: 'c4', name: 'Đức Long', email: 'duclong@gmail.com', phone: '093 555 8899', goal: 'Tăng cơ', status: 'paused', avatar: 'ĐL', color: '#db2777', joinedAt: '2024-01-17', weight: 81.2, weightStart: 78.6, sessionsThisMonth: 3, progress: 38, nextSession: 'Tạm dừng', note: 'Tạm nghỉ do công tác đến 12/09.' },
    { id: 'c5', name: 'Bảo Ngọc', email: 'baongoc@gmail.com', phone: '097 224 6789', goal: 'Giảm mỡ', status: 'lead', avatar: 'BN', color: '#ca8a04', joinedAt: '2024-08-28', weight: 63.5, weightStart: 63.5, sessionsThisMonth: 0, progress: 0, nextSession: 'Chưa lên lịch', note: 'Đã đăng ký tư vấn đầu vào.' },
  ],
  sessions: [
    { id: 's1', clientId: 'c1', time: '08:00', date: '2024-09-01', duration: 60, type: 'Lower body strength', status: 'upcoming', accent: '#f97316' },
    { id: 's2', clientId: 'c2', time: '10:30', date: '2024-09-01', duration: 60, type: 'Full body · Fat loss', status: 'upcoming', accent: '#4f46e5' },
    { id: 's3', clientId: 'c3', time: '17:30', date: '2024-09-02', duration: 45, type: 'Conditioning', status: 'upcoming', accent: '#0f766e' },
    { id: 's4', clientId: 'c1', time: '08:00', date: '2024-08-30', duration: 60, type: 'Upper body hypertrophy', status: 'completed', accent: '#f97316' },
    { id: 's5', clientId: 'c2', time: '18:00', date: '2024-08-30', duration: 60, type: 'Cardio & core', status: 'completed', accent: '#4f46e5' },
  ],
  exercises: [
    { id: 'e1', name: 'Barbell Back Squat', muscle: 'Quads · Glutes', equipment: 'Barbell', level: 'Intermediate', sets: 4, reps: '8–10' },
    { id: 'e2', name: 'Romanian Deadlift', muscle: 'Hamstrings · Glutes', equipment: 'Barbell', level: 'Intermediate', sets: 3, reps: '10–12' },
    { id: 'e3', name: 'Dumbbell Bench Press', muscle: 'Chest · Triceps', equipment: 'Dumbbells', level: 'Beginner', sets: 4, reps: '8–12' },
    { id: 'e4', name: 'Cable Lat Pulldown', muscle: 'Back · Biceps', equipment: 'Cable', level: 'Beginner', sets: 3, reps: '10–12' },
    { id: 'e5', name: 'Bulgarian Split Squat', muscle: 'Quads · Glutes', equipment: 'Dumbbells', level: 'Advanced', sets: 3, reps: '8 / side' },
    { id: 'e6', name: 'Pallof Press', muscle: 'Core · Stability', equipment: 'Cable', level: 'Beginner', sets: 3, reps: '12 / side' },
  ],
  workoutPlans: [
    { id: 'w1', clientId: 'c1', name: 'Lean muscle · Phase 02', goal: 'Tăng cơ', frequency: 4, durationWeeks: 8, exerciseIds: ['e1', 'e2', 'e3', 'e4'], status: 'active', updatedAt: '2024-08-29' },
    { id: 'w2', clientId: 'c2', name: 'Reset & burn', goal: 'Giảm mỡ', frequency: 3, durationWeeks: 6, exerciseIds: ['e3', 'e4', 'e6'], status: 'active', updatedAt: '2024-08-27' },
    { id: 'w3', clientId: 'c3', name: 'Build endurance', goal: 'Cải thiện sức bền', frequency: 3, durationWeeks: 4, exerciseIds: ['e5', 'e6'], status: 'draft', updatedAt: '2024-08-25' },
  ],
  mealPlans: [
    { id: 'm1', clientId: 'c1', calories: 2180, protein: 142, carbs: 248, fat: 68, status: 'on-track', meals: 4, items: ['Yến mạch + whey', 'Cơm gạo lứt + ức gà', 'Sữa chua Hy Lạp', 'Cá hồi + khoai tây'] },
    { id: 'm2', clientId: 'c2', calories: 1840, protein: 156, carbs: 170, fat: 56, status: 'needs-review', meals: 4, items: ['Trứng + bánh mì nguyên cám', 'Bún bò nạc', 'Táo + protein shake', 'Thịt bò + rau xanh'] },
    { id: 'm3', clientId: 'c3', calories: 1960, protein: 118, carbs: 228, fat: 61, status: 'on-track', meals: 5, items: ['Overnight oats', 'Cơm + cá basa', 'Chuối + hạt', 'Mì soba + tôm', 'Sữa chua'] },
  ],
  metrics: [
    { id: 'mt1', clientId: 'c1', date: '2024-08-30', weight: 58.4, bodyFat: 22.8, waist: 68, note: 'Năng lượng tốt.' },
    { id: 'mt2', clientId: 'c1', date: '2024-08-16', weight: 57.4, bodyFat: 23.5, waist: 69, note: '' },
    { id: 'mt3', clientId: 'c2', date: '2024-08-30', weight: 74.8, bodyFat: 19.2, waist: 84, note: 'Tuân thủ meal plan tốt hơn.' },
    { id: 'mt4', clientId: 'c3', date: '2024-08-29', weight: 52.1, bodyFat: 25.1, waist: 67, note: '' },
  ],
}
