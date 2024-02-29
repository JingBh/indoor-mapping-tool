<script setup>
import { computed, ref, watch } from 'vue'
import { onKeyStroke, useMouseInElement, useRafFn, useResizeObserver } from '@vueuse/core'

const props = defineProps({
  config: Object,
  creatingType: String,
  floor: Number,
  floorImage: String,
  selected: String
})

const emit = defineEmits([
  'create',
  'delete',
  'select',
  'update:creatingType'
])

/** @type { Ref<HTMLCanvasElement | null> } */
const ele = ref(null)
const ctx = computed(() => {
  if (!ele.value) {
    return null
  }
  return ele.value.getContext('2d')
})

const dpr = window.devicePixelRatio || 1
useResizeObserver(ele, (entries) => {
  const { width, height } = entries[0].contentRect
  if (ele.value) {
    ele.value.width = width * dpr
    ele.value.height = height * dpr
  }
})

const {
  elementX: mouseX,
  elementY: mouseY,
  isOutside
} = useMouseInElement(ele)

const imageScale = ref(1)
const imageOffsetX = ref(0)
const imageOffsetY = ref(0)
const floorImageEle = computed(() => {
  return null // TODO: DEV
  if (!ele.value) {
    return null
  }
  const img = new Image()
  img.src = props.floorImage
  return img
})

const coordinatesMouseToImage = ([x, y]) => ([
  (x * dpr - imageOffsetX.value) / imageScale.value,
  (y * dpr - imageOffsetY.value) / imageScale.value
])
const coordinatesImageToMouse = ([x, y]) => ([
  (x * imageScale.value + imageOffsetX.value) / dpr,
  (y * imageScale.value + imageOffsetY.value) / dpr
])

const mouseAtPoint = (x, y) => {
  // x, y is canvas coordinates of the point
  return Math.abs(x - mouseX.value) < 8 && Math.abs(y - mouseY.value) < 8
}
const mouseOnLine = (x1, y1, x2, y2) => {
  // x1, y1, x2, y2 are canvas coordinates of the line
  const [mx, my] = [mouseX.value, mouseY.value]
  if (mx < Math.min(x1, x2) - 5
    || mx > Math.max(x1, x2) + 5
    || my < Math.min(y1, y2) - 5
    || my > Math.max(y1, y2) + 5) {
    return false
  }
  const d = Math.abs((y2 - y1) * mx - (x2 - x1) * my + x2 * y1 - y2 * x1)
  const l = (y2 - y1) ** 2 + (x2 - x1) ** 2
  return d ** 2 / l < 36
}
const mouseInSpace = (x1, y1, x2, y2) => {
  // x1, y1, x2, y2 are canvas coordinates of the space
  return mouseX.value > Math.min(x1, x2)
    && mouseX.value < Math.max(x1, x2)
    && mouseY.value > Math.min(y1, y2)
    && mouseY.value < Math.max(y1, y2)
}

const getPointOnLine = (x1, y1, x2, y2) => {
  const proportion1 = (mouseX.value - x1) / (x2 - x1)
  const proportion2 = (mouseY.value - y1) / (y2 - y1)
  const proportion = Math.max(Math.min((proportion1 + proportion2) / 2, 1), 0)
  return [
    x1 + (x2 - x1) * proportion,
    y1 + (y2 - y1) * proportion
  ]
}

