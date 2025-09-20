<template>
  <div class="max-w-6xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Unicode 编码转换</h2>
        <p class="text-gray-600">
          支持多种字符编码转换：Unicode、UTF-8、HTML实体、URL编码等，支持不同进制格式显示。
        </p>
      </div>

      <!-- 主要转换区域 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- 字符转编码 -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">字符 → 编码</h3>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              原始字符
            </label>
            <textarea
              v-model="originalText"
              placeholder="请输入要转换的字符..."
              class="textarea-field h-24"
              @input="encodeText"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Unicode (\\uXXXX)
              </label>
              <textarea
                v-model="unicodeResult"
                readonly
                class="textarea-field h-20 bg-gray-50 font-mono text-sm"
                placeholder="Unicode编码结果..."
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Unicode (&#XXXX;)
              </label>
              <textarea
                v-model="htmlEntityResult"
                readonly
                class="textarea-field h-20 bg-gray-50 font-mono text-sm"
                placeholder="HTML实体编码..."
              ></textarea>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                UTF-8 字节
              </label>
              <textarea
                v-model="utf8Result"
                readonly
                class="textarea-field h-20 bg-gray-50 font-mono text-sm"
                placeholder="UTF-8字节序列..."
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                URL 编码
              </label>
              <textarea
                v-model="urlResult"
                readonly
                class="textarea-field h-20 bg-gray-50 font-mono text-sm"
                placeholder="URL编码结果..."
              ></textarea>
            </div>
          </div>

          <div class="flex space-x-2">
            <button
              @click="copyAllEncoded"
              class="btn btn-primary"
              :disabled="!originalText"
            >
              复制所有编码
            </button>
            <button
              @click="clearEncode"
              class="btn btn-secondary"
            >
              清空
            </button>
          </div>
        </div>

        <!-- 编码转字符 -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">编码 → 字符</h3>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              编码类型
            </label>
            <select v-model="decodeType" class="input-field">
              <option value="unicode">Unicode (\\uXXXX)</option>
              <option value="html">HTML实体 (&#XXXX;)</option>
              <option value="utf8">UTF-8字节</option>
              <option value="url">URL编码</option>
              <option value="hex">十六进制</option>
              <option value="binary">二进制</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              编码内容
            </label>
            <textarea
              v-model="encodedInput"
              :placeholder="getDecodePlaceholder()"
              class="textarea-field h-24 font-mono text-sm"
              @input="decodeText"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              解码结果
            </label>
            <textarea
              v-model="decodedResult"
              readonly
              class="textarea-field h-24 bg-gray-50"
              placeholder="解码结果将显示在这里..."
            ></textarea>
          </div>

          <div v-if="decodeError" class="text-red-600 text-sm">
            {{ decodeError }}
          </div>

          <div class="flex space-x-2">
            <button
              @click="copyDecoded"
              class="btn btn-primary"
              :disabled="!decodedResult"
            >
              复制结果
            </button>
            <button
              @click="clearDecode"
              class="btn btn-secondary"
            >
              清空
            </button>
          </div>
        </div>
      </div>

      <!-- 字符信息分析 -->
      <div class="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">字符分析</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              单个字符分析
            </label>
            <input
              v-model="analyzeChar"
              type="text"
              placeholder="输入单个字符进行分析"
              class="input-field"
              maxlength="2"
              @input="analyzeCharacter"
            />
          </div>
          <div v-if="charInfo.char" class="space-y-2">
            <div class="text-sm">
              <span class="font-medium">字符：</span>{{ charInfo.char }}
            </div>
            <div class="text-sm">
              <span class="font-medium">Unicode：</span>{{ charInfo.unicode }}
            </div>
            <div class="text-sm">
              <span class="font-medium">码点：</span>{{ charInfo.codePoint }}
            </div>
            <div class="text-sm">
              <span class="font-medium">UTF-8：</span>{{ charInfo.utf8 }}
            </div>
          </div>
        </div>
      </div>

      <!-- 常用字符表 -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">常用字符参考</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            v-for="category in charCategories"
            :key="category.name"
            class="p-3 bg-gray-50 rounded-lg"
          >
            <h4 class="font-medium text-gray-700 mb-2">{{ category.name }}</h4>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="char in category.chars"
                :key="char"
                @click="insertChar(char)"
                class="p-1 text-center bg-white rounded hover:bg-blue-100 transition-colors text-sm"
                :title="`${char} (U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`"
              >
                {{ char }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 批量转换 -->
      <div class="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-800 mb-3">批量转换</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-blue-700 mb-2">
              输入文本
            </label>
            <textarea
              v-model="batchInput"
              placeholder="输入要批量转换的文本..."
              class="textarea-field h-20"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-blue-700 mb-2">
              转换格式
            </label>
            <select v-model="batchFormat" class="input-field mb-2">
              <option value="unicode">Unicode编码</option>
              <option value="html">HTML实体</option>
              <option value="utf8">UTF-8字节</option>
              <option value="url">URL编码</option>
            </select>
            <button @click="batchConvert" class="btn btn-primary w-full">
              批量转换
            </button>
          </div>
        </div>
        <div v-if="batchResult" class="mt-4">
          <label class="block text-sm font-medium text-blue-700 mb-2">
            转换结果
          </label>
          <textarea
            v-model="batchResult"
            readonly
            class="textarea-field h-20 bg-white font-mono text-sm"
          ></textarea>
        </div>
      </div>

      <!-- 说明文档 -->
      <div class="p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-800 mb-2">使用说明：</h4>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• Unicode编码：\\uXXXX 格式，用于JavaScript、JSON等</li>
          <li>• HTML实体：&#XXXX; 格式，用于HTML页面显示特殊字符</li>
          <li>• UTF-8字节：字符的UTF-8编码字节序列</li>
          <li>• URL编码：%XX 格式，用于URL参数传递</li>
          <li>• 支持中文、特殊符号、Emoji等所有Unicode字符</li>
          <li>• 可点击常用字符快速插入，支持批量转换</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UnicodeTool',
  data() {
    return {
      originalText: '',
      unicodeResult: '',
      htmlEntityResult: '',
      utf8Result: '',
      urlResult: '',
      
      decodeType: 'unicode',
      encodedInput: '',
      decodedResult: '',
      decodeError: '',
      
      analyzeChar: '',
      charInfo: {},
      
      batchInput: '',
      batchFormat: 'unicode',
      batchResult: '',
      
      charCategories: [
        {
          name: '标点符号',
          chars: ['！', '？', '。', '，', '、', '；', '：', '\u201c', '\u201d', '\u2018', '\u2019']
        },
        {
          name: '数学符号',
          chars: ['±', '×', '÷', '≈', '≠', '≤', '≥', '∞', '°', '√', '²', '³']
        },
        {
          name: '货币符号',
          chars: ['$', '€', '£', '¥', '¢', '₹', '₽', '₩', '₪', '₦', '₨', '₡']
        },
        {
          name: '箭头符号',
          chars: ['←', '→', '↑', '↓', '↖', '↗', '↘', '↙', '⇐', '⇒', '⇑', '⇓']
        },
        {
          name: '特殊字符',
          chars: ['©', '®', '™', '§', '¶', '†', '‡', '•', '‰', '‱', '′', '″']
        },
        {
          name: 'Emoji',
          chars: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃']
        }
      ]
    }
  },
  methods: {
    encodeText() {
      if (!this.originalText) {
        this.unicodeResult = ''
        this.htmlEntityResult = ''
        this.utf8Result = ''
        this.urlResult = ''
        return
      }
      
      try {
        // Unicode编码 \\uXXXX
        this.unicodeResult = this.originalText
          .split('')
          .map(char => '\\u' + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'))
          .join('')
        
        // HTML实体编码 &#XXXX;
        this.htmlEntityResult = this.originalText
          .split('')
          .map(char => '&#' + char.charCodeAt(0) + ';')
          .join('')
        
        // UTF-8字节
        const utf8Bytes = new TextEncoder().encode(this.originalText)
        this.utf8Result = Array.from(utf8Bytes)
          .map(byte => byte.toString(16).toUpperCase().padStart(2, '0'))
          .join(' ')
        
        // URL编码
        this.urlResult = encodeURIComponent(this.originalText)
        
      } catch (error) {
        console.error('编码错误:', error)
      }
    },
    
    getDecodePlaceholder() {
      const placeholders = {
        unicode: '\\u4F60\\u597D 或 \\u4f60\\u597d',
        html: '&#20320;&#22909; 或 &#x4F60;&#x597D;',
        utf8: 'E4 BD A0 E5 A5 BD',
        url: '%E4%BD%A0%E5%A5%BD',
        hex: '4F60 597D',
        binary: '0100111101100000 0101100101111101'
      }
      return placeholders[this.decodeType] || '请输入编码内容'
    },
    
    decodeText() {
      if (!this.encodedInput) {
        this.decodedResult = ''
        this.decodeError = ''
        return
      }
      
      try {
        this.decodeError = ''
        
        switch (this.decodeType) {
          case 'unicode':
            this.decodedResult = this.decodeUnicode(this.encodedInput)
            break
          case 'html':
            this.decodedResult = this.decodeHtmlEntity(this.encodedInput)
            break
          case 'utf8':
            this.decodedResult = this.decodeUtf8(this.encodedInput)
            break
          case 'url':
            this.decodedResult = decodeURIComponent(this.encodedInput)
            break
          case 'hex':
            this.decodedResult = this.decodeHex(this.encodedInput)
            break
          case 'binary':
            this.decodedResult = this.decodeBinary(this.encodedInput)
            break
        }
      } catch (error) {
        console.error('解码错误:', error)
        this.decodeError = '解码失败：' + error.message
        this.decodedResult = ''
      }
    },
    
    decodeUnicode(input) {
      return input.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
        return String.fromCharCode(parseInt(code, 16))
      })
    },
    
    decodeHtmlEntity(input) {
      return input
        .replace(/&#x([0-9a-fA-F]+);/g, (match, code) => {
          return String.fromCharCode(parseInt(code, 16))
        })
        .replace(/&#(\d+);/g, (match, code) => {
          return String.fromCharCode(parseInt(code, 10))
        })
    },
    
    decodeUtf8(input) {
      const bytes = input.split(/\s+/).map(hex => parseInt(hex, 16))
      const uint8Array = new Uint8Array(bytes)
      return new TextDecoder().decode(uint8Array)
    },
    
    decodeHex(input) {
      const codes = input.split(/\s+/)
      return codes.map(code => String.fromCharCode(parseInt(code, 16))).join('')
    },
    
    decodeBinary(input) {
      const codes = input.split(/\s+/)
      return codes.map(binary => String.fromCharCode(parseInt(binary, 2))).join('')
    },
    
    analyzeCharacter() {
      if (!this.analyzeChar) {
        this.charInfo = {}
        return
      }
      
      const char = this.analyzeChar.charAt(0)
      const codePoint = char.charCodeAt(0)
      
      this.charInfo = {
        char: char,
        unicode: '\\u' + codePoint.toString(16).toUpperCase().padStart(4, '0'),
        codePoint: `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')} (${codePoint})`,
        utf8: Array.from(new TextEncoder().encode(char))
          .map(byte => byte.toString(16).toUpperCase().padStart(2, '0'))
          .join(' ')
      }
    },
    
    insertChar(char) {
      this.originalText += char
      this.encodeText()
    },
    
    batchConvert() {
      if (!this.batchInput) {
        this.batchResult = ''
        return
      }
      
      try {
        switch (this.batchFormat) {
          case 'unicode':
            this.batchResult = this.batchInput
              .split('')
              .map(char => '\\u' + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'))
              .join('')
            break
          case 'html':
            this.batchResult = this.batchInput
              .split('')
              .map(char => '&#' + char.charCodeAt(0) + ';')
              .join('')
            break
          case 'utf8':
            const utf8Bytes = new TextEncoder().encode(this.batchInput)
            this.batchResult = Array.from(utf8Bytes)
              .map(byte => byte.toString(16).toUpperCase().padStart(2, '0'))
              .join(' ')
            break
          case 'url':
            this.batchResult = encodeURIComponent(this.batchInput)
            break
        }
      } catch (error) {
        console.error('批量转换错误:', error)
        this.batchResult = '转换失败：' + error.message
      }
    },
    
    async copyAllEncoded() {
      const result = `Unicode: ${this.unicodeResult}\nHTML实体: ${this.htmlEntityResult}\nUTF-8: ${this.utf8Result}\nURL编码: ${this.urlResult}`
      try {
        await navigator.clipboard.writeText(result)
        this.showNotification('所有编码结果已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
      }
    },
    
    async copyDecoded() {
      try {
        await navigator.clipboard.writeText(this.decodedResult)
        this.showNotification('解码结果已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
      }
    },
    
    clearEncode() {
      this.originalText = ''
      this.unicodeResult = ''
      this.htmlEntityResult = ''
      this.utf8Result = ''
      this.urlResult = ''
    },
    
    clearDecode() {
      this.encodedInput = ''
      this.decodedResult = ''
      this.decodeError = ''
    },
    
    showNotification(message) {
      const notification = document.createElement('div')
      notification.textContent = message
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 2000)
    }
  },
  mounted() {
    // 设置初始示例
    this.originalText = '你好世界！Hello World! 🌍'
    this.encodeText()
  }
}
</script>
