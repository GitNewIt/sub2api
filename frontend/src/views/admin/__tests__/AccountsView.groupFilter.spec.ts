import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import AccountsView from '../AccountsView.vue'

const { listAccounts, getAllGroups } = vi.hoisted(() => ({
  listAccounts: vi.fn(),
  getAllGroups: vi.fn()
}))

vi.mock('@/api/admin', () => ({
  adminAPI: {
    accounts: {
      list: listAccounts,
      listWithEtag: vi.fn(),
      getBatchTodayStats: vi.fn().mockResolvedValue({ stats: {} }),
      getUpstreamBillingProbeSettings: vi.fn().mockResolvedValue({ enabled: true, interval_minutes: 30 }),
      delete: vi.fn(),
      batchClearError: vi.fn(),
      batchRefresh: vi.fn(),
      toggleSchedulable: vi.fn()
    },
    proxies: { getAll: vi.fn().mockResolvedValue([]) },
    groups: { getAll: getAllGroups }
  }
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({ showError: vi.fn(), showSuccess: vi.fn(), showInfo: vi.fn() })
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ token: 'test-token', isSimpleMode: false })
}))

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({ t: (key: string) => key })
  }
})

const AccountTableFiltersStub = {
  props: ['filters'],
  emits: ['update:filters', 'change'],
  template: `
    <div>
      <button
        data-test="set-group"
        @click="$emit('update:filters', { ...filters, group: '7' }); $emit('change')"
      />
      <button
        data-test="clear-group"
        @click="$emit('update:filters', { ...filters, group: '' }); $emit('change')"
      />
    </div>
  `
}

function mountView() {
  return mount(AccountsView, {
    global: {
      stubs: {
        AppLayout: { template: '<div><slot /></div>' },
        TablePageLayout: {
          template: '<div><slot name="filters" /><slot name="table" /><slot name="pagination" /></div>'
        },
        DataTable: true,
        AccountTableActions: { template: '<div><slot name="after" /></div>' },
        AccountTableFilters: AccountTableFiltersStub,
        AccountBulkActionsBar: true,
        Pagination: true,
        ConfirmDialog: true,
        AccountActionMenu: true,
        ImportDataModal: true,
        ReAuthAccountModal: true,
        AccountTestModal: true,
        AccountStatsModal: true,
        ScheduledTestsPanel: true,
        SyncFromCrsModal: true,
        TempUnschedStatusModal: true,
        ErrorPassthroughRulesModal: true,
        TLSFingerprintProfilesModal: true,
        CreateAccountModal: true,
        EditAccountModal: true,
        BulkEditAccountModal: true,
        PlatformTypeBadge: true,
        AccountCapacityCell: true,
        AccountStatusIndicator: true,
        AccountTodayStatsCell: true,
        AccountGroupsCell: true,
        AccountUsageCell: true,
        HelpTooltip: true,
        Icon: true,
        Teleport: true
      }
    }
  })
}

describe('admin AccountsView group filter persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    listAccounts.mockReset().mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 20,
      pages: 0
    })
    getAllGroups.mockReset().mockResolvedValue([{ id: 7, name: 'Team A' }])
  })

  it('restores the saved group filter when reopening the page', async () => {
    localStorage.setItem('account-group-filter', '7')

    mountView()
    await flushPromises()

    expect(listAccounts).toHaveBeenCalledWith(
      1,
      expect.any(Number),
      expect.objectContaining({ group: '7' }),
      expect.anything()
    )
  })

  it('saves the group filter so leaving and returning keeps the selection', async () => {
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-test="set-group"]').trigger('click')
    await flushPromises()

    expect(localStorage.getItem('account-group-filter')).toBe('7')

    wrapper.unmount()
    listAccounts.mockClear()

    mountView()
    await flushPromises()

    expect(listAccounts).toHaveBeenCalledWith(
      1,
      expect.any(Number),
      expect.objectContaining({ group: '7' }),
      expect.anything()
    )
  })

  it('clears the saved group filter when all groups is selected', async () => {
    localStorage.setItem('account-group-filter', '7')
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get('[data-test="clear-group"]').trigger('click')
    await flushPromises()

    expect(localStorage.getItem('account-group-filter')).toBe('')
  })
})
