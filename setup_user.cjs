const { createClient } = require('@supabase/supabase-js')
const sb = createClient('https://ycwiplojbsbjybmvvuqi.supabase.co', 'sb_publishable_TM5Btk4LE0w_8A_dJNYfbw_NPgWmBeK')

async function setup() {
  // 1. Sign up the user
  const { data: authData, error: authError } = await sb.auth.signUp({
    email: 'dandan@gmail.com',
    password: '123456'
  })
  
  if (authError) {
    console.log('Auth error:', authError.message)
    return
  }
  
  console.log('Auth user created:', authData.user?.id)
  const userId = authData.user?.id
  
  if (!userId) {
    console.log('No user ID returned')
    return
  }

  // 2. Create profile with role 'pt'
  const { error: profileError } = await sb.from('profiles').insert({
    id: userId,
    role: 'pt',
    full_name: 'PT User',
    email: 'dandan@gmail.com',
    phone: '',
    bio: 'Personal Trainer',
    timezone: 'Asia/Ho_Chi_Minh',
    must_change_password: false
  })
  
  if (profileError) {
    console.log('Profile error:', profileError.message)
    // Try update if insert fails
    const { error: updateError } = await sb.from('profiles').upsert({
      id: userId,
      role: 'pt',
      full_name: 'PT User',
      email: 'dandan@gmail.com',
      phone: '',
      bio: 'Personal Trainer',
      timezone: 'Asia/Ho_Chi_Minh',
      must_change_password: false
    })
    if (updateError) console.log('Upsert error:', updateError.message)
    else console.log('Profile upserted successfully')
  } else {
    console.log('Profile created successfully')
  }

  // 3. Create public profile
  const { error: publicError } = await sb.from('pt_public_profiles').upsert({
    pt_id: userId,
    slug: 'pt-user',
    display_name: 'PT User',
    bio: 'Personal Trainer',
    timezone: 'Asia/Ho_Chi_Minh',
    enabled: false
  })
  
  if (publicError) console.log('Public profile error:', publicError.message)
  else console.log('Public profile created successfully')

  // 4. Verify
  const { data: profile } = await sb.from('profiles').select('*').eq('id', userId).single()
  console.log('Final profile:', JSON.stringify(profile, null, 2))
}

setup()
