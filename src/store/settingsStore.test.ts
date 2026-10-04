import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from './settingsStore'

const STORAGE_NAME = 'zwift-workout-settings'
const SESSION_KEY_NAME = `${STORAGE_NAME}-api-key`
const API_KEY = 'sk-test-1234567890'

const durableSettings = () => localStorage.getItem(STORAGE_NAME) ?? ''

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({ openaiApiKey: '', ftp: 200 })
  })

  it('keeps the key in session storage and out of local storage', () => {
    useSettingsStore.getState().setOpenaiApiKey(API_KEY)

    expect(useSettingsStore.getState().hasApiKey()).toBe(true)
    expect(sessionStorage.getItem(SESSION_KEY_NAME)).toBe(API_KEY)
    expect(durableSettings()).not.toContain(API_KEY)
  })

  it('keeps the FTP in local storage', () => {
    useSettingsStore.getState().setFtp(250)

    expect(JSON.parse(durableSettings()).state.ftp).toBe(250)
  })

  it('restores the key within the same session', async () => {
    sessionStorage.setItem(SESSION_KEY_NAME, API_KEY)

    await useSettingsStore.persist.rehydrate()

    expect(useSettingsStore.getState().openaiApiKey).toBe(API_KEY)
  })

  it('has no key in a new session', async () => {
    useSettingsStore.getState().setOpenaiApiKey(API_KEY)
    sessionStorage.clear()
    useSettingsStore.setState(useSettingsStore.getInitialState(), true)

    await useSettingsStore.persist.rehydrate()

    expect(useSettingsStore.getState().hasApiKey()).toBe(false)
  })

  it('removes the key from session storage when cleared', () => {
    useSettingsStore.getState().setOpenaiApiKey(API_KEY)

    useSettingsStore.getState().setOpenaiApiKey('')

    expect(useSettingsStore.getState().hasApiKey()).toBe(false)
    expect(sessionStorage.getItem(SESSION_KEY_NAME)).toBeNull()
  })

  it('moves a plain key saved by an older version out of local storage', async () => {
    sessionStorage.clear()
    localStorage.setItem(
      STORAGE_NAME,
      JSON.stringify({ state: { openaiApiKey: API_KEY, ftp: 250 }, version: 0 })
    )

    await useSettingsStore.persist.rehydrate()

    expect(useSettingsStore.getState().openaiApiKey).toBe(API_KEY)
    expect(useSettingsStore.getState().ftp).toBe(250)
    expect(sessionStorage.getItem(SESSION_KEY_NAME)).toBe(API_KEY)
    expect(durableSettings()).not.toContain(API_KEY)
  })
})
