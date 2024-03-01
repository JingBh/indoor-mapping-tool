<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: Object
})

const emit = defineEmits([
  'delete',
  'update:name',
  'update:x1',
  'update:x2',
  'update:y1',
  'update:y2'
])

const x1 = computed({
  get: () => props.value.type === 'point' ? props.value.x : props.value.x1,
  set: (val) => emit('update:x1', val)
})
const x2 = computed({
  get: () => props.value.x2,
  set: (val) => emit('update:x2', val)
})
const y1 = computed({
  get: () => props.value.type === 'point' ? props.value.y : props.value.y1,
  set: (val) => emit('update:y1', val)
})
const y2 = computed({
  get: () => props.value.y2,
  set: (val) => emit('update:y2', val)
})
const lat1 = computed(() => props.value.type === 'point' ? props.value.lat : props.value.lat1)
const lat2 = computed(() => props.value.lat2)
const long1 = computed(() => props.value.type === 'point' ? props.value.long : props.value.long1)
const long2 = computed(() => props.value.long2)
</script>

<template>
  <el-form
    label-position="top"
  >
    <el-form-item
      v-if="value.type === 'space'"
      label="Name"
    >
      <el-input
        :model-value="value.name"
        size="small"
        placeholder="Name"
        @update:model-value="val => emit('update:name', val)"
      />
    </el-form-item>
    <el-form-item label="Coordinates">
      <div class="grid grid-cols-2 gap-2">
        <el-input
          v-model="x1"
          type="number"
          size="small"
          placeholder="x1"
        />
        <el-input
          v-model="y1"
          type="number"
          size="small"
          placeholder="y1"
        />
        <el-input
          v-if="value.type !== 'point'"
          v-model="x2"
          type="number"
          size="small"
          placeholder="x2"
        />
        <el-input
          v-if="value.type !== 'point'"
          v-model="y2"
          type="number"
          size="small"
          placeholder="y2"
        />
      </div>
    </el-form-item>
    <el-form-item label="Geographical">
      <div class="grid grid-cols-2 gap-2">
        <el-input
          :model-value="lat1"
          size="small"
          disabled
          readonly
          placeholder="lat1"
        />
        <el-input
          :model-value="long1"
          size="small"
          disabled
          readonly
          placeholder="long1"
        />
        <el-input
          v-if="value.type !== 'point'"
          :model-value="lat2"
          size="small"
          disabled
          readonly
          placeholder="lat2"
        />
        <el-input
          v-if="value.type !== 'point'"
          :model-value="long2"
          size="small"
          disabled
          readonly
          placeholder="long2"
        />
      </div>
    </el-form-item>
    <el-form-item v-if="value.type !== 'reference'">
      <el-button
        class="w-full"
        type="danger"
        @click="emit('delete')"
      >
        Delete
      </el-button>
    </el-form-item>
  </el-form>
</template>
