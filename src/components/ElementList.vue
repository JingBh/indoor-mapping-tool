<script setup>
import BiApp from 'bootstrap-icons/icons/app.svg?component'
import BiCrosshair from 'bootstrap-icons/icons/crosshair.svg?component'
import BiDashLg from 'bootstrap-icons/icons/dash-lg.svg?component'
import BiPlusCircle from 'bootstrap-icons/icons/plus-circle.svg?component'

defineProps({
  config: Object,
  floor: Number,
  selected: String
})

const emit = defineEmits([
  'select'
])
</script>

<template>
  <div class="max-h-56 overflow-y-auto">
    <div
      v-if="config.references[floor]"
      class="flex gap-2 items-center px-3 py-2 hover:cursor-pointer"
      :class="{
        'text-blue-600 bg-blue-200 hover:bg-blue-200': selected === 'reference',
        'text-blue-400 hover:bg-gray-100': selected !== 'reference'
      }"
      @click="emit('select', 'reference')"
    >
      <bi-crosshair class="w-4 h-4 flex-shrink-0" />
      <span class="flex-1 text-xs">Reference</span>
    </div>
    <template
      v-for="type of ['space', 'line', 'point']"
      :key="type"
    >
      <template
        v-for="(element, uuid) in config[type + 's']"
        :key="uuid"
      >
        <div
          v-if="element.floor === floor"
          class="flex gap-2 items-center px-3 py-2 hover:cursor-pointer"
          :class="{
          'text-blue-600 bg-blue-200 hover:bg-blue-200': selected === uuid,
          'text-blue-400 hover:bg-gray-100': selected !== uuid
        }"
          @click="emit('select', uuid)"
        >
          <bi-app
            v-if="type === 'space'"
            class="w-4 h-4 flex-shrink-0"
          />
          <bi-dash-lg
            v-else-if="type === 'line'"
            class="w-4 h-4 flex-shrink-0 -rotate-45"
          />
          <bi-plus-circle
            v-else-if="type === 'point'"
            class="w-4 h-4 flex-shrink-0"
          />
          <div class="flex-1 flex flex-col gap-1">
            <span class="text-xs capitalize">{{ element.name ?? type }}</span>
            <span
              class="text-2xs font-mono whitespace-nowrap overflow-ellipsis w-full"
              v-text="uuid"
            />
          </div>
        </div>
      </template>
    </template>
  </div>
</template>
