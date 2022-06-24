# H5项目

## 技术说明

### 技术栈
#### 核心技术栈：JavaScript + CSS3 + HTML5
#### 核心框架：Vue3.0 + vue-route4.0 + vuex4.0
#### UI框架：vant3.4.9
#### 其他依赖：axios、qs、core-js

### 环境版本
#### Node版本：v14.17.3
#### npm版本：v6.14.13

## 运行
### 在源码根目录安装依赖
```
npm install
```
### 在源码根目录运行项目（项目运行端口：8080）
```
npm run serve
```

## 打包
### 在源码根目录安装依赖
```
npm install
```
### 在源码根目录打包项目
打包成功后，项目根目录下会生成 dist 文件夹，内部包含 default.conf 和 Dockerfile 配置文件，如需调整，请自行根据部署规则更改
```
npm run build
```

## 部署
### 1、直接把前端包扔到服务器
#### 将项目打包生成的 dist 文件夹内所有文件复制到将要部署的位置的根目录下。

### 2、使用docker部署前端项目

#### 1、首先进入宿主机终端命令行 启动docker
```
service docker start
```


#### 2、安装Nginx

##### ①拉取官方的最新版本的镜像
```
docker pull nginx:latest
```

##### ②使用以下命令来查看是否已安装了 nginx：
```
docker images
```

##### ③安装完成后，使用以下命令来运行 nginx 容器：
```
docker run --name nginx-test -p 8080:80 -d nginx
```

常用参数说明：
–NAME NGINX-TEST：容器名称。
-P 8080:80： 端口进行映射，将本地 8080 端口映射到容器内部的 80 端口。
-D NGINX： 设置容器在在后台一直运行。

#### 3、安装node

##### ①启动docker服务
```
systemctl start docker
```

##### ②获取node最新镜像
```
docker pull node:latest
```

##### ③查询拉取状态
```
docker images
```

##### ④运行镜像
```
docker run -i -t node /bin/bash
```

常用参数说明：
-i：容器的标准输入保持打开
-t：让docker分配一个伪终端并绑定到容器的标准输入上
-p : 端口映射 格式为[主机端口：容器端口]
-d : 后台模式运行
-name : 给容器的起一个名字
-v：挂载主机的目录

##### ⑤查看node版本号
```
node -v
```

#### 4、安装vue-cli
```
npm install -g @vue/cli
```

#### 5、进入h5项目根目录后安装相关依赖
```
npm install
```

#### 6、将项目打包（项目根目录会生成一个dist文件夹，内部包含 Dockerfile 配置文件）
```
npm run build
```

#### 7、基于 Dockerfile 配置文件构建 Vue 应用镜像（注意不要少了最后的 “.” ）
```
docker build -t vue-h5 .
```

#### 8、查看镜像
```
docker image ls | grep vue-h5
```

#### 9、基于 vue-h5 镜像启动 vueApp 容器
```
docker run -p 3000:80 -d --name vueApp vue-h5
```

常用参数说明：
-p 3000:80 端口映射，将宿主的3000端口映射到容器的80端口
-d 后台方式运行
–name 容器名

#### 10、查看 Docker 进程
```
docker ps
```

## 修改静态资源
### 1、更改后台接口请求地址
在项目源码的 src/plugins/axios.js 内，替换 baseRoot、businessRoot 即可，替换后需重新打包部署
### 2、更改图片及其他配置
在项目源码的 src/public/assets/config.json 内，可修改相关配置。修改后请重新打包部署

#### assets文件结构

```
├─ public
│  ├─ assets
│  │  ├─ images
│  │  │    ├─ banner-1.png
│  │  │    ├─ banner-2.png
│  │  │    ├─ banner-3.png
│  │  │    ├─ banner-4.png
│  │  │    ├─ open_app_mask.png
│  │  │    └─ favicon.ico // 浏览器标题icon
│  │  └─ config.json // 配置文件
│  ├─ ...
│  ├─ ...
```

#### config.json 配置文件
```
{
    "status": 200,
    "data": {
        "home": {
            "maxFileLength": 9, // 图片展示的数量配置字段，值为负数则全部展示
            "bannerList": [
                "assets/images/banner-1.png", // banner图1的地址，此处是从src/public/assets/images内取banner-1.png，它也支持使用全路径（网络图片：http://xxxx）
                "assets/images/banner-2.png",
                "assets/images/banner-3.png",
                "assets/images/banner-4.png"
            ],
            "open_app_mask": "/assets/images/open_app_mask.png" // 微信内“打开APP”按钮展示的弹窗背景图
        }
    }
}
```