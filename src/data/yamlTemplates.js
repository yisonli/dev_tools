export const templates = [
  {
    "name": "Spring Boot",
    "text": "server:\n  port: 8080\n  servlet:\n    context-path: /api\n\nspring:\n  application:\n    name: my-app\n  datasource:\n    url: jdbc:mysql://localhost:3306/mydb\n    username: root\n    password: password\n  jpa:\n    hibernate:\n      ddl-auto: update\n    show-sql: true\n\nlogging:\n  level:\n    root: INFO\n    com.example: DEBUG"
  },
  {
    "name": "Docker Compose",
    "text": "version: '3.8'\n\nservices:\n  web:\n    image: nginx:alpine\n    ports:\n      - \"80:80\"\n    volumes:\n      - ./html:/usr/share/nginx/html\n    depends_on:\n      - api\n\n  api:\n    build: .\n    ports:\n      - \"3000:3000\"\n    environment:\n      - NODE_ENV=production\n      - DB_HOST=db\n    depends_on:\n      - db\n\n  db:\n    image: mysql:8.0\n    environment:\n      MYSQL_ROOT_PASSWORD: password\n      MYSQL_DATABASE: myapp\n    volumes:\n      - db_data:/var/lib/mysql\n\nvolumes:\n  db_data:"
  },
  {
    "name": "GitHub Actions",
    "text": "name: CI/CD Pipeline\n\non:\n  push:\n    branches: [ main, develop ]\n  pull_request:\n    branches: [ main ]\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    \n    steps:\n    - uses: actions/checkout@v3\n    \n    - name: Setup Node.js\n      uses: actions/setup-node@v3\n      with:\n        node-version: '18'\n        cache: 'npm'\n    \n    - name: Install dependencies\n      run: npm ci\n    \n    - name: Run tests\n      run: npm test\n    \n    - name: Build\n      run: npm run build"
  },
  {
    "name": "Kubernetes",
    "text": "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app\n  labels:\n    app: my-app\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: my-app\n  template:\n    metadata:\n      labels:\n        app: my-app\n    spec:\n      containers:\n      - name: my-app\n        image: my-app:latest\n        ports:\n        - containerPort: 8080\n        env:\n        - name: DB_HOST\n          value: \"mysql-service\"\n        resources:\n          limits:\n            memory: \"512Mi\"\n            cpu: \"500m\"\n          requests:\n            memory: \"256Mi\"\n            cpu: \"250m\"\n\n---\napiVersion: v1\nkind: Service\nmetadata:\n  name: my-app-service\nspec:\n  selector:\n    app: my-app\n  ports:\n    - protocol: TCP\n      port: 80\n      targetPort: 8080\n  type: LoadBalancer"
  }
]
export const example = "# 示例配置文件\napp:\n  name: \"开发者工具集合\"\n  version: \"1.0.0\"\n  debug: true\n\nserver:\n  host: \"localhost\"\n  port: 3000\n  ssl:\n    enabled: false\n    cert: \"\"\n    key: \"\"\n\ndatabase:\n  type: \"mysql\"\n  host: \"localhost\"\n  port: 3306\n  name: \"myapp\"\n  credentials:\n    username: \"root\"\n    password: \"password\"\n\nfeatures:\n  - name: \"BASE64编码\"\n    enabled: true\n  - name: \"AES加密\"\n    enabled: true\n  - name: \"JSON校验\"\n    enabled: true\n\nlogging:\n  level: \"info\"\n  output: \"console\"\n  formats:\n    - \"json\"\n    - \"text\""
