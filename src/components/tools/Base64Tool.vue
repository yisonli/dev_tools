<template>
  <div class="max-w-4xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">BASE64 编码/解码</h2>
        <p class="text-gray-600">
          BASE64是一种基于64个可打印字符来表示二进制数据的编码方法，常用于在网络传输中编码二进制数据。
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 编码部分 -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">编码</h3>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              原始文本
            </label>
            <textarea
              v-model="rawText"
              placeholder="请输入要编码的文本..."
              class="textarea-field h-32"
              @input="encodeText"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              BASE64编码结果
            </label>
            <textarea
              v-model="encodedText"
              readonly
              class="textarea-field h-32 bg-gray-50"
              placeholder="编码结果将显示在这里..."
            ></textarea>
          </div>

          <div class="flex space-x-2">
            <button
              @click="copyEncoded"
              class="btn btn-primary flex items-center"
              :disabled="!encodedText"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              复制编码结果
            </button>
            <button
              @click="clearEncode"
              class="btn btn-secondary"
            >
              清空
            </button>
          </div>
        </div>

        <!-- 解码部分 -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">解码</h3>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              BASE64编码文本
            </label>
            <textarea
              v-model="encodedForDecode"
              placeholder="请输入要解码的BASE64文本..."
              class="textarea-field h-32"
              @input="decodeText"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              解码结果
            </label>
            <textarea
              v-model="decodedText"
              readonly
              class="textarea-field h-32 bg-gray-50"
              placeholder="解码结果将显示在这里..."
            ></textarea>
          </div>

          <div v-if="decodeError" class="text-red-600 text-sm">
            {{ decodeError }}
          </div>

          <div class="flex space-x-2">
            <button
              @click="copyDecoded"
              class="btn btn-primary flex items-center"
              :disabled="!decodedText"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              复制解码结果
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

      <!-- 说明文档 -->
      <div class="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-800 mb-2">使用说明：</h4>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• BASE64编码将任意数据转换为由A-Z、a-z、0-9、+、/ 组成的字符串</li>
          <li>• 编码后的数据长度会增加约33%</li>
          <li>• 支持中文及特殊字符的编码解码</li>
          <li>• 所有操作在本地完成，数据不会发送到服务器</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Base64Tool',
  data() {
    return {
      rawText: '',
      encodedText: '',
      encodedForDecode: '',
      decodedText: '',
      decodeError: ''
    }
  },
  methods: {
    encodeText() {
      try {
        if (this.rawText) {
          // 使用 btoa 和 encodeURIComponent 来正确处理中文
          this.encodedText = btoa(unescape(encodeURIComponent(this.rawText)))
        } else {
          this.encodedText = ''
        }
      } catch (error) {
        console.error('编码错误:', error)
        this.encodedText = '编码失败'
      }
    },
    
    decodeText() {
      try {
        this.decodeError = ''
        if (this.encodedForDecode) {
          // 使用 atob 和 decodeURIComponent 来正确处理中文
          this.decodedText = decodeURIComponent(escape(atob(this.encodedForDecode)))
        } else {
          this.decodedText = ''
        }
      } catch (error) {
        console.error('解码错误:', error)
        this.decodeError = '解码失败：请检查输入的BASE64格式是否正确'
        this.decodedText = ''
      }
    },
    
    async copyEncoded() {
      try {
        await navigator.clipboard.writeText(this.encodedText)
        this.showNotification('编码结果已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
      }
    },
    
    async copyDecoded() {
      try {
        await navigator.clipboard.writeText(this.decodedText)
        this.showNotification('解码结果已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
      }
    },
    
    clearEncode() {
      this.rawText = ''
      this.encodedText = ''
    },
    
    clearDecode() {
      this.encodedForDecode = ''
      this.decodedText = ''
      this.decodeError = ''
    },
    
    showNotification(message) {
      // 简单的通知实现
      const notification = document.createElement('div')
      notification.textContent = message
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      document.body.appendChild(notification)
      
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 2000)
    }
  }
}
</script>
