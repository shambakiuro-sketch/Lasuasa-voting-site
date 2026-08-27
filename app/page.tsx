'use client'

import { useState, useEffect } from 'react'
import { supabase, checkVoter, getPosts, submitVote } from '../lib/supabase'
import Link from 'next/link'

export default function VoterPortal() {
  const [view, setView] = useState<'home' | 'vote' | 'success'>('home')
  const [matric, setMatric] = useState('')
  const [voter, setVoter] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [selection, setSelection] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load posts on mount
  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    try {
      setLoading(true)
      const data = await getPosts()
      setPosts(data || [])
    } catch (e: any) {
      setError('Failed to load voting positions')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleVoterLogin() {
    if (!matric.trim()) {
      setError('Please enter your matric number')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const voterData = await checkVoter(matric)
      
      if (!voterData) {
        setError('Voter ID not found')
        return
      }
      
      if (voterData.has_voted) {
        setError('You have already voted')
        return
      }
      
      setVoter(voterData)
      setView('vote')
      setSelection({})
    } catch (e: any) {
      setError('Error checking voter: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitVote() {
    try {
      setLoading(true)
      setError('')
      
      const votes = Object.entries(selection).map(([postId, candidateId]) => ({
        id: crypto.randomUUID(),
        voter_id: voter.id,
        post_id: postId,
        candidate_id: candidateId,
        timestamp: new Date().toISOString(),
      }))
      
      await submitVote(voter.id, votes)
      
      setView('success')
      setVoter(null)
      setSelection({})
    } catch (e: any) {
      setError('Vote submission failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  if (view === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#061406] to-[#0a1f0f] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-6">✓</div>
          <h1 className="text-3xl font-bold text-green-400 mb-4">Vote Submitted Successfully</h1>
          <p className="text-gray-400 mb-8">Your vote has been securely recorded.</p>
          <button
            onClick={() => {
              setView('home')
              setMatric('')
            }}
            className="px-8 py-3 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-lg hover:shadow-lg transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  if (view === 'vote' && voter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#061406] to-[#0a1f0f] p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-green-400">Voting Portal</h2>
            <p className="text-gray-400 text-sm mt-2">Voter: <span className="text-green-300">{voter.name}</span></p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-600 text-red-300 px-6 py-4 rounded-lg mb-6">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="space-y-3 mb-8">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => setSelection(s => ({
                  ...s,
                  [post.id]: selection[post.id] ? null : post.id
                }))}
                className={`p-6 rounded-lg cursor-pointer border-2 transition ${
                  selection[post.id]
                    ? 'bg-green-900/20 border-green-500'
                    : 'bg-slate-900/30 border-gray-700 hover:border-green-500'
                }`}
              >
                <h3 className="text-lg font-semibold text-green-300">{post.title}</h3>
                {selection[post.id] && (
                  <p className="text-xs text-green-400 font-bold mt-2">✓ SELECTED</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-end">
            <button
              onClick={() => setView('home')}
              disabled={loading}
              className="px-6 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitVote}
              disabled={loading}
              className="px-8 py-2 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? '⟳ Submitting...' : 'Submit Ballot →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Home view
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#061406] to-[#0a1f0f] p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-green-400 mb-2">LASUASA Elections 2025/2026</h1>
          <p className="text-gray-400">Secure • Transparent • Efficient</p>
        </div>

        {/* Voter Login Card */}
        <div className="bg-slate-900/40 border border-green-800/30 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-green-300 mb-6">Begin Voting</h2>
          
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="Enter your matric number"
              value={matric}
              onChange={(e) => setMatric(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleVoterLogin()}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-slate-800 border border-green-700/30 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition"
            />
            <button
              onClick={handleVoterLogin}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 font-semibold"
            >
              {loading ? '⟳' : '→'}
            </button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-600 text-red-300 px-4 py-3 rounded-lg mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}

          <p className="text-xs text-gray-500">💡 Your matric number is unique. Voting is secure and anonymous.</p>
        </div>

        {/* Admin Link */}
        <div className="text-center">
          <Link href="/admin" className="text-green-500 hover:text-green-400 text-sm underline">
            Admin Access
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 text-xs mt-12 border-t border-gray-700/30 pt-6">
          <p>LASUASA Election Portal • Secure & Verified</p>
        </div>
      </div>
    </div>
  )
}
