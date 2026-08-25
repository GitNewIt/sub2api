<template>
  <input
    :value="draft"
    type="number"
    min="1"
    step="1"
    class="account-priority-input"
    :title="t('admin.accounts.priorityHint')"
    :aria-label="t('admin.accounts.priority')"
    data-testid="account-priority-input"
    @click.stop
    @mousedown.stop
    @focus="focused = true"
    @input="onInput"
    @change="commit"
    @blur="onBlur"
    @keydown.enter.prevent="commitFromKeyboard"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminAPI } from '@/api/admin'
import { useAppStore } from '@/stores/app'
import { extractApiErrorMessage } from '@/utils/apiError'
import type { Account } from '@/types'

const props = defineProps<{
  account: Account
}>()

const emit = defineEmits<{
  (e: 'updated', account: Account): void
}>()

const { t } = useI18n()
const appStore = useAppStore()

const draft = ref<string | number>(props.account.priority)
const focused = ref(false)
const saving = ref(false)

const normalizePriority = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value).trim(), 10)
  if (!Number.isFinite(parsed) || parsed < 1) return null
  return Math.trunc(parsed)
}

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  draft.value = target.value
}

const revertDraft = () => {
  draft.value = props.account.priority
}

const commit = async () => {
  const next = normalizePriority(draft.value)
  if (next == null) {
    revertDraft()
    return
  }
  draft.value = next
  if (next === props.account.priority || saving.value) return

  saving.value = true
  try {
    const updated = await adminAPI.accounts.update(props.account.id, { priority: next })
    emit('updated', updated)
  } catch (error) {
    revertDraft()
    appStore.showError(extractApiErrorMessage(error, t('admin.accounts.failedToUpdate')))
  } finally {
    saving.value = false
  }
}

const onBlur = () => {
  focused.value = false
  void commit()
}

const commitFromKeyboard = (event: KeyboardEvent) => {
  ;(event.target as HTMLInputElement).blur()
}

watch(
  () => props.account.priority,
  (value) => {
    if (!focused.value && !saving.value) {
      draft.value = value
    }
  }
)
</script>

<style scoped>
.account-priority-input {
  @apply w-[4.5rem] rounded-lg px-1.5 py-1 text-center text-sm;
  @apply bg-white dark:bg-dark-800;
  @apply border border-gray-200 dark:border-dark-600;
  @apply text-gray-900 dark:text-gray-100;
  @apply transition-all duration-200;
  @apply focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30;
  @apply disabled:cursor-not-allowed disabled:opacity-60;
}
</style>
