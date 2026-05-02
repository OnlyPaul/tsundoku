import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the page heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: '積ん読' })).toBeInTheDocument()
  })

  it('renders the get started button', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument()
  })
})
