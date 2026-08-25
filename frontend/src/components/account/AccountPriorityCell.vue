<template>
  <div
    class="account-priority-stepper"
    :title="t('admin.accounts.priorityHint')"
    @click.stop
    @mousedown.stop
  >
    <button
      type="button"
      class="account-priority-stepper__btn"
      data-testid="account-priority-decrease"
      :disabled="saving || currentValue <= 1"
      :aria-label="`${t('admin.accounts.priority')} -`"
      @mousedown.prevent
      @click="step(-1)"
    >
      <Icon name="minus" size="xs" :stroke-width="2.5" />
    </button>
    <input
      :value="draft"
      type="text"
      inputmode="numeric"
      class="account-priority-stepper__input"
      :aria-label="t('admin.accounts.priority')"
      data-testid="account-priority-input"
      @focus="focused = true"
      @input="onInput"
      @blur="onBlur"
      @keydown.enter.prevent="commitFromKeyboard"
    />
    <button
      type="button"
      class="account-priority-stepper__btn"
      data-testid="account-priority-increase"
      :disabled="saving"
      :aria-label="`${t('admin.accounts.priority')} +`"
      @mousedown.prevent
      @click="step(1)"
    >
      <Icon name="plus" size="xs" :stroke-width="2.5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminAPI } from '@/api/admin'
import { useAppStore } from '@/stores/app'
import { extractApiErrorMessage } from '@/utils/apiError'
import Icon from '@/components/icons/Icon.vue'
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

const currentValue = computed(() => normalizePriority(draft.value) ?? props.account.priority)

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

const commit = async (nextValue?: number) => {
  const next = nextValue ?? normalizePriority(draft.value)
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

const step = (delta: number) => {
  const next = Math.max(1, currentValue.value + delta)
  draft.value = next
  void commit(next)
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
.account-priority-stepper {
  @apply inline-flex h-8 items-stretch overflow-hidden rounded-lg;
  @apply border border-gray-200 dark:border-dark-600;
  @apply bg-white dark:bg-dark-800;
}

.account-priority-stepper__btn {
  @apply flex w-6 items-center justify-center;
  @apply text-gray-500 dark:text-gray-400;
  @apply transition-colors duration-150;
  @apply hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-dark-700 dark:hover:text-gray-100;
  @apply disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent;
}

.account-priority-stepper__input {
  @apply w-10 border-x border-gray-200 bg-transparent px-0 text-center text-sm;
  @apply text-gray-900 dark:border-dark-600 dark:text-gray-100;
  @apply focus:outline-none;
}
</style>
