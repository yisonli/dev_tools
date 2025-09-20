<template>
  <div class="max-w-6xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">随机密码生成器</h2>
        <p class="text-gray-600">
          生成安全的随机密码，支持多种字符集和复杂度设置，实时评估密码强度。
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 左侧：密码设置 -->
        <div class="space-y-6">
          <h3 class="text-lg font-semibold text-gray-700">密码设置</h3>

          <!-- 密码长度 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              密码长度: {{ passwordLength }}
            </label>
            <input
              v-model.number="passwordLength"
              type="range"
              min="4"
              max="128"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              @input="generatePassword"
            />
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>4</span>
              <span>64</span>
              <span>128</span>
            </div>
          </div>

          <!-- 字符集选择 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">
              字符集选择
            </label>
            <div class="space-y-3">
              <label v-for="charset in charsetOptions" :key="charset.key" class="flex items-center">
                <input
                  v-model="selectedCharsets"
                  :value="charset.key"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  @change="generatePassword"
                />
                <div class="ml-3 flex-1">
                  <div class="text-sm font-medium">{{ charset.label }}</div>
                  <div class="text-xs text-gray-500 font-mono">{{ charset.chars }}</div>
                </div>
              </label>
            </div>
          </div>

          <!-- 高级设置 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">
              高级设置
            </label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input
                  v-model="excludeSimilar"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  @change="generatePassword"
                />
                <span class="ml-2 text-sm">排除相似字符 (0, O, l, I, 1)</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="excludeAmbiguous"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  @change="generatePassword"
                />
                <span class="ml-2 text-sm">排除易混淆字符 ({}, [], (), "")</span>
              </label>
              <label class="flex items-center">
                <input
                  v-model="mustIncludeAll"
                  type="checkbox"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  @change="generatePassword"
                />
                <span class="ml-2 text-sm">必须包含所有选中字符集</span>
              </label>
            </div>
          </div>

          <!-- 自定义字符 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              自定义字符集
            </label>
            <input
              v-model="customChars"
              type="text"
              placeholder="输入自定义字符..."
              class="input-field font-mono"
              @input="generatePassword"
            />
            <div class="text-xs text-gray-500 mt-1">
              这些字符将添加到密码字符池中
            </div>
          </div>

          <!-- 生成数量 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              生成数量
            </label>
            <select v-model.number="generateCount" class="input-field" @change="generatePassword">
              <option value="1">1个密码</option>
              <option value="5">5个密码</option>
              <option value="10">10个密码</option>
              <option value="20">20个密码</option>
              <option value="50">50个密码</option>
            </select>
          </div>

          <!-- 预设模板 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              预设模板
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                v-for="preset in passwordPresets"
                :key="preset.name"
                @click="applyPreset(preset)"
                class="btn btn-secondary text-sm text-left"
                :title="preset.description"
              >
                {{ preset.name }}
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧：生成结果 -->
        <div class="space-y-6">
          <h3 class="text-lg font-semibold text-gray-700">生成结果</h3>

          <!-- 密码强度 -->
          <div v-if="currentPassword" class="p-4 rounded-lg border" :class="strengthClass">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium">密码强度</span>
              <span class="text-sm font-semibold" :class="strengthTextClass">
                {{ strengthText }}
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                class="h-2 rounded-full transition-all duration-300"
                :class="strengthBarClass"
                :style="{ width: strengthPercentage + '%' }"
              ></div>
            </div>
                          <div class="text-xs text-gray-600">
                评分: {{ passwordStrength.score }}/100 | 
                熵值: {{ passwordStrength.entropy.toFixed(1) }} bits |
                破解时间: {{ passwordStrength.crackTime }}
              </div>
          </div>

          <!-- 生成的密码 -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="text-sm font-medium text-gray-700">
                生成的密码 ({{ generatedPasswords.length }})
              </label>
              <div class="flex space-x-2">
                <button
                  @click="generatePassword"
                  class="btn btn-primary text-sm"
                  :disabled="selectedCharsets.length === 0"
                >
                  重新生成
                </button>
                <button
                  @click="copyAllPasswords"
                  class="btn btn-secondary text-sm"
                  :disabled="generatedPasswords.length === 0"
                >
                  全部复制
                </button>
              </div>
            </div>
            
            <div class="space-y-2 max-h-80 overflow-y-auto">
              <div
                v-for="(password, index) in generatedPasswords"
                :key="index"
                class="flex items-center space-x-2 p-3 bg-gray-50 rounded border group hover:bg-gray-100"
              >
                <div class="font-mono text-sm flex-1 break-all select-all">
                  {{ password }}
                </div>
                <button
                  @click="copyPassword(password, index)"
                  class="btn btn-secondary text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  :class="{ 'opacity-100': copiedIndex === index }"
                >
                  {{ copiedIndex === index ? '已复制' : '复制' }}
                </button>
                <button
                  @click="analyzePassword(password)"
                  class="btn btn-secondary text-xs"
                  title="分析密码"
                >
                  分析
                </button>
              </div>
            </div>
          </div>

          <!-- 密码分析详情 -->
          <div v-if="analyzedPassword" class="p-4 bg-blue-50 rounded-lg">
            <h4 class="font-semibold text-blue-800 mb-3">密码分析</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>密码:</span>
                <span class="font-mono bg-white px-2 py-1 rounded">{{ analyzedPassword.password }}</span>
              </div>
              <div class="flex justify-between">
                <span>长度:</span>
                <span>{{ analyzedPassword.length }} 字符</span>
              </div>
              <div class="flex justify-between">
                <span>字符类型:</span>
                <span>{{ analyzedPassword.types.join(', ') }}</span>
              </div>
              <div class="flex justify-between">
                <span>字符集大小:</span>
                <span>{{ analyzedPassword.charsetSize }}</span>
              </div>
              <div class="flex justify-between">
                <span>理论组合数:</span>
                <span>{{ analyzedPassword.combinations }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 密码安全建议 -->
      <div class="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h4 class="font-semibold text-yellow-800 mb-3">密码安全建议</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700">
          <div>
            <h5 class="font-medium mb-2">强密码特征:</h5>
            <ul class="space-y-1">
              <li>• 长度至少12个字符</li>
              <li>• 包含大小写字母</li>
              <li>• 包含数字和特殊符号</li>
              <li>• 避免常见单词和模式</li>
            </ul>
          </div>
          <div>
            <h5 class="font-medium mb-2">使用建议:</h5>
            <ul class="space-y-1">
              <li>• 不同账户使用不同密码</li>
              <li>• 定期更换重要账户密码</li>
              <li>• 使用密码管理器存储</li>
              <li>• 启用二次验证</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 说明文档 -->
      <div class="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-800 mb-2">使用说明：</h4>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• 使用加密安全的随机数生成器</li>
          <li>• 密码强度基于信息熵理论计算</li>
          <li>• 支持自定义字符集和复杂度规则</li>
          <li>• 提供多种预设模板快速生成</li>
          <li>• 所有生成过程在本地完成，保证安全性</li>
          <li>• 点击密码可直接选中复制</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PasswordTool',
  data() {
    return {
      passwordLength: 16,
      selectedCharsets: ['lowercase', 'uppercase', 'numbers', 'symbols'],
      excludeSimilar: false,
      excludeAmbiguous: false,
      mustIncludeAll: true,
      customChars: '',
      generateCount: 1,
      generatedPasswords: [],
      currentPassword: '',
      copiedIndex: -1,
      analyzedPassword: null,
      
      charsetOptions: [
        {
          key: 'lowercase',
          label: '小写字母',
          chars: 'abcdefghijklmnopqrstuvwxyz'
        },
        {
          key: 'uppercase',
          label: '大写字母',
          chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        },
        {
          key: 'numbers',
          label: '数字',
          chars: '0123456789'
        },
        {
          key: 'symbols',
          label: '特殊符号',
          chars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
        },
        {
          key: 'space',
          label: '空格',
          chars: ' '
        }
      ],
      
      passwordPresets: [
        {
          name: '标准强密码',
          description: '包含大小写字母、数字和符号的16位密码',
          length: 16,
          charsets: ['lowercase', 'uppercase', 'numbers', 'symbols'],
          excludeSimilar: true,
          mustIncludeAll: true
        },
        {
          name: '长密码',
          description: '24位超强密码',
          length: 24,
          charsets: ['lowercase', 'uppercase', 'numbers', 'symbols'],
          excludeSimilar: true,
          mustIncludeAll: true
        },
        {
          name: '简单密码',
          description: '仅包含字母和数字的12位密码',
          length: 12,
          charsets: ['lowercase', 'uppercase', 'numbers'],
          excludeSimilar: true,
          mustIncludeAll: true
        },
        {
          name: 'PIN码',
          description: '6位纯数字密码',
          length: 6,
          charsets: ['numbers'],
          excludeSimilar: false,
          mustIncludeAll: false
        },
        {
          name: '记忆友好',
          description: '排除易混淆字符的密码',
          length: 14,
          charsets: ['lowercase', 'uppercase', 'numbers'],
          excludeSimilar: true,
          excludeAmbiguous: true,
          mustIncludeAll: true
        },
        {
          name: '极简符号',
          description: '仅使用基本符号的密码',
          length: 16,
          charsets: ['lowercase', 'uppercase', 'numbers'],
          customChars: '!@#$%&*',
          mustIncludeAll: true
        }
      ]
    }
  },
  computed: {
    availableChars() {
      let chars = ''
      
      this.charsetOptions.forEach(charset => {
        if (this.selectedCharsets.includes(charset.key)) {
          chars += charset.chars
        }
      })
      
      if (this.customChars) {
        chars += this.customChars
      }
      
      if (this.excludeSimilar) {
        chars = chars.replace(/[0Ol1I]/g, '')
      }
      
      if (this.excludeAmbiguous) {
        chars = chars.replace(/[{}[\]()""]/g, '')
      }
      
      // 去重
      return [...new Set(chars)].join('')
    },
    
    passwordStrength() {
      if (!this.currentPassword) {
        return { score: 0, entropy: 0, crackTime: '' }
      }
      
      return this.calculatePasswordStrength(this.currentPassword)
    },
    
    strengthPercentage() {
      return Math.min(this.passwordStrength.score, 100)
    },
    
    strengthText() {
      const score = this.passwordStrength.score
      if (score < 30) return '弱'
      if (score < 60) return '中'
      if (score < 80) return '强'
      return '极强'
    },
    
    strengthClass() {
      const score = this.passwordStrength.score
      if (score < 30) return 'bg-red-50 border-red-200'
      if (score < 60) return 'bg-yellow-50 border-yellow-200'
      if (score < 80) return 'bg-blue-50 border-blue-200'
      return 'bg-green-50 border-green-200'
    },
    
    strengthTextClass() {
      const score = this.passwordStrength.score
      if (score < 30) return 'text-red-600'
      if (score < 60) return 'text-yellow-600'
      if (score < 80) return 'text-blue-600'
      return 'text-green-600'
    },
    
    strengthBarClass() {
      const score = this.passwordStrength.score
      if (score < 30) return 'bg-red-500'
      if (score < 60) return 'bg-yellow-500'
      if (score < 80) return 'bg-blue-500'
      return 'bg-green-500'
    }
  },
  methods: {
    generatePassword() {
      if (this.availableChars.length === 0) {
        this.generatedPasswords = []
        this.currentPassword = ''
        return
      }
      
      this.generatedPasswords = []
      
      for (let i = 0; i < this.generateCount; i++) {
        let password = ''
        let attempts = 0
        const maxAttempts = 100
        
        do {
          password = this.createRandomPassword()
          attempts++
        } while (
          this.mustIncludeAll && 
          !this.validatePasswordRequirements(password) && 
          attempts < maxAttempts
        )
        
        if (password) {
          this.generatedPasswords.push(password)
        }
      }
      
      if (this.generatedPasswords.length > 0) {
        this.currentPassword = this.generatedPasswords[0]
      }
    },
    
    createRandomPassword() {
      const chars = this.availableChars
      let password = ''
      
      // 使用加密安全的随机数生成
      const array = new Uint32Array(this.passwordLength)
      window.crypto.getRandomValues(array)
      
      for (let i = 0; i < this.passwordLength; i++) {
        password += chars[array[i] % chars.length]
      }
      
      return password
    },
    
    validatePasswordRequirements(password) {
      if (!this.mustIncludeAll) return true
      
      for (const charsetKey of this.selectedCharsets) {
        const charset = this.charsetOptions.find(c => c.key === charsetKey)
        if (charset) {
          const hasChar = [...charset.chars].some(char => 
            password.includes(char) && this.availableChars.includes(char)
          )
          if (!hasChar) return false
        }
      }
      
      return true
    },
    
    calculatePasswordStrength(password) {
      const length = password.length
      let charsetSize = 0
      
      // 计算字符集大小
      if (/[a-z]/.test(password)) charsetSize += 26
      if (/[A-Z]/.test(password)) charsetSize += 26
      if (/\d/.test(password)) charsetSize += 10
      if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) charsetSize += 32
      if (/\s/.test(password)) charsetSize += 1
      
      // 计算信息熵
      const entropy = length * Math.log2(charsetSize)
      
      // 基础得分
      let score = Math.min(entropy * 1.5, 100)
      
      // 长度加分
      if (length >= 12) score += 10
      if (length >= 16) score += 10
      if (length >= 20) score += 10
      
      // 复杂度加分
      let complexity = 0
      if (/[a-z]/.test(password)) complexity++
      if (/[A-Z]/.test(password)) complexity++
      if (/\d/.test(password)) complexity++
      if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) complexity++
      
      score += complexity * 5
      
      // 常见模式扣分
      if (/(.)\1{2,}/.test(password)) score -= 20 // 重复字符
      if (/123|abc|qwe/i.test(password)) score -= 20 // 连续字符
      if (/password|admin|user/i.test(password)) score -= 30 // 常见单词
      
      // 计算破解时间
      const combinations = Math.pow(charsetSize, length)
      const crackTime = this.calculateCrackTime(combinations)
      
      return {
        score: Math.max(0, Math.min(100, score)),
        entropy,
        crackTime
      }
    },
    
    calculateCrackTime(combinations) {
      // 假设每秒10亿次尝试
      const attemptsPerSecond = 1e9
      const seconds = combinations / (2 * attemptsPerSecond) // 平均需要尝试一半
      
      if (seconds < 60) return '< 1分钟'
      if (seconds < 3600) return `${Math.ceil(seconds / 60)}分钟`
      if (seconds < 86400) return `${Math.ceil(seconds / 3600)}小时`
      if (seconds < 31536000) return `${Math.ceil(seconds / 86400)}天`
      if (seconds < 31536000000) return `${Math.ceil(seconds / 31536000)}年`
      return '> 1000年'
    },
    
    analyzePassword(password) {
      const analysis = {
        password,
        length: password.length,
        types: [],
        charsetSize: 0
      }
      
      if (/[a-z]/.test(password)) {
        analysis.types.push('小写字母')
        analysis.charsetSize += 26
      }
      if (/[A-Z]/.test(password)) {
        analysis.types.push('大写字母')
        analysis.charsetSize += 26
      }
      if (/\d/.test(password)) {
        analysis.types.push('数字')
        analysis.charsetSize += 10
      }
      if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
        analysis.types.push('特殊符号')
        analysis.charsetSize += 32
      }
      if (/\s/.test(password)) {
        analysis.types.push('空格')
        analysis.charsetSize += 1
      }
      
      const combinations = Math.pow(analysis.charsetSize, analysis.length)
      analysis.combinations = combinations.toExponential(2)
      
      this.analyzedPassword = analysis
    },
    
    applyPreset(preset) {
      this.passwordLength = preset.length
      this.selectedCharsets = preset.charsets
      this.excludeSimilar = preset.excludeSimilar || false
      this.excludeAmbiguous = preset.excludeAmbiguous || false
      this.mustIncludeAll = preset.mustIncludeAll !== false
      this.customChars = preset.customChars || ''
      this.generatePassword()
    },
    
    async copyPassword(password, index) {
      try {
        await navigator.clipboard.writeText(password)
        this.copiedIndex = index
        setTimeout(() => {
          this.copiedIndex = -1
        }, 2000)
        this.showNotification('密码已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
        this.showNotification('复制失败', 'error')
      }
    },
    
    async copyAllPasswords() {
      try {
        const allPasswords = this.generatedPasswords.join('\n')
        await navigator.clipboard.writeText(allPasswords)
        this.showNotification('所有密码已复制到剪贴板')
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
  },
  mounted() {
    this.generatePassword()
  }
}
</script>
