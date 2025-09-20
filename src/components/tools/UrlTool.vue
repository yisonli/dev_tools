<template>
  <div class="max-w-4xl mx-auto">
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-2">URL 编码/解码</h2>
        <p class="text-gray-600">
          URL编码将特殊字符转换为%XX格式，用于在URL中安全传输数据。支持标准编码和组件编码。
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 编码部分 -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-700">URL编码</h3>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              原始文本
            </label>
            <textarea
              v-model="rawText"
              placeholder="请输入要编码的URL或文本..."
              class="textarea-field h-32"
              @input="encodeText"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              编码类型
            </label>
            <div class="flex space-x-4">
              <label class="flex items-center">
                <input
                  type="radio"
                  v-model="encodeType"
                  value="component"
                  @change="encodeText"
                  class="mr-2"
                />
                组件编码 (推荐)
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  v-model="encodeType"
                  value="uri"
                  @change="encodeText"
                  class="mr-2"
                />
                URI编码
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              编码结果
            </label>
            <textarea
              v-model="encodedText"
              readonly
              class="textarea-field h-32 bg-gray-50 font-mono text-sm"
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
          <h3 class="text-lg font-semibold text-gray-700">URL解码</h3>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              编码文本
            </label>
            <textarea
              v-model="encodedForDecode"
              placeholder="请输入要解码的URL编码文本..."
              class="textarea-field h-32 font-mono text-sm"
              @input="decodeText"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              解码类型
            </label>
            <div class="flex space-x-4">
              <label class="flex items-center">
                <input
                  type="radio"
                  v-model="decodeType"
                  value="component"
                  @change="decodeText"
                  class="mr-2"
                />
                组件解码 (推荐)
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  v-model="decodeType"
                  value="uri"
                  @change="decodeText"
                  class="mr-2"
                />
                URI解码
              </label>
            </div>
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

      <!-- URL解析工具 -->
      <div class="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">URL解析工具</h3>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            完整URL
          </label>
          <input
            v-model="fullUrl"
            type="text"
            placeholder="https://example.com/path?param1=value1&param2=value2#fragment"
            class="input-field"
            @input="parseUrl"
          />
        </div>

        <div v-if="urlParts && Object.keys(urlParts).length > 0" class="mt-4 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="(value, key) in urlParts" :key="key" class="space-y-1">
              <label class="block text-sm font-medium text-gray-600">
                {{ getUrlPartLabel(key) }}
              </label>
              <div class="p-2 bg-white border rounded text-sm font-mono break-all">
                {{ value || '(空)' }}
              </div>
            </div>
          </div>

          <!-- 查询参数详细展示 -->
          <div v-if="queryParams && Object.keys(queryParams).length > 0" class="mt-4">
            <h4 class="font-medium text-gray-700 mb-2">查询参数详情</h4>
            <div class="bg-white border rounded overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="px-3 py-2 text-left font-medium">参数名</th>
                    <th class="px-3 py-2 text-left font-medium">参数值</th>
                    <th class="px-3 py-2 text-left font-medium">URL解码值</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(value, key) in queryParams" :key="key" class="border-t">
                    <td class="px-3 py-2 font-mono">{{ key }}</td>
                    <td class="px-3 py-2 font-mono break-all">{{ value }}</td>
                    <td class="px-3 py-2 break-all">{{ decodeURIComponent(value) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- 常用编码示例 -->
      <div class="mt-8">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">常用编码示例</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="example in examples"
            :key="example.original"
            class="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            @click="useExample(example)"
          >
            <div class="text-sm font-medium text-gray-700 mb-1">{{ example.description }}</div>
            <div class="text-xs text-gray-600 mb-1 break-all">原文: {{ example.original }}</div>
            <div class="text-xs text-blue-600 font-mono break-all">编码: {{ example.encoded }}</div>
          </div>
        </div>
      </div>

      <!-- 说明文档 -->
      <div class="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-800 mb-2">使用说明：</h4>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• <strong>encodeURIComponent</strong>: 编码所有特殊字符，适用于URL参数值</li>
          <li>• <strong>encodeURI</strong>: 保留URL结构字符(:/?#[]@)，适用于完整URL</li>
          <li>• 中文字符会被编码为UTF-8字节序列的%XX形式</li>
          <li>• URL解析工具可以分解完整URL的各个部分</li>
          <li>• 点击示例可以快速填入对应的内容进行测试</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UrlTool',
  data() {
    return {
      rawText: '',
      encodedText: '',
      encodeType: 'component',
      
      encodedForDecode: '',
      decodedText: '',
      decodeType: 'component',
      decodeError: '',
      
      fullUrl: '',
      urlParts: {},
      queryParams: {},
      
      examples: [
        {
          description: '中文字符',
          original: '你好世界',
          encoded: '%E4%BD%A0%E5%A5%BD%E4%B8%96%E7%95%8C'
        },
        {
          description: '空格字符',
          original: 'hello world',
          encoded: 'hello%20world'
        },
        {
          description: '特殊符号',
          original: 'name=张三&age=25',
          encoded: 'name%3D%E5%BC%A0%E4%B8%89%26age%3D25'
        },
        {
          description: '邮箱地址',
          original: 'test@example.com',
          encoded: 'test%40example.com'
        },
        {
          description: 'JSON字符串',
          original: '{"name":"张三"}',
          encoded: '%7B%22name%22%3A%22%E5%BC%A0%E4%B8%89%22%7D'
        },
        {
          description: '路径分隔符',
          original: 'path/to/file',
          encoded: 'path%2Fto%2Ffile'
        }
      ]
    }
  },
  methods: {
    encodeText() {
      try {
        if (this.rawText) {
          if (this.encodeType === 'component') {
            this.encodedText = encodeURIComponent(this.rawText)
          } else {
            this.encodedText = encodeURI(this.rawText)
          }
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
          if (this.decodeType === 'component') {
            this.decodedText = decodeURIComponent(this.encodedForDecode)
          } else {
            this.decodedText = decodeURI(this.encodedForDecode)
          }
        } else {
          this.decodedText = ''
        }
      } catch (error) {
        console.error('解码错误:', error)
        this.decodeError = '解码失败：请检查输入的URL编码格式是否正确'
        this.decodedText = ''
      }
    },
    
    parseUrl() {
      try {
        if (!this.fullUrl) {
          this.urlParts = {}
          this.queryParams = {}
          return
        }
        
        const url = new URL(this.fullUrl)
        
        this.urlParts = {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port,
          pathname: url.pathname,
          search: url.search,
          hash: url.hash,
          host: url.host,
          origin: url.origin
        }
        
        // 解析查询参数
        this.queryParams = {}
        url.searchParams.forEach((value, key) => {
          this.queryParams[key] = value
        })
        
      } catch (error) {
        console.error('URL解析错误:', error)
        this.urlParts = { error: '无效的URL格式' }
        this.queryParams = {}
      }
    },
    
    getUrlPartLabel(key) {
      const labels = {
        protocol: '协议',
        hostname: '主机名',
        port: '端口',
        pathname: '路径',
        search: '查询字符串',
        hash: '片段标识符',
        host: '主机',
        origin: '源',
        error: '错误'
      }
      return labels[key] || key
    },
    
    useExample(example) {
      this.rawText = example.original
      this.encodedForDecode = example.encoded
      this.encodeText()
      this.decodeText()
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