const redraw = () => {
  if (!ctx.value) {
    return
  }
  const width = ele.value.width
  const height = ele.value.height
  ctx.value.clearRect(0, 0, width, height)

  if (floorImageEle.value && floorImageEle.value.complete) {
    const imgWidth = floorImageEle.value.width
    const imgHeight = floorImageEle.value.height

    imageScale.value = Math.min(width / imgWidth, height / imgHeight)
    imageOffsetX.value = (width - imgWidth * imageScale.value) / 2
    imageOffsetY.value = (height - imgHeight * imageScale.value) / 2
    ctx.value.drawImage(
      floorImageEle.value,
      imageOffsetX.value,
      imageOffsetY.value,
      imgWidth * imageScale.value,
      imgHeight * imageScale.value
    )
  }

  const creatingTmp = creating.value.map((point) => {
    if (point.id) {
      const p = props.config.points[point.id]
      return coordinatesImageToMouse([p.x, p.y])
    }
    return coordinatesImageToMouse([point[0], point[1]])
  })
  let mouseOnAny = false

  if (props.config.references[props.floor]) {
    const floor = props.config.references[props.floor]
    const [x1, y1] = coordinatesImageToMouse([floor.x1, floor.y1])
    const [x2, y2] = coordinatesImageToMouse([floor.x2, floor.y2])
    ctx.value.save()
    ctx.value.beginPath()
    // outer shape clockwise
    ctx.value.rect(0, 0, width, height)
    // inner shape anti-clockwise
    ctx.value.moveTo(x1 * dpr, y1 * dpr)
    ctx.value.lineTo(x1 * dpr, y2 * dpr)
    ctx.value.lineTo(x2 * dpr, y2 * dpr)
    ctx.value.lineTo(x2 * dpr, y1 * dpr)
    ctx.value.clip()
    ctx.value.fillStyle = 'rgba(107, 114, 128, 0.1)' // tailwind: gray-100 opacity-10
    ctx.value.fillRect(0, 0, width, height)
    ctx.value.restore()
  }
  for (const [uuid, space] of (Object.entries(props.config.spaces) ?? [])) {
    if (space.floor !== props.floor) {
      continue
    }

    const [x1, y1] = coordinatesImageToMouse([space.x1, space.y1])
    const [x2, y2] = coordinatesImageToMouse([space.x2, space.y2])
    ctx.value.beginPath()
    ctx.value.rect(x1 * dpr, y1 * dpr, (x2 - x1) * dpr, (y2 - y1) * dpr)

    let selected = props.selected === uuid || mouseInSpace(x1, y1, x2, y2)
    if (selected) {
      ctx.value.fillStyle = 'rgba(124, 58, 237, 0.1)' // tailwind: violet-600 opacity-10
      ctx.value.fill()
      ctx.value.strokeStyle = '#7c3aed' // tailwind: violet-600
      ctx.value.lineWidth = 1 * dpr
      ctx.value.stroke()
    } else {
      ctx.value.fillStyle = 'rgba(14, 156, 233, 0.1)' // tailwind: sky-500 opacity-10
      ctx.value.fill()
    }
  }
  for (const [uuid, line] of (Object.entries(props.config.lines) ?? [])) {
    if (line.floor !== props.floor) {
      continue
    }

    const p1 = props.config.points[line.p1]
    const p2 = props.config.points[line.p2]
    const [x1, y1] = coordinatesImageToMouse([p1.x, p1.y])
    const [x2, y2] = coordinatesImageToMouse([p2.x, p2.y])
    ctx.value.beginPath()
    ctx.value.moveTo(x1 * dpr, y1 * dpr)
    ctx.value.lineTo(x2 * dpr, y2 * dpr)

    let mouseOn = mouseOnLine(x1, y1, x2, y2)
    if (mouseOn && !mouseOnAny) {
      mouseOnAny = true
      if (props.creatingType) {
        creatingTmp.push(getPointOnLine(x1, y1, x2, y2))
      }
    }
    if (props.selected === uuid || mouseOn) {
      ctx.value.lineWidth = 4 * dpr
      ctx.value.strokeStyle = '#7c3aed' // tailwind: violet-600
    } else {
      ctx.value.lineWidth = 2 * dpr
      ctx.value.strokeStyle = '#0ea5e9' // tailwind: sky-500
    }
    ctx.value.stroke()
  }
  for (const [uuid, point] of (Object.entries(props.config.points) ?? [])) {
    if (point.floor !== props.floor) {
      continue
    }

    const [x, y] = coordinatesImageToMouse([point.x, point.y])
    ctx.value.beginPath()
    ctx.value.arc(x * dpr, y * dpr, 5 * dpr, 0, Math.PI * 2)
    ctx.value.fillStyle = '#6366f1' // tailwind: indigo-500
    ctx.value.fill()

    let selected = props.selected === uuid || mouseAtPoint(x, y)
    if (selected) {
      ctx.value.beginPath()
      ctx.value.arc(x * dpr, y * dpr, 8 * dpr, 0, Math.PI * 2)
      ctx.value.strokeStyle = '#7c3aed' // tailwind: violet-600
      ctx.value.lineWidth = 2 * dpr
      ctx.value.stroke()
    }
  }

  if (props.creatingType) {
    if (!mouseOnAny && !isOutside.value) {
      creatingTmp.push([mouseX.value, mouseY.value])
    }
    if (creatingTmp.length >= 2) {
      if (props.creatingType === 'line') {
        const [x1, y1] = creatingTmp[0]
        const [x2, y2] = creatingTmp[1]
        ctx.value.beginPath()
        ctx.value.moveTo(x1 * dpr, y1 * dpr)
        ctx.value.lineTo(x2 * dpr, y2 * dpr)
        ctx.value.lineWidth = 2 * dpr
        ctx.value.strokeStyle = '#7dd3fc' // tailwind: sky-300
        ctx.value.stroke()
      } else if (props.creatingType === 'space') {
        const [x1, y1] = creatingTmp[0]
        const [x2, y2] = creatingTmp[1]
        ctx.value.beginPath()
        ctx.value.rect(x1 * dpr, y1 * dpr, (x2 - x1) * dpr, (y2 - y1) * dpr)
        ctx.value.fillStyle = 'rgba(14, 156, 233, 0.1)' // tailwind: sky-500 opacity-20
        ctx.value.fill()
      }
    }
    for (const [x, y] of creatingTmp) {
      ctx.value.beginPath()
      ctx.value.arc(x * dpr, y * dpr, 5 * dpr, 0, Math.PI * 2)
      ctx.value.fillStyle = '#c4b5fd' // tailwind: indigo-300
      ctx.value.fill()
    }
  }
}

