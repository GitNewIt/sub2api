<template>
  <div class="relative" ref="dropdownRef">
    <button
      type="button"
      class="btn btn-secondary px-2 md:px-3"
      :title="t('common.autoRefresh.title')"
      @click="showDropdown = !showDropdown"
    >
      <Icon name="refresh" size="sm" :class="enabled ? 'animate-spin' : ''" />
      <span class="hidden md:inline">
        {{ enabled
          ? t('common.autoRefresh.countdown', { seconds: countdown })
          : t('common.autoRefresh.title')
        }}
      </span>
    </button>

    <div
      v-if="showDropdown"
      class="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg border border-gray-200 bg-white shadow-lg dark:border-dark-700 dark:bg-dark-800"
    >
      <div class="p-2">
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-dark-700"
          @click="$emit('update:enabled', !enabled)"
        >
          <span>{{ t('common.autoRefresh.enable') }}</span>
          <Icon v-if="enabled" name="check" size="sm" class="text-primary-500" />
        </button>
        <div class="my-1 border-t border-gray-100 dark:border-dark-700"></div>
        <button
          v-for="sec in intervals"
          :key="sec"
          type="button"
          class="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-dark-700"
          @click="$emit('update:interval', sec)"
        >
          <span>{{ t('common.autoRefresh.seconds', { n: sec }) }}</span>
          <Icon v-if="intervalSeconds === sec" name="check" size="sm" class="text-primary-500" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'

defineProps<{
  enabled: boolean
  intervalSeconds: number
  countdown: number
  intervals: readonly number[]
}>()

defineEmits<{
  (e: 'update:enabled', value: boolean): void
  (e: 'update:interval', value: number): void
}>()

const { t } = useI18n()
const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>
