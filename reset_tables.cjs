const { createClient } = require('@supabase/supabase-js')
const sb = createClient('https://ycwiplojbsbjybmvvuqi.supabase.co', 'sb_publishable_TM5Btk4LE0w_8A_dJNYfbw_NPgWmBeK')

async function reset() {
  // Drop all existing tables
  const tables = ['meal_plan_items', 'meal_plans', 'workout_plan_exercises', 'workout_plans', 'schedule_slots', 'metrics', 'exercises', 'clients', 'pt_public_profiles', 'profiles', 'app_states']
  
  for (const table of tables) {
    const { error } = await sb.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) console.log(`Delete ${table}: ${error.message}`)
    else console.log(`Cleared ${table}`)
  }
}

reset()