useRafFn(() => redraw(), {
  immediate: true
})

const creating = ref([])
const clearCreating = () => {
  creating.value = []
  emit('update:creatingType', '')
}
watch(() => props.creatingType, (newType) => {
  if (!newType) {
    creating.value = []
  }
}, {
  immediate: true
})

const onClick = () => {
  let atPoint = ''
  for (const [uuid, point] of (Object.entries(props.config.points) ?? [])) {
    if (point.floor !== props.floor || props.selected === uuid) {
      continue
    }
    const [x, y] = coordinatesImageToMouse([point.x, point.y])
    if (mouseAtPoint(x, y)) {
      if (props.creatingType) {
        atPoint = uuid
        break
      } else {
        emit('select', uuid)
        return
      }
    }
  }
  let onLine = ''
  let onLinePoint = null
  for (const [uuid, line] of (Object.entries(props.config.lines) ?? [])) {
    if (props.creatingType && atPoint) {
      break
    }
    if (line.floor !== props.floor || props.selected === uuid) {
      continue
    }
    const p1 = props.config.points[line.p1]
    const p2 = props.config.points[line.p2]
    const [x1, y1] = coordinatesImageToMouse([p1.x, p1.y])
    const [x2, y2] = coordinatesImageToMouse([p2.x, p2.y])
    if (mouseOnLine(x1, y1, x2, y2)) {
      if (props.creatingType) {
        onLine = uuid
        onLinePoint = getPointOnLine(x1, y1, x2, y2)
        break
      } else {
        emit('select', uuid)
        return
      }
    }
  }
  if (props.creatingType) {
    if (atPoint) {
      creating.value.push({ id: atPoint })
    } else if (onLine && onLinePoint) {
      [onLinePoint.x, onLinePoint.y] = coordinatesMouseToImage(onLinePoint)
      creating.value.push([onLinePoint.x, onLinePoint.y, onLine])
    } else {
      creating.value.push(coordinatesMouseToImage([mouseX.value, mouseY.value]))
    }
    if (props.creatingType === 'point' || creating.value.length >= 2) {
      emit('create', {
        type: props.creatingType,
        points: creating.value
      })
      clearCreating()
    }
  }
  for (const [uuid, space] of (Object.entries(props.config.spaces) ?? [])) {
    if (space.floor !== props.floor || props.selected === uuid) {
      continue
    }
    const [x1, y1] = coordinatesImageToMouse([space.x1, space.y1])
    const [x2, y2] = coordinatesImageToMouse([space.x2, space.y2])
    if (mouseInSpace(x1, y1, x2, y2)) {
      emit('select', uuid)
      return
    }
  }
  emit('select', '')
}

onKeyStroke(['Backspace', 'Delete'], () => {
  if (!props.selected) {
    return
  }
  emit('delete', props.selected)
})
</script>

<template>
  <canvas
    class="w-full h-full select-none"
    ref="ele"
    @click="onClick"
    @contextmenu.prevent="clearCreating()"
  />
</template>
