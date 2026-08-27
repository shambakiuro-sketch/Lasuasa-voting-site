import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ════════════════════════════════════════════════════════════════
// VOTER FUNCTIONS
// ════════════════════════════════════════════════════════════════

export async function getVoters() {
  const { data, error } = await supabase
    .from('voters')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function getCandidates() {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function getVotes() {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function checkVoter(matricNo: string) {
  const { data, error } = await supabase
    .from('voters')
    .select('id,matric_no,name,has_voted')
    .eq('matric_no', matricNo)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

export async function submitVote(voterId: string, votes: any[]) {
  const { data, error } = await supabase
    .from('votes')
    .insert(votes)
  
  if (error) throw error
  
  // Mark voter as voted
  const { error: updateError } = await supabase
    .from('voters')
    .update({ has_voted: true })
    .eq('id', voterId)
  
  if (updateError) throw updateError
  
  return data
}

// ════════════════════════════════════════════════════════════════
// ADMIN AUTHENTICATION FUNCTIONS
// ════════════════════════════════════════════════════════════════

export interface Admin {
  id: string
  role: string
  created_at: string
  updated_at: string
}

// Get all admin roles
export async function getAdminRoles() {
  const { data, error } = await supabase
    .from('admins')
    .select('id, role, created_at, updated_at')
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data as Admin[]
}

// Verify admin login (role + password)
export async function verifyAdminLogin(role: string, password: string) {
  try {
    const { data, error } = await supabase
      .rpc('verify_admin_password', {
        p_role: role,
        p_password: password
      })
    
    if (error) throw error
    
    if (data && data.length > 0 && data[0].is_valid) {
      return {
        success: true,
        admin: {
          id: data[0].id,
          role: data[0].role
        }
      }
    }
    
    return {
      success: false,
      error: 'Invalid password'
    }
  } catch (error) {
    throw error
  }
}

// Update admin password
export async function updateAdminPassword(role: string, newPassword: string) {
  try {
    const { data, error } = await supabase
      .rpc('update_admin_password', {
        p_role: role,
        p_new_password: newPassword
      })
    
    if (error) throw error
    
    if (data) {
      return {
        success: true,
        message: 'Password updated successfully'
      }
    }
    
    return {
      success: false,
      error: 'Failed to update password'
    }
  } catch (error) {
    throw error
  }
}

// Direct password update (for admin management)
export async function setAdminPassword(role: string, newPassword: string) {
  const { data, error } = await supabase
    .from('admins')
    .update({ password: newPassword, updated_at: new Date().toISOString() })
    .eq('role', role)
  
  if (error) throw error
  return data
}

// Get admin by role
export async function getAdminByRole(role: string) {
  const { data, error } = await supabase
    .from('admins')
    .select('id, role, created_at, updated_at')
    .eq('role', role)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  
  return data as Admin
}

// ════════════════════════════════════════════════════════════════
// ADMIN MANAGEMENT FUNCTIONS
// ════════════════════════════════════════════════════════════════

export async function deleteVoter(id: string) {
  const { error } = await supabase
    .from('voters')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

export async function resetVoterVote(id: string) {
  const { error } = await supabase
    .from('voters')
    .update({ has_voted: false })
    .eq('id', id)
  
  if (error) throw error
}

export async function deletePost(id: string) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

export async function deleteCandidate(id: string) {
  const { error } = await supabase
    .from('candidates')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Get voting results
export async function getVotingResults() {
  const votes = await getVotes()
  const posts = await getPosts()
  const candidates = await getCandidates()
  
  const results = posts.map(post => {
    const postVotes = votes.filter(v => v.post_id === post.id)
    const postCandidates = candidates.filter(c => c.post_id === post.id)
    
    return {
      post_id: post.id,
      post_title: post.title,
      total_votes: postVotes.length,
      candidates: postCandidates.map(candidate => ({
        id: candidate.id,
        name: candidate.name,
        votes: postVotes.filter(v => v.candidate_id === candidate.id).length
      }))
    }
  })
  
  return results
}
