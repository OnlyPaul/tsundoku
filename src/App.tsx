import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './routes/Home'
import Reader from './routes/Reader'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reader/:slug" element={<Reader />} />
      </Routes>
    </BrowserRouter>
  )
}
