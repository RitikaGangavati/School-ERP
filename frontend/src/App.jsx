import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import AppRoutes from './routes/AppRoutes'
import { ToastProvider } from './components/common/ToastContext'
import { AcademicYearProvider } from "./context/AcademicYearContext";

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <AcademicYearProvider>
    <ToastProvider>
    <AppRoutes/>
    </ToastProvider>
    </AcademicYearProvider>
    </>
  )
}

export default App
