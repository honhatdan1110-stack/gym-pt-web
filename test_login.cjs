const { createClient } = require('@supabase/supabase-js')
const sb = createClient('https://ycwiplojbsbjybmvvuqi.supabase.co', 'sb_publishable_TM5Btk4LE0w_8A_dJNYfbw_NPgWmBeK')

async function test() {
  // Sign in
  const { data: authData, error: authError } = await sb.auth.signInWithPassword({
    email: 'dandan@gmail.com',
    password: '123456'
  })
  
  if (authError) {
    console.log('Login error:', authError.message)
    return
  }
  
  console.log('Logged in as:', authData.user.id)
  
  // Check profile
  const { data: profile, error } = await sb.from('profiles').select('*').eq('id', authData.user.id).maybeSingle()
  
  if (error) {
    console.log('Profile error:', error.message)
  } else {
    console.log('Profile:', JSON.stringify(profile, null, 2))
  }
  
  // Check public profile
  const { data: publicProfile, error: ppError } = await sb.from('pt_public_profiles').select('*').eq('pt_id', authData.user.id).maybeSingle()
  
  if (ppError) {
    console.log('Public profile error:', ppError.message)
  } else {
    console.log('Public profile:', JSON.stringify(publicProfile, null, 2))
  }
}

test()
