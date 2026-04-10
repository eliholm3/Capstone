import { useState } from 'react'
import AuthForm from './components/AuthForm'
import ExportDashboard from './components/ExportDashboard'

function App() {
  const [user, setUser] = useState(null)

  const handleSignOut = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  if (user) {
    return <ExportDashboard username={user.username} onSignOut={handleSignOut} />
  }

  return <AuthForm onAuth={setUser} />
}

export default App
