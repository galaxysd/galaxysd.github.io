---
layout: post
title: "Jekyll on Windows"
tagline: "每次想写东西都得先修Blog真是够了"
description: ""
category: Misc
tags: [Windows, Blog Maintenance, Jekyll, ZT]
comments: true
published: true
---

修Blog用的时间永远总是比写Blog用的时间多，真是够了……

总之博客是以前用Mac时架起来的，可是我现在主用Windows了，系统分歧果然人类和平的重要障碍。
长话短说，你需要安装以下工具(安装时注意文件名里面的空格和奇怪字符，为免坑爹我把安装目录都放在分区根目录下了。)：

- Ruby & Ruby Development Kit
- Jekyll
- Pygments


先从[rubyinstaller这里](http://rubyinstaller.org/downloads/)安装Ruby和Devkit，安装完后到Devkit的目录下运行

	ruby dk.rb init

生成`config.yml`，然后将其打开并填入你安装Ruby的目录(如：`C:/ruby`)。然后执行安装威力加强包(?????)

	ruby dk.rb install

假如你已经安装过Python和pip，接下来就可以直接

	gem install jekyll
	pip install Pygments

之后也可以再装别的Markdown parser但是我很懒你们懂的……

用MinGW Shell之类的工具的话，记得还要定义一下环境变量

	LC_ALL=en_US.UTF-8
	LANG=en_US.UTF-8

不然你很有可能会遇到`invalid byte sequence in GBK`这样的错误。不想每次都输入的话就丢去`C:\MinGW\msys\1.0\etc\profile`好了。

EOF

-------------------------------------------------

## Reference

- [Running Jekyll on Windows](http://www.madhur.co.in/blog/2011/09/01/runningjekyllwindows.html)
- [github + jekyll 安装遇到问题](http://dylanvivi.github.io/posts/jekyll-install-problem.html)
