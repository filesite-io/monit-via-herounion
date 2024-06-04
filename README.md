# monit-via-herounion

Website monitor via HeroUnion.
基于HeroUnion的网站监控程序。


## 使用方法

1. 下载源码：
```
git clone "https://git.filesite.io/filesite/monit-via-herounion.git"
```

2. 安装node依赖包
```
npm install
```

3. 配置需要监控的网站

修改文件：conf/config.json

在**monit_urls**里添加网址，例如：
```
"https://tajian.tv",
"https://filesite.io"
```

4. 启动监控程序
```
npm start
```

如需指定自定义配置文件启动：
```
npm start -- my_config.json
```

注意，配置文件必须是json格式，并且保存在conf/目录。


## 查看监控结果

在log/目录下会生成两个日志文件：

* ok.log 	- 成功访问日志
* fail.log 	- 访问失败日志


## HeroUnion账号获取

请打开网站，查看底部的联系方式：
[FileSite.io](https://filesite.io)
