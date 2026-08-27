'use client'

import { useState, useEffect } from 'react'
import { 
  supabase, 
  getVoters, 
  getPosts, 
  getCandidates, 
  getVotes,
  getAdminRoles,
  verifyAdminLogin,
  updateAdminPassword,
  deleteVoter,
  resetVoterVote,
  deletePost,
  deleteCandidate,
  getVotingResults
} from '@/lib/supabase'
import Link from 'next/link'

type Tab = 'voters' | 'posts' | 'candidates' | 'votes' | 'results' | 'settings'
type LoginStep = 'role-select' | 'password-enter' | 'authenticated'

export default function AdminDashboard() {
  // Login state
  const [loginStep, setLoginStep] = useState<LoginStep>('role-select')
  const [selectedRole, setSelectedRole] = useState('')
  const [password, setPassword] = useState('')
  const [adminRoles, setAdminRoles] = useState<any[]>([])
  
  // Authenticated state
  const [currentAdmin, setCurrentAdmin] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('voters')
  
  // Data state
  const [voters, setVoters] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Password change state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswordChange, setShowPasswordChange] = useState(false)

  // Load admin roles on mount
  useEffect(() => {
    loadAdminRoles()
  }, [])

  async function loadAdminRoles() {
    try {
      const roles = await getAdminRoles()
      setAdminRoles(roles)
    } catch (e: any) {
      setError('Failed to load admin roles')
    }
  }

  async function handleRoleSelect(role: string) {
    setSelectedRole(role)
    setLoginStep('password-enter')
    setPassword('')
    setError('')
  }

  async function handlePasswordLogin() {
    if (!password) {
      setError('Please enter password')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const result = await verifyAdminLogin(selectedRole, password)
      
      if (result.success) {
        setCurrentAdmin({
          id: result.admin.id,
          role: result.admin.role
        })
        setLoginStep('authenticated')
        setPassword('')
        loadAllData()
      } else {
        setError('Invalid password')
        setPassword('')
      }
    } catch (e: any) {
      setError('Login failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadAllData() {
    try {
      setLoading(true)
      const [votersData, postsData, candidatesData, votesData, resultsData] = await Promise.all([
        getVoters(),
        getPosts(),
        getCandidates(),
        getVotes(),
        getVotingResults()
      ])
      
      setVoters(votersData || [])
      setPosts(postsData || [])
      setCandidates(candidatesData || [])
      setVotes(votesData || [])
      setResults(resultsData || [])
    } catch (e: any) {
      setError('Failed to load data: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordChange() {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      await updateAdminPassword(currentAdmin.role, newPassword)
      
      setSuccess('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordChange(false)
    } catch (e: any) {
      setError('Failed to update password: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteVoter(id: string) {
    if (!window.confirm('Are you sure? This cannot be undone.')) return
    try {
      await deleteVoter(id)
      setVoters(voters.filter(v => v.id !== id))
      setSuccess('Voter deleted')
    } catch (e: any) {
      setError('Delete failed: ' + e.message)
    }
  }

  async function handleResetVote(id: string) {
    try {
      await resetVoterVote(id)
      await loadAllData()
      setSuccess('Vote reset')
    } catch (e: any) {
      setError('Reset failed: ' + e.message)
    }
  }

  async function handleDeletePost(id: string) {
    if (!window.confirm('Are you sure? This cannot be undone.')) return
    try {
      await deletePost(id)
      setPosts(posts.filter(p => p.id !== id))
      setSuccess('Post deleted')
    } catch (e: any) {
      setError('Delete failed: ' + e.message)
    }
  }

  // ════════════════════════════════════════════════════════════════
  // LOGIN UI - ROLE SELECTION
  // ════════════════════════════════════════════════════════════════

  if (loginStep === 'role-select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#061406] to-[#0a1f0f] p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-900/40 border border-green-800/30 rounded-xl p-8">
            <h1 className="text-3xl font-bold text-green-400 mb-2 text-center">Admin Portal</h1>
            <p className="text-gray-400 text-center mb-8">Select your role to login</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {adminRoles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.role)}
                  className="p-6 bg-slate-800/50 border border-green-700/30 rounded-lg hover:border-green-500 hover:bg-slate-800 transition text-left"
                >
                  <h3 className="text-green-300 font-semibold text-lg">{role.role}</h3>
                  <p className="text-gray-400 text-sm mt-1">Click to login</p>
                </button>
              ))}
            </div>

            <div className="text-center">
              <Link href="/" className="text-green-500 hover:text-green-400 text-sm underline">
                Back to Voter Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════
  // LOGIN UI - PASSWORD ENTRY
  // ════════════════════════════════════════════════════════════════

  if (loginStep === 'password-enter') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#061406] to-[#0a1f0f] p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-slate-900/40 border border-green-800/30 rounded-xl p-8">
            <h1 className="text-2xl font-bold text-green-400 mb-6 text-center">
              {selectedRole}
            </h1>
            
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordLogin()}
                disabled={loading}
                className="w-full px-4 py-3 bg-slate-800 border border-green-700/30 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
              />
              
              {error && <div className="text-red-400 text-sm">{error}</div>}
              
              <button
                onClick={handlePasswordLogin}
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50"
              >
                {loading ? '⟳ Login...' : 'Login'}
              </button>

              <button
                onClick={() => {
                  setLoginStep('role-select')
                  setSelectedRole('')
                  setPassword('')
                  setError('')
                }}
                className="w-full px-6 py-3 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════
  // AUTHENTICATED DASHBOARD
  // ════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#061406] to-[#0a1f0f] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-400">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Logged in as: <span className="text-green-300 font-semibold">{currentAdmin?.role}</span></p>
          </div>
          <button
            onClick={() => {
              setLoginStep('role-select')
              setCurrentAdmin(null)
              setTab('voters')
            }}
            className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-900/30 border border-red-600 text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900/30 border border-green-600 text-green-300 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700 overflow-x-auto">
          {['voters', 'posts', 'candidates', 'votes', 'results', 'settings'].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t as Tab)
                setError('')
                setSuccess('')
              }}
              className={`px-4 py-3 font-semibold capitalize transition border-b-2 ${
                tab === t
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Voters Tab */}
        {tab === 'voters' && (
          <div className="bg-slate-900/40 border border-green-800/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-green-300 mb-4">Voters Management</h2>
            <p className="text-gray-400 text-sm mb-4">Total: {voters.length}</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-green-800/30">
                  <tr>
                    <th className="text-left py-3 px-4 text-green-400">Matric No.</th>
                    <th className="text-left py-3 px-4 text-green-400">Name</th>
                    <th className="text-left py-3 px-4 text-green-400">Voted</th>
                    <th className="text-left py-3 px-4 text-green-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {voters.map((voter) => (
                    <tr key={voter.id} className="border-b border-gray-700/30 hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-gray-300">{voter.matric_no}</td>
                      <td className="py-3 px-4 text-gray-300">{voter.name}</td>
                      <td className="py-3 px-4">
                        <span className={voter.has_voted ? 'text-green-400' : 'text-gray-500'}>
                          {voter.has_voted ? '✓ Yes' : 'No'}
                        </span>
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        {voter.has_voted && (
                          <button
                            onClick={() => handleResetVote(voter.id)}
                            className="px-3 py-1 bg-yellow-700 text-white text-xs rounded hover:bg-yellow-600"
                          >
                            Reset
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteVoter(voter.id)}
                          className="px-3 py-1 bg-red-700 text-white text-xs rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {tab === 'posts' && (
          <div className="bg-slate-900/40 border border-green-800/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-green-300 mb-4">Posts Management</h2>
            <p className="text-gray-400 text-sm mb-4">Total: {posts.length}</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-green-800/30">
                  <tr>
                    <th className="text-left py-3 px-4 text-green-400">Title</th>
                    <th className="text-left py-3 px-4 text-green-400">Created</th>
                    <th className="text-left py-3 px-4 text-green-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="border-b border-gray-700/30 hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-gray-300">{post.title}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs">
                        {new Date(post.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="px-3 py-1 bg-red-700 text-white text-xs rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Candidates Tab */}
        {tab === 'candidates' && (
          <div className="bg-slate-900/40 border border-green-800/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-green-300 mb-4">Candidates</h2>
            <p className="text-gray-400 text-sm mb-4">Total: {candidates.length}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidates.map((candidate) => (
                <div key={candidate.id} className="bg-slate-800/50 border border-green-800/30 rounded-lg p-4">
                  <h3 className="text-green-300 font-semibold mb-2">{candidate.name}</h3>
                  <p className="text-gray-400 text-sm">Position ID: {candidate.post_id?.slice(0, 8)}...</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Votes Tab */}
        {tab === 'votes' && (
          <div className="bg-slate-900/40 border border-green-800/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-green-300 mb-4">Votes Audit Trail</h2>
            <p className="text-gray-400 text-sm mb-4">Total: {votes.length}</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-green-800/30">
                  <tr>
                    <th className="text-left py-3 px-4 text-green-400">Timestamp</th>
                    <th className="text-left py-3 px-4 text-green-400">Voter ID</th>
                    <th className="text-left py-3 px-4 text-green-400">Post ID</th>
                    <th className="text-left py-3 px-4 text-green-400">Candidate ID</th>
                  </tr>
                </thead>
                <tbody>
                  {votes.slice(0, 50).map((vote) => (
                    <tr key={vote.id} className="border-b border-gray-700/30">
                      <td className="py-3 px-4 text-gray-400 text-xs">
                        {new Date(vote.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-xs font-mono">{vote.voter_id.slice(0, 8)}...</td>
                      <td className="py-3 px-4 text-gray-300 text-xs font-mono">{vote.post_id.slice(0, 8)}...</td>
                      <td className="py-3 px-4 text-gray-300 text-xs font-mono">{vote.candidate_id.slice(0, 8)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {tab === 'results' && (
          <div className="bg-slate-900/40 border border-green-800/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-green-300 mb-4">Live Results</h2>
            
            <div className="space-y-6">
              <div className="bg-slate-800/50 border border-green-800/30 rounded-lg p-4">
                <p className="text-green-300 text-lg font-semibold">Total Votes: <span className="text-white">{votes.length}</span></p>
                <p className="text-green-300 text-lg font-semibold mt-2">Total Voters: <span className="text-white">{voters.length}</span></p>
                <p className="text-green-300 text-lg font-semibold mt-2">
                  Turnout: <span className="text-white">{voters.length > 0 ? ((votes.length / voters.length) * 100).toFixed(1) : 0}%</span>
                </p>
              </div>

              {results.map((result) => (
                <div key={result.post_id} className="bg-slate-800/50 border border-green-800/30 rounded-lg p-4">
                  <h3 className="text-green-300 font-semibold mb-3">{result.post_title}</h3>
                  <p className="text-gray-400 text-sm mb-3">Total votes for this position: {result.total_votes}</p>
                  <div className="space-y-2">
                    {result.candidates.map((candidate: any) => (
                      <div key={candidate.id} className="flex justify-between items-center bg-slate-700/30 p-2 rounded">
                        <span className="text-gray-300">{candidate.name}</span>
                        <span className="text-green-400 font-semibold">{candidate.votes} votes</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div className="bg-slate-900/40 border border-green-800/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-green-300 mb-6">Settings</h2>
            
            <div className="max-w-md">
              {!showPasswordChange ? (
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-lg hover:shadow-lg transition font-semibold w-full"
                >
                  Change Password
                </button>
              ) : (
                <div className="space-y-4 bg-slate-800/50 border border-green-800/30 rounded-lg p-6">
                  <h3 className="text-green-300 font-semibold mb-4">Change Your Password</h3>
                  
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-green-700/30 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
                  />
                  
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-green-700/30 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none"
                  />
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handlePasswordChange}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                    >
                      {loading ? '⟳ Updating...' : 'Update'}
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordChange(false)
                        setNewPassword('')
                        setConfirmPassword('')
                        setError('')
                      }}
                      className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
