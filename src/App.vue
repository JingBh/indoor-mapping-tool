<script setup>
import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { saveAs } from 'file-saver'

import CanvasView from './components/CanvasView.vue'
import ElementEdit from './components/ElementEdit.vue'
import ElementList from './components/ElementList.vue'
import FloorSelect from './components/FloorSelect.vue'

import BiExclamationTriangle from 'bootstrap-icons/icons/exclamation-triangle.svg?component'

import plansManifest from './assets/manifests/plans.json'

const floor = ref(plansManifest[0].floor)
const floors = computed(() => {
  return plansManifest.map(v => v.floor)
})
const getFloorImage = (floor) => {
  for (const item of plansManifest) {
    if (item.floor === floor) {
      return item.image ?? null
    }
  }
  return null
}

const config = useLocalStorage('indoor_mapping_config', {
  points: {},
  lines: {},
  spaces: {},
  references: {}
}, {
  mergeDefaults: true
})
const dumpConfig = () => {
  const blob = new Blob([JSON.stringify(config.value)], {
    type: 'application/json;charset=utf-8'
  })
  saveAs(blob, 'indoor-mapping.json')
}
const loadConfig = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json'

  input.onchange = () => {
    if (input.files.length > 0) {
      input.files[0].text().then((content) => {
        config.value = JSON.parse(content)
      })
    }
  }

  input.click()
}

