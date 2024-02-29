<script setup>
const props = defineProps({
  modelValue: Number,
  floors: Array
})

const emit = defineEmits([
  'update:modelValue'
])
</script>

<template>
  <div class="flex flex-col gap-2 items-center">
    <span class="text-2xs text-gray-400 uppercase font-bold">
      Floor
    </span>
    <el-button
      v-for="floor of floors"
      :key="floor"
      class="!m-0 !w-8 !h-8"
      type="primary"
      :plain="props.modelValue !== floor"
      round
      @click="emit('update:modelValue', floor)"
    >
      {{ floor }}
    </el-button>
  </div>
</template>
