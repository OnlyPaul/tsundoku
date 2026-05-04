import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './routes/Home'
import Reader from './routes/Reader'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reader/:slug" element={<Reader />} />
      </Routes>
    </BrowserRouter>
  )
}
