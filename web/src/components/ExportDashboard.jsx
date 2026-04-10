import { useState, useEffect } from 'react'

function ExportDashboard({ username, onSignOut }) {
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(null)

  const token = localStorage.getItem('token')

  const fetchDatasets = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/datasets', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to load datasets.')
        return
      }
      const data = await res.json()
      setDatasets(data)
    } catch {
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatasets()
  }, [])

  const handleExport = async (datasetId, datasetName) => {
    setExporting(datasetId)
    try {
      const res = await fetch(`/api/export/${datasetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Export failed.')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${datasetName || 'dataset'}_${datasetId}.csv`.replace(/\s+/g, '_')
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      alert('Could not connect to server.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Export Panel</h1>
            <p className="text-sm text-zinc-400">Signed in as {username}</p>
          </div>
          <button
            onClick={onSignOut}
            className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {loading ? (
          <p className="text-sm text-zinc-400">Loading datasets...</p>
        ) : datasets.length === 0 ? (
          <p className="text-sm text-zinc-400">No datasets found. Create one from the mobile app.</p>
        ) : (
          <div className="space-y-4">
            {datasets.map((ds) => (
              <div
                key={ds.dataset_id}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-white">{ds.name}</h2>
                    <p className="text-sm text-zinc-400">Search: {ds.search_term}</p>
                  </div>
                  <button
                    onClick={() => handleExport(ds.dataset_id, ds.name)}
                    disabled={exporting === ds.dataset_id || Number(ds.approved_count) === 0}
                    className="rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {exporting === ds.dataset_id ? 'Exporting...' : 'Export CSV'}
                  </button>
                </div>

                <div className="flex gap-4 text-sm">
                  <span className="text-zinc-400">
                    Total: <span className="text-white">{ds.total_count}</span>
                  </span>
                  <span className="text-zinc-400">
                    Approved: <span className="text-green-400">{ds.approved_count}</span>
                  </span>
                  <span className="text-zinc-400">
                    Rejected: <span className="text-red-400">{ds.rejected_count}</span>
                  </span>
                  <span className="text-zinc-400">
                    Pending: <span className="text-yellow-400">{ds.pending_count}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ExportDashboard
