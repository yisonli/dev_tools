export const templates = [
  {
    "name": "用户对象",
    "text": "{\n  \"id\": 1,\n  \"name\": \"张三\",\n  \"email\": \"zhangsan@example.com\",\n  \"age\": 30,\n  \"city\": \"北京\"\n}"
  },
  {
    "name": "用户列表",
    "text": "[\n  {\n    \"id\": 1,\n    \"name\": \"张三\",\n    \"email\": \"zhangsan@example.com\"\n  },\n  {\n    \"id\": 2,\n    \"name\": \"李四\",\n    \"email\": \"lisi@example.com\"\n  }\n]"
  },
  {
    "name": "API响应",
    "text": "{\n  \"status\": \"success\",\n  \"code\": 200,\n  \"message\": \"操作成功\",\n  \"data\": {\n    \"users\": [],\n    \"total\": 0,\n    \"page\": 1,\n    \"pageSize\": 10\n  }\n}"
  },
  {
    "name": "配置文件",
    "text": "{\n  \"app\": {\n    \"name\": \"MyApp\",\n    \"version\": \"1.0.0\",\n    \"debug\": true\n  },\n  \"database\": {\n    \"host\": \"localhost\",\n    \"port\": 3306,\n    \"username\": \"root\",\n    \"password\": \"password\"\n  }\n}"
  }
]
export const example = "{\n  \"name\": \"开发者工具集合\",\n  \"version\": \"1.0.0\",\n  \"tools\": [\n    {\n      \"name\": \"BASE64\",\n      \"category\": \"编码\"\n    },\n    {\n      \"name\": \"AES\",\n      \"category\": \"加密\"\n    },\n    {\n      \"name\": \"JSON\",\n      \"category\": \"格式化\"\n    }\n  ],\n  \"config\": {\n    \"theme\": \"light\",\n    \"language\": \"zh-CN\"\n  }\n}"
