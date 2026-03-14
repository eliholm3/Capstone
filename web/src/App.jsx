import { useState } from 'react'
import AuthForm from './components/AuthForm'

function App() {
  const [user, setUser] = useState(null)

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-semibold text-white">
            Hello, {user.username}
          </h1>
          <button
            onClick={() => {
              localStorage.removeItem('token')
              setUser(null)
            }}
            className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return <AuthForm onAuth={setUser} />
}

export default App
