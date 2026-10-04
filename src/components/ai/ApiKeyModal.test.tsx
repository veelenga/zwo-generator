import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiKeyModal } from './ApiKeyModal'
import { useSettingsStore } from '../../store/settingsStore'

const API_KEY = 'sk-test-1234567890'

const settings = () => useSettingsStore.getState()

describe('ApiKeyModal', () => {
  beforeEach(() => {
    useSettingsStore.setState({ openaiApiKey: '', ftp: 200, showApiKeyModal: true })
  })

  it('saves the key and FTP and closes', async () => {
    const user = userEvent.setup()
    render(<ApiKeyModal />)

    await user.type(screen.getByLabelText('API Key'), API_KEY)
    await user.clear(screen.getByLabelText('FTP (watts)'))
    await user.type(screen.getByLabelText('FTP (watts)'), '250')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(settings().openaiApiKey).toBe(API_KEY)
    expect(settings().ftp).toBe(250)
    expect(settings().showApiKeyModal).toBe(false)
  })

  it('rejects a key with the wrong format', async () => {
    const user = userEvent.setup()
    render(<ApiKeyModal />)

    await user.type(screen.getByLabelText('API Key'), 'not-a-key')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByText(/invalid api key format/i)).toBeInTheDocument()
    expect(settings().hasApiKey()).toBe(false)
  })

  it('offers to forget the key only when one is set', () => {
    render(<ApiKeyModal />)

    expect(screen.queryByRole('button', { name: 'Forget key' })).not.toBeInTheDocument()
  })

  it('forgets a saved key', async () => {
    useSettingsStore.setState({ openaiApiKey: API_KEY })
    const user = userEvent.setup()
    render(<ApiKeyModal />)

    await user.click(screen.getByRole('button', { name: 'Forget key' }))

    expect(settings().hasApiKey()).toBe(false)
  })

  it('clears the key when saved with an empty field', async () => {
    useSettingsStore.setState({ openaiApiKey: API_KEY })
    const user = userEvent.setup()
    render(<ApiKeyModal />)

    await user.clear(screen.getByLabelText('API Key'))
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(settings().hasApiKey()).toBe(false)
  })
})
