import { describe, expect, it, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import AccountPriorityCell from '../AccountPriorityCell.vue'
import type { Account } from '@/types'

const { updateAccount, showError } = vi.hoisted(() => ({
  updateAccount: vi.fn(),
  showError: vi.fn()
}))

vi.mock('@/api/admin', () => ({
  adminAPI: {
    accounts: {
      update: updateAccount
    }
  }
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    showError,
    showSuccess: vi.fn(),
    showInfo: vi.fn()
  })
}))

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key
    })
  }
})

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 42,
    name: 'acc',
    platform: 'anthropic',
    type: 'oauth',
    proxy_id: null,
    concurrency: 1,
    priority: 1,
    status: 'active',
    error_message: null,
    last_used_at: null,
    expires_at: null,
    auto_pause_on_expired: true,
    created_at: '2026-08-25T00:00:00Z',
    updated_at: '2026-08-25T00:00:00Z',
    schedulable: true,
    ...overrides
  } as Account
}

function mountCell(account = makeAccount()) {
  return mount(AccountPriorityCell, {
    props: { account }
  })
}

describe('AccountPriorityCell', () => {
  beforeEach(() => {
    updateAccount.mockReset()
    showError.mockReset()
  })

  it('renders the current priority', () => {
    const wrapper = mountCell(makeAccount({ priority: 8 }))
    const input = wrapper.get('[data-testid="account-priority-input"]')
    expect((input.element as HTMLInputElement).value).toBe('8')
  })

  it('saves on blur when the value changed', async () => {
    const updated = makeAccount({ priority: 3 })
    updateAccount.mockResolvedValue(updated)
    const wrapper = mountCell()
    const input = wrapper.get('[data-testid="account-priority-input"]')

    await input.setValue('3')
    await input.trigger('blur')
    await flushPromises()

    expect(updateAccount).toHaveBeenCalledWith(42, { priority: 3 })
    expect(wrapper.emitted('updated')?.[0]).toEqual([updated])
  })

  it('saves when the native stepper fires change', async () => {
    const updated = makeAccount({ priority: 2 })
    updateAccount.mockResolvedValue(updated)
    const wrapper = mountCell()
    const input = wrapper.get('[data-testid="account-priority-input"]')

    await input.setValue('2')
    await input.trigger('change')
    await flushPromises()

    expect(updateAccount).toHaveBeenCalledWith(42, { priority: 2 })
  })

  it('does not save when the value is unchanged', async () => {
    const wrapper = mountCell(makeAccount({ priority: 1 }))
    const input = wrapper.get('[data-testid="account-priority-input"]')

    await input.trigger('blur')
    await flushPromises()

    expect(updateAccount).not.toHaveBeenCalled()
  })

  it('reverts invalid values without calling the API', async () => {
    const wrapper = mountCell(makeAccount({ priority: 5 }))
    const input = wrapper.get('[data-testid="account-priority-input"]')

    await input.setValue('0')
    await input.trigger('blur')
    await flushPromises()

    expect(updateAccount).not.toHaveBeenCalled()
    expect((input.element as HTMLInputElement).value).toBe('5')
  })

  it('reverts and shows an error when the update fails', async () => {
    updateAccount.mockRejectedValue({ message: 'boom' })
    const wrapper = mountCell(makeAccount({ priority: 4 }))
    const input = wrapper.get('[data-testid="account-priority-input"]')

    await input.setValue('9')
    await input.trigger('blur')
    await flushPromises()

    expect(showError).toHaveBeenCalled()
    expect((input.element as HTMLInputElement).value).toBe('4')
    expect(wrapper.emitted('updated')).toBeUndefined()
  })
})
