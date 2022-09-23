# new-project

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

```
H5AwakenApp
├─ .gitignore // git提交忽略配置
├─ babel.config.js
├─ jsconfig.json
├─ package-lock.json
├─ package.json // 项目配置
├─ public
│  └─ index.html
├─ README.md
├─ src
│  ├─ App.vue
│  ├─ assets
│  │  ├─ image // 项目内图片资源
│  │  ├─ home.css // 主页样式文件，由 home.scss 打包生成
│  │  ├─ home.min.css
│  │  ├─ home.scss
│  │  ├─ login.css
│  │  ├─ login.min.css
│  │  ├─ login.scss // 登录页样式文件，由 login.scss 打包生成
│  │  └─ vant.css // vant 组件框架样式文件
│  ├─ main.js // 项目js入口文件
│  ├─ plugins // 插件
│  │  └─ axios.js
│  ├─ router
│  │  └─ index.js
│  ├─ store
│  │  └─ index.js // vuex状态管理保存的公用逻辑
│  ├─ utils
│  └─ views
│     ├─ home.vue // 主页核心代码
│     └─ login.vue // 登录页核心代码
└─ vue.config.js

```



前置条件：在linux环境内，已安装docker

1、首先进入宿主机终端命令行 启动docker

service docker start


2、安装Nginx

①拉取官方的最新版本的镜像
docker pull nginx:latest

②使用以下命令来查看是否已安装了 nginx：
docker images

③安装完成后，使用以下命令来运行 nginx 容器：
docker run --name nginx-test -p 8080:80 -d nginx

常用参数说明：
–NAME NGINX-TEST：容器名称。
-P 8080:80： 端口进行映射，将本地 8080 端口映射到容器内部的 80 端口。
-D NGINX： 设置容器在在后台一直运行。

3、安装node

①启动docker服务
systemctl start docker

②获取node最新镜像
docker pull node:latest

③查询拉取状态
docker images

④运行镜像
docker run -i -t node /bin/bash

常用参数说明：
-i：容器的标准输入保持打开
-t：让docker分配一个伪终端并绑定到容器的标准输入上
-p : 端口映射 格式为[主机端口：容器端口]
-d : 后台模式运行
-name : 给容器的起一个名字
-v：挂载主机的目录

⑤查看node版本号
node -v

4、安装vue-cli
npm install -g @vue/cli

5、进入h5项目根目录后安装相关依赖
npm install

6、将项目打包（项目根目录会生成一个dist文件夹，内部包含 Dockerfile 配置文件）
npm run build

7、基于 Dockerfile 配置文件构建 Vue 应用镜像（注意不要少了最后的 “.” ）
docker build -t vue-h5 .

8、查看镜像
docker image ls | grep vue-h5

9、基于 vue-h5 镜像启动 vueApp 容器
docker run -p 3000:80 -d --name vueApp vue-h5

常用参数说明：
-p 3000:80 端口映射，将宿主的3000端口映射到容器的80端口
-d 后台方式运行
–name 容器名

10、查看 Docker 进程
docker ps