const creatingType = ref('')
const toggleCreatingType = (newType) => {
  creatingType.value = creatingType.value === newType ? '' : newType
}
const onCreate = ({ type, points }) => {
  if (!config.value.references[floor.value]) {
    config.value.references[floor.value] = {
      x1: points[0][0],
      y1: points[0][1],
      lat1: 39.8743749, // north-west corner
      long1: 116.4743509,
      x2: points[1][0],
      y2: points[1][1],
      lat2: 39.8738834, // south-east corner
      long2: 116.4760441
    }
    return
  }
  const reference = config.value.references[floor.value]
  const pointsTmp = points.map((point) => {
    if (point.id) {
      return point
    }
    return {
      x: point[0],
      y: point[1],
      lat: reference.lat1 + (point[1] - reference.y1) / (reference.y2 - reference.y1) * (reference.lat2 - reference.lat1),
      long: reference.long1 + (point[0] - reference.x1) / (reference.x2 - reference.x1) * (reference.long2 - reference.long1),
      line: point[2] ?? null
    }
  })
  const uuid = crypto.randomUUID()
  if (type === 'point' && pointsTmp.length === 1 && !pointsTmp[0].id) {
    config.value.points[uuid] = Object.assign({}, pointsTmp[0], {
      id: uuid,
      floor: floor.value
    })
    if (config.value.points[uuid].line) {
      const line = config.value.lines[config.value.points[uuid].line]
      const uuid1 = crypto.randomUUID()
      const uuid2 = crypto.randomUUID()
      config.value.lines[uuid1] = {
        id: uuid1,
        floor: floor.value,
        p1: line.p1,
        p2: uuid
      }
      config.value.lines[uuid2] = {
        id: uuid2,
        floor: floor.value,
        p1: uuid,
        p2: line.p2
      }
      delete config.value.lines[config.value.points[uuid].line]
      delete config.value.points[uuid].line
    }
  } else if (type === 'line' && pointsTmp.length === 2) {
    let p1, p2
    if (pointsTmp[0].id && config.value.points[pointsTmp[0].id]) {
      p1 = pointsTmp[0].id
    } else {
      const p1uuid = crypto.randomUUID()
      config.value.points[p1uuid] = Object.assign({}, pointsTmp[0], {
        id: p1uuid,
        floor: floor.value
      })
      p1 = p1uuid
      if (config.value.points[p1].line) {
        const line = config.value.lines[config.value.points[p1].line]
        const uuid1 = crypto.randomUUID()
        const uuid2 = crypto.randomUUID()
        config.value.lines[uuid1] = {
          id: uuid1,
          floor: floor.value,
          p1: line.p1,
          p2: p1
        }
        config.value.lines[uuid2] = {
          id: uuid2,
          floor: floor.value,
          p1: p1,
          p2: line.p2
        }
        delete config.value.lines[config.value.points[p1].line]
        delete config.value.points[p1].line
      }
    }
    if (pointsTmp[1].id && config.value.points[pointsTmp[1].id]) {
      p2 = pointsTmp[1].id
    } else {
      const p2uuid = crypto.randomUUID()
      config.value.points[p2uuid] = Object.assign({}, pointsTmp[1], {
        id: p2uuid,
        floor: floor.value
      })
      p2 = p2uuid
      if (config.value.points[p2].line) {
        const line = config.value.lines[config.value.points[p2].line]
        const uuid1 = crypto.randomUUID()
        const uuid2 = crypto.randomUUID()
        config.value.lines[uuid1] = {
          id: uuid1,
          floor: floor.value,
          p1: line.p1,
          p2
        }
        config.value.lines[uuid2] = {
          id: uuid2,
          floor: floor.value,
          p1,
          p2: line.p2
        }
        delete config.value.lines[config.value.points[p2].line]
        delete config.value.points[p2].line
      }
    }
    config.value.lines[uuid] = {
      id: uuid,
      floor: floor.value,
      p1,
      p2
    }
  } else if (type === 'space' && pointsTmp.length === 2) {
    let x1, x2, y1, y2, lat1, lat2, long1, long2
    if (pointsTmp[0].id && config.value.points[pointsTmp[0].id]) {
      x1 = config.value.points[pointsTmp[0].id].x
      y1 = config.value.points[pointsTmp[0].id].y
      lat1 = config.value.points[pointsTmp[0].id].lat
      long1 = config.value.points[pointsTmp[0].id].long
    } else {
      x1 = pointsTmp[0].x
      y1 = pointsTmp[0].y
      lat1 = pointsTmp[0].lat
      long1 = pointsTmp[0].long
    }
    if (pointsTmp[1].id && config.value.points[pointsTmp[1].id]) {
      x2 = config.value.points[pointsTmp[1].id].x
      y2 = config.value.points[pointsTmp[1].id].y
      lat2 = config.value.points[pointsTmp[1].id].lat
      long2 = config.value.points[pointsTmp[1].id].long
    } else {
      x2 = pointsTmp[1].x
      y2 = pointsTmp[1].y
      lat2 = pointsTmp[1].lat
      long2 = pointsTmp[1].long
    }
    config.value.spaces[uuid] = {
      id: uuid,
      floor: floor.value,
      x1,
      y1,
      lat1,
      long1,
      x2,
      y2,
      lat2,
      long2
    }
  }
  selected.value = uuid
}

const selected = ref('')
const selectedElementType = computed(() => {
  if (selected.value === 'reference') {
    return 'reference'
  } else if (config.value.points[selected.value]) {
    return 'point'
  } else if (config.value.lines[selected.value]) {
    return 'line'
  } else if (config.value.spaces[selected.value]) {
    return 'space'
  } else {
    return ''
  }
})
const selectedElement = computed(() => {
  if (selectedElementType.value === 'reference' && config.value.references[floor.value]) {
    return Object.assign({}, config.value.references[floor.value], {
      type: 'reference'
    })
  }
  if (selectedElementType.value) {
    const ele = config.value[selectedElementType.value + 's'][selected.value]
    if (selectedElementType.value === 'line') {
      return Object.assign({}, ele, {
        type: 'line',
        x1: config.value.points[ele.p1].x,
        y1: config.value.points[ele.p1].y,
        x2: config.value.points[ele.p2].x,
        y2: config.value.points[ele.p2].y,
        lat1: config.value.points[ele.p1].lat,
        long1: config.value.points[ele.p1].long,
        lat2: config.value.points[ele.p2].lat,
        long2: config.value.points[ele.p2].long
      })
    }
    return Object.assign({}, ele, {
      type: selectedElementType.value
    })
  }
  return null
})
const onSelect = (uuid) => {
  selected.value = uuid
}

