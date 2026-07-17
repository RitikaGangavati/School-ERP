import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import AppRoutes from './routes/AppRoutes'
import { ToastProvider } from './components/common/ToastContext'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <ToastProvider>
    <AppRoutes/>
    </ToastProvider>
    </>
  )
}

export default App
