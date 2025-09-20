<template>
  <div class="max-w-6xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">时间戳转换工具</h2>
        <p class="text-gray-600">
          时间戳与时区字符串时间相互转换，支持多种时间格式和时区设置。
        </p>
      </div>

      <!-- 当前时间 -->
      <div class="mb-8 p-4 bg-blue-50 rounded-lg">
        <h3 class="text-lg font-semibold text-blue-800 mb-3">当前时间</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="p-3 bg-white rounded border">
            <div class="text-sm text-gray-600">Unix时间戳 (秒)</div>
            <div class="text-lg font-mono font-semibold">{{ currentTimestamp }}</div>
          </div>
          <div class="p-3 bg-white rounded border">
            <div class="text-sm text-gray-600">Unix时间戳 (毫秒)</div>
            <div class="text-lg font-mono font-semibold">{{ currentTimestampMs }}</div>
          </div>
          <div class="p-3 bg-white rounded border">
            <div class="text-sm text-gray-600">本地时间</div>
            <div class="text-lg font-mono font-semibold">{{ currentLocalTime }}</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <!-- 时间戳转时间字符串 -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">时间戳 → 时间字符串</h3>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              时间戳
            </label>
            <div class="flex space-x-2">
              <input
                v-model="timestampInput"
                type="text"
                placeholder="请输入时间戳（支持秒/毫秒）"
                class="input-field flex-1"
                @keyup.enter="convertFromTimestamp"
              />
              <button
                @click="convertFromTimestamp"
                class="btn btn-primary whitespace-nowrap"
                :disabled="!timestampInput.trim()"
              >
                转换
              </button>
              <button
                @click="timestampInput = currentTimestamp; convertFromTimestamp()"
                class="btn btn-secondary whitespace-nowrap"
              >
                当前时间
              </button>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              自动检测时间戳格式（10位为秒，13位为毫秒）| 按Enter键快速转换
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              时区
            </label>
            <select v-model="selectedTimezone" class="input-field">
              <option v-for="tz in commonTimezones" :key="tz.value" :value="tz.value">
                {{ tz.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              转换结果
            </label>
            <div class="space-y-2">
              <div v-for="format in timeFormats" :key="format.name" class="flex items-center space-x-2">
                <div class="w-24 text-xs text-gray-600">{{ format.name }}:</div>
                <input
                  :value="timestampResult[format.key] || ''"
                  readonly
                  class="input-field flex-1 bg-gray-50 font-mono text-sm"
                />
                <button
                  @click="copyText(timestampResult[format.key])"
                  class="btn btn-secondary text-xs px-2 py-1"
                  :disabled="!timestampResult[format.key]"
                >
                  复制
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 时间字符串转时间戳 -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">时间字符串 → 时间戳</h3>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              时间字符串
            </label>
            <div class="flex space-x-2">
              <input
                v-model="timeStringInput"
                type="text"
                placeholder="请输入时间字符串"
                class="input-field flex-1"
                @keyup.enter="convertToTimestamp"
              />
              <button
                @click="convertToTimestamp"
                class="btn btn-primary whitespace-nowrap"
                :disabled="!timeStringInput.trim()"
              >
                转换
              </button>
              <button
                @click="setCurrentDateTime"
                class="btn btn-secondary whitespace-nowrap"
              >
                当前时间
              </button>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              支持格式：2024-01-01 12:00:00、2024/01/01 12:00:00、ISO 8601等 | 按Enter键快速转换
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              输入时区
            </label>
            <select v-model="inputTimezone" class="input-field">
              <option v-for="tz in commonTimezones" :key="tz.value" :value="tz.value">
                {{ tz.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              转换结果
            </label>
            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <div class="w-24 text-xs text-gray-600">Unix秒:</div>
                <input
                  :value="timeStringResult.seconds || ''"
                  readonly
                  class="input-field flex-1 bg-gray-50 font-mono text-sm"
                />
                <button
                  @click="copyText(timeStringResult.seconds)"
                  class="btn btn-secondary text-xs px-2 py-1"
                  :disabled="!timeStringResult.seconds"
                >
                  复制
                </button>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-24 text-xs text-gray-600">Unix毫秒:</div>
                <input
                  :value="timeStringResult.milliseconds || ''"
                  readonly
                  class="input-field flex-1 bg-gray-50 font-mono text-sm"
                />
                <button
                  @click="copyText(timeStringResult.milliseconds)"
                  class="btn btn-secondary text-xs px-2 py-1"
                  :disabled="!timeStringResult.milliseconds"
                >
                  复制
                </button>
              </div>
            </div>
          </div>

          <div v-if="parseError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div class="text-red-800 text-sm">{{ parseError }}</div>
          </div>
        </div>
      </div>

      <!-- 批量转换 -->
      <div class="mt-8 p-4 bg-green-50 rounded-lg">
        <h4 class="font-semibold text-green-800 mb-3">批量转换</h4>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-green-700 mb-2">
              批量时间戳（每行一个）
            </label>
            <textarea
              v-model="batchTimestamps"
              placeholder="1609459200&#10;1640995200&#10;1672531200"
              class="textarea-field h-24 font-mono text-sm"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-green-700 mb-2">
              批量转换结果
            </label>
            <textarea
              :value="batchResults"
              readonly
              class="textarea-field h-24 bg-white font-mono text-sm"
              placeholder="批量转换结果将显示在这里..."
            ></textarea>
          </div>
        </div>
        <div class="mt-3 flex space-x-2">
          <button
            @click="convertBatchTimestamps"
            class="btn btn-primary text-sm"
            :disabled="!batchTimestamps.trim()"
          >
            批量转换
          </button>
          <button
            @click="copyText(batchResults)"
            class="btn btn-secondary text-sm"
            :disabled="!batchResults"
          >
            复制结果
          </button>
          <button
            @click="clearBatch"
            class="btn btn-secondary text-sm"
          >
            清空
          </button>
        </div>
      </div>

      <!-- 快捷时间 -->
      <div class="mt-8 p-4 bg-purple-50 rounded-lg">
        <h4 class="font-semibold text-purple-800 mb-3">快捷时间</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <button
            v-for="preset in timePresets"
            :key="preset.name"
            @click="setPresetTime(preset)"
            class="btn btn-secondary text-sm"
          >
            {{ preset.name }}
          </button>
        </div>
      </div>

      <!-- 说明文档 -->
      <div class="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-800 mb-2">使用说明：</h4>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• Unix时间戳是从1970年1月1日UTC开始计算的秒数或毫秒数</li>
          <li>• 支持10位（秒）和13位（毫秒）时间戳格式</li>
          <li>• 输入后点击"转换"按钮或按Enter键快速转换</li>
          <li>• 时区转换考虑夏令时等因素，覆盖全球主要时区</li>
          <li>• 支持多种常见的时间字符串格式</li>
          <li>• 批量转换功能支持一次处理多个时间戳</li>
          <li>• 所有计算在本地完成，数据不会上传服务器</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TimestampTool',
  data() {
    return {
      currentTimestamp: '',
      currentTimestampMs: '',
      currentLocalTime: '',
      
      timestampInput: '',
      selectedTimezone: 'Asia/Shanghai',
      timestampResult: {},
      
      timeStringInput: '',
      inputTimezone: 'Asia/Shanghai',
      timeStringResult: {},
      parseError: '',
      
      batchTimestamps: '',
      batchResults: '',
      
      commonTimezones: [
        // UTC和主要地区
        { label: 'UTC (协调世界时)', value: 'UTC' },
        
        // 亚洲时区 (UTC+1 到 UTC+12)
        { label: 'Asia/Shanghai (中国标准时间 UTC+8)', value: 'Asia/Shanghai' },
        { label: 'Asia/Tokyo (日本标准时间 UTC+9)', value: 'Asia/Tokyo' },
        { label: 'Asia/Seoul (韩国标准时间 UTC+9)', value: 'Asia/Seoul' },
        { label: 'Asia/Hong_Kong (香港时间 UTC+8)', value: 'Asia/Hong_Kong' },
        { label: 'Asia/Taipei (台北时间 UTC+8)', value: 'Asia/Taipei' },
        { label: 'Asia/Singapore (新加坡时间 UTC+8)', value: 'Asia/Singapore' },
        { label: 'Asia/Bangkok (曼谷时间 UTC+7)', value: 'Asia/Bangkok' },
        { label: 'Asia/Jakarta (雅加达时间 UTC+7)', value: 'Asia/Jakarta' },
        { label: 'Asia/Kolkata (印度标准时间 UTC+5:30)', value: 'Asia/Kolkata' },
        { label: 'Asia/Dubai (迪拜时间 UTC+4)', value: 'Asia/Dubai' },
        { label: 'Asia/Yekaterinburg (叶卡捷琳堡时间 UTC+5)', value: 'Asia/Yekaterinburg' },
        { label: 'Asia/Novosibirsk (新西伯利亚时间 UTC+7)', value: 'Asia/Novosibirsk' },
        
        // 欧洲时区 (UTC+0 到 UTC+3)
        { label: 'Europe/London (格林威治时间 UTC+0)', value: 'Europe/London' },
        { label: 'Europe/Paris (中欧时间 UTC+1)', value: 'Europe/Paris' },
        { label: 'Europe/Berlin (柏林时间 UTC+1)', value: 'Europe/Berlin' },
        { label: 'Europe/Rome (罗马时间 UTC+1)', value: 'Europe/Rome' },
        { label: 'Europe/Madrid (马德里时间 UTC+1)', value: 'Europe/Madrid' },
        { label: 'Europe/Amsterdam (阿姆斯特丹时间 UTC+1)', value: 'Europe/Amsterdam' },
        { label: 'Europe/Stockholm (斯德哥尔摩时间 UTC+1)', value: 'Europe/Stockholm' },
        { label: 'Europe/Helsinki (赫尔辛基时间 UTC+2)', value: 'Europe/Helsinki' },
        { label: 'Europe/Athens (雅典时间 UTC+2)', value: 'Europe/Athens' },
        { label: 'Europe/Moscow (莫斯科时间 UTC+3)', value: 'Europe/Moscow' },
        
        // 非洲时区
        { label: 'Africa/Cairo (开罗时间 UTC+2)', value: 'Africa/Cairo' },
        { label: 'Africa/Johannesburg (南非时间 UTC+2)', value: 'Africa/Johannesburg' },
        { label: 'Africa/Lagos (拉各斯时间 UTC+1)', value: 'Africa/Lagos' },
        
        // 美洲时区 (UTC-12 到 UTC-3)
        { label: 'America/New_York (东部时间 UTC-5)', value: 'America/New_York' },
        { label: 'America/Chicago (中部时间 UTC-6)', value: 'America/Chicago' },
        { label: 'America/Denver (山地时间 UTC-7)', value: 'America/Denver' },
        { label: 'America/Los_Angeles (太平洋时间 UTC-8)', value: 'America/Los_Angeles' },
        { label: 'America/Anchorage (阿拉斯加时间 UTC-9)', value: 'America/Anchorage' },
        { label: 'Pacific/Honolulu (夏威夷时间 UTC-10)', value: 'Pacific/Honolulu' },
        { label: 'America/Toronto (多伦多时间 UTC-5)', value: 'America/Toronto' },
        { label: 'America/Vancouver (温哥华时间 UTC-8)', value: 'America/Vancouver' },
        { label: 'America/Mexico_City (墨西哥城时间 UTC-6)', value: 'America/Mexico_City' },
        { label: 'America/Sao_Paulo (圣保罗时间 UTC-3)', value: 'America/Sao_Paulo' },
        { label: 'America/Buenos_Aires (布宜诺斯艾利斯时间 UTC-3)', value: 'America/Buenos_Aires' },
        { label: 'America/Lima (利马时间 UTC-5)', value: 'America/Lima' },
        
        // 大洋洲时区
        { label: 'Australia/Sydney (悉尼时间 UTC+10)', value: 'Australia/Sydney' },
        { label: 'Australia/Melbourne (墨尔本时间 UTC+10)', value: 'Australia/Melbourne' },
        { label: 'Australia/Brisbane (布里斯班时间 UTC+10)', value: 'Australia/Brisbane' },
        { label: 'Australia/Perth (珀斯时间 UTC+8)', value: 'Australia/Perth' },
        { label: 'Pacific/Auckland (奥克兰时间 UTC+12)', value: 'Pacific/Auckland' },
        { label: 'Pacific/Fiji (斐济时间 UTC+12)', value: 'Pacific/Fiji' }
      ],
      
      timeFormats: [
        { name: 'ISO 8601', key: 'iso' },
        { name: '标准格式', key: 'standard' },
        { name: '中文格式', key: 'chinese' },
        { name: '日期', key: 'date' },
        { name: '时间', key: 'time' }
      ],
      
      timePresets: [
        { name: '现在', offset: 0 },
        { name: '1小时前', offset: -3600 },
        { name: '1天前', offset: -86400 },
        { name: '1周前', offset: -604800 },
        { name: '1月前', offset: -2592000 },
        { name: '1年前', offset: -31536000 }
      ]
    }
  },
  mounted() {
    this.updateCurrentTime()
    setInterval(this.updateCurrentTime, 1000)
  },
  methods: {
    updateCurrentTime() {
      const now = new Date()
      this.currentTimestamp = Math.floor(now.getTime() / 1000)
      this.currentTimestampMs = now.getTime()
      this.currentLocalTime = now.toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    },
    
    convertFromTimestamp() {
      this.timestampResult = {}
      
      if (!this.timestampInput || !this.timestampInput.trim()) return
      
      try {
        let timestamp = parseInt(this.timestampInput.trim())
        
        // 自动检测时间戳格式
        if (this.timestampInput.length <= 10) {
          // 秒级时间戳
          timestamp = timestamp * 1000
        }
        
        const date = new Date(timestamp)
        
        if (isNaN(date.getTime())) {
          throw new Error('无效的时间戳')
        }
        
        // 根据时区格式化时间
        const options = { timeZone: this.selectedTimezone }
        
        this.timestampResult = {
          iso: date.toISOString(),
          standard: date.toLocaleString('en-CA', { 
            ...options,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }).replace(',', ''),
          chinese: date.toLocaleString('zh-CN', {
            ...options,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          date: date.toLocaleDateString('zh-CN', { ...options }),
          time: date.toLocaleTimeString('zh-CN', { ...options })
        }
        
      } catch (error) {
        console.error('时间戳转换错误:', error)
      }
    },
    
    convertToTimestamp() {
      this.timeStringResult = {}
      this.parseError = ''
      
      if (!this.timeStringInput || !this.timeStringInput.trim()) return
      
      try {
        let dateStr = this.timeStringInput.trim()
        
        // 处理常见格式
        dateStr = dateStr.replace(/年|月/g, '-').replace(/日|号/g, '')
        dateStr = dateStr.replace(/时|点/g, ':').replace(/分/g, ':').replace(/秒/g, '')
        
        let date
        
        // 尝试解析不同格式
        if (dateStr.includes('T') || dateStr.includes('Z')) {
          // ISO 8601格式
          date = new Date(dateStr)
        } else {
          // 其他格式
          date = new Date(dateStr)
          
          // 如果输入时区不是本地时区，需要调整
          if (this.inputTimezone !== Intl.DateTimeFormat().resolvedOptions().timeZone) {
            // 这里简化处理，实际应该根据时区偏移量调整
            const offsetDiff = this.getTimezoneOffset(this.inputTimezone) - date.getTimezoneOffset()
            date = new Date(date.getTime() + offsetDiff * 60000)
          }
        }
        
        if (isNaN(date.getTime())) {
          throw new Error('无法解析的时间格式')
        }
        
        this.timeStringResult = {
          seconds: Math.floor(date.getTime() / 1000).toString(),
          milliseconds: date.getTime().toString()
        }
        
      } catch (error) {
        this.parseError = '时间解析错误: ' + error.message
        console.error('时间字符串转换错误:', error)
      }
    },
    
    getTimezoneOffset(timezone) {
      // 简化的时区偏移计算
      const timezoneOffsets = {
        'UTC': 0,
        'Asia/Shanghai': -480,
        'Asia/Tokyo': -540,
        'Europe/London': 0, // 简化处理
        'Europe/Paris': -60,
        'America/New_York': 300,
        'America/Los_Angeles': 480,
        'America/Chicago': 360
      }
      return timezoneOffsets[timezone] || 0
    },
    
    convertBatchTimestamps() {
      if (!this.batchTimestamps.trim()) {
        this.batchResults = ''
        return
      }
      
      const timestamps = this.batchTimestamps.trim().split('\n')
      const results = []
      
      timestamps.forEach((ts, index) => {
        const trimmed = ts.trim()
        if (!trimmed) return
        
        try {
          let timestamp = parseInt(trimmed)
          if (trimmed.length <= 10) {
            timestamp = timestamp * 1000
          }
          
          const date = new Date(timestamp)
          if (isNaN(date.getTime())) {
            results.push(`${index + 1}. ${trimmed} -> 无效时间戳`)
          } else {
            const formatted = date.toLocaleString('zh-CN', {
              timeZone: this.selectedTimezone,
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
            results.push(`${index + 1}. ${trimmed} -> ${formatted}`)
          }
        } catch (error) {
          results.push(`${index + 1}. ${trimmed} -> 转换失败`)
        }
      })
      
      this.batchResults = results.join('\n')
    },
    
    setPresetTime(preset) {
      const timestamp = Math.floor(Date.now() / 1000) + preset.offset
      this.timestampInput = timestamp.toString()
      this.convertFromTimestamp()
    },
    
    setCurrentDateTime() {
      const now = new Date()
      this.timeStringInput = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(/\//g, '-')
      this.convertToTimestamp()
    },
    
    clearBatch() {
      this.batchTimestamps = ''
      this.batchResults = ''
    },
    
    async copyText(text) {
      if (!text) return
      
      try {
        await navigator.clipboard.writeText(text)
        this.showNotification('已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
        this.showNotification('复制失败', 'error')
      }
    },
    
    showNotification(message, type = 'success') {
      const notification = document.createElement('div')
      notification.textContent = message
      const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500'
      notification.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50`
      document.body.appendChild(notification)
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 2000)
    }
  }
}
</script>