const onDelete = () => {
  const uuid = selected.value
  const deleted = [uuid]
  if (config.value.points[uuid]) {
    for (const [lineUuid, line] of Object.entries(config.value.lines)) {
      if (line.p1 === uuid || line.p2 === uuid) {
        deleted.push(lineUuid)
        delete config.value.lines[lineUuid]
      }
    }
    delete config.value.points[uuid]
  } else if (config.value.lines[uuid]) {
    delete config.value.lines[uuid]
  } else if (config.value.spaces[uuid]) {
    delete config.value.spaces[uuid]
  }
  if (deleted.indexOf(selected.value) >= 0) {
    selected.value = ''
  }
  creatingType.value = ''
}
</script>

<template>
  <el-container class="h-screen">
    <el-aside class="!w-auto h-full p-3 border-r border-gray-300 overflow-y-auto">
      <floor-select
        v-model="floor"
        :floors="floors"
      />
    </el-aside>
    <el-main class="relative !p-0 bg-gray-200">
      <canvas-view
        v-model:creating-type="creatingType"
        :config="config"
        :floor="floor"
        :floor-image="getFloorImage(floor)"
        :selected="selected"
        @create="onCreate"
        @select="onSelect"
      />
    </el-main>
    <el-aside class="!w-64 h-full bg-gray-100 border-l border-gray-300 overflow-y-auto">
      <section class="bg-white p-3 border-b border-gray-200">
        <label class="block mb-2 text-xs text-gray-400 font-medium">
          Add Element
        </label>
        <div class="flex justify-stretch items-center gap-2">
          <el-button
            class="flex-1 !m-0"
            :type="creatingType === 'point' ? 'success' : 'primary'"
            :plain="creatingType !== 'point'"
            @click="toggleCreatingType('point')"
            :disabled="!config.references[floor]"
          >
            Point
          </el-button>
          <el-button
            class="flex-1 !m-0"
            :type="creatingType === 'line' ? 'success' : 'primary'"
            :plain="creatingType !== 'line'"
            :disabled="!config.references[floor]"
            @click="toggleCreatingType('line')"
          >
            Line
          </el-button>
          <el-button
            class="flex-1 !m-0"
            :type="creatingType === 'space' ? 'success' : 'primary'"
            :plain="creatingType !== 'space'"
            @click="toggleCreatingType('space')"
          >
            Space
          </el-button>
        </div>
      </section>
      <section class="bg-white border-b border-gray-200">
        <label class="block pt-3 px-3 mb-2 text-xs text-gray-400 font-medium">
          Element List
        </label>
        <element-list
          :config="config"
          :floor="floor"
          :selected="selected"
          @select="onSelect"
        />
      </section>
      <section class="bg-white p-3 border-b border-gray-200">
        <label class="block mb-2 text-xs text-gray-400 font-medium">
          Element Configuration
        </label>
        <element-edit
          v-if="selectedElement"
          :value="selectedElement"
          @delete="onDelete"
        />
        <p v-else class="inline-flex justify-center items-center gap-1 text-sm text-gray-500">
          <bi-exclamation-triangle class="w-3 h-3" />
          <span>Select an element first</span>
        </p>
      </section>
      <section class="bg-white p-3 border-b border-gray-200">
        <label class="block mb-2 text-xs text-gray-400 font-medium">
          Save & Load
        </label>
        <div class="flex justify-stretch items-center gap-2">
          <el-button
            class="flex-1 !m-0"
            type="primary"
            @click="dumpConfig"
          >
            Dump
          </el-button>
          <el-button
            class="flex-1 !m-0"
            type="success"
            @click="loadConfig"
          >
            Load
          </el-button>
        </div>
      </section>
    </el-aside>
  </el-container>
</template>
