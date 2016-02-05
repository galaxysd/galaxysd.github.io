---
layout: post
date: 'Fri 2013-05-03 15:02:50 +0800'
slug: "hello-kernel"
title: "Hello Kernel 内核模块编程简例"
description: ""
category: Linux
tags: [Linux, Kernel, Programming, C]
---

转自 [edsionte's Linuxworld|新手区](http://edsionte.com/techblog/archives/1336) edsionte @ 2010年9月13日

学习内核模块编程，第一个小程序当然是`hello,kernel!`了，这应当算是一个惯例了。以前大三的时候在实验课上做过模块编程，记得当时还是许师兄带我们的实验，不过现在又忘了。晚上试了试，很快就运行成功了，不过还是出现了一些问题。现在将我的步骤记录如下，供和我一样的初学者学习。

## 1.首先编写`hello.c`文件

	#include <linux/init.h>
	#include <linux/module.h>
	#include <linux/kernel.h>
	//必选
	//模块许可声明
	MODULE_LICENSE("GPL");
	//模块加载函数
	static int hello_init(void)
	{
		printk(KERN_ALERT "hello,I am edsionte\n");
		return 0;
	}
	//模块卸载函数
	static void hello_exit(void)
	{
		printk(KERN_ALERT "goodbye,kernel\n");
	}
	//模块注册
	module_init(hello_init);
	module_exit(hello_exit);
	//可选
	MODULE_AUTHOR("edsionte Wu");
	MODULE_DESCRIPTION("This is a simple example!\n");
	MODULE_ALIAS("A simplest example");

通常一个模块程序的中，模块加载函数，模块卸载函数以及模块许可声明是必须有的，而象模块参数，模块导出符号以及模块作者信息声明等都是可选的。

我们编写了模块加载函数后，还必须用`module_init(mode_name);`的形式注册这个函数。因为当我们接下来用`insmod`加载模块时，内核会自动去寻找并执行内核加载函数，完成一些初始化工作。类似的当我们使用`rmmod`命令时，内核会自动去执行内核卸载函数。

请注意这里的`printk`函数，可以简单的理解为它是内核中的`printf`函数，初次使用很容易将其打成`printf`。

## 2.编写Makefile文件

记得大三，那时候实验课上接触到Makefile，只是按照书上的内容敲上去。不过有了上一周对Makefile相关语法的了解，现在看起来已经基本知道为什么要这么写了。那么下面我们看Makefile文件。

	obj-m += hello.o
	#generate the path
	CURRENT_PATH:=$(shell pwd)
	#the current kernel version number
	LINUX_KERNEL:=$(shell uname -r)
	#the absolute path
	LINUX_KERNEL_PATH:=/usr/src/linux-headers-$(LINUX_KERNEL)
	#complie object
	all:
		make -C $(LINUX_KERNEL_PATH) M=$(CURRENT_PATH) modules
	#clean
	clean:
		make -C $(LINUX_KERNEL_PATH) M=$(CURRENT_PATH) clean

首先第一句话指定要被编译的文件。其实Makefile中有这样一句话就可以了，但是这样的话每次make时都要加入其他命令，所以我们不妨就在Make中加入每次要执行的命令（脚本语言的功能体现出来了）。每次只要输入make命令即可。

我们首先获得当前的相对路径（你可以在终端输入pwd试一下这个命令），然后再获得当前内核的版本号，这样就可以直接获得当前内核的绝对路径。当然你可以直接输入当前内核版本，不过这样不方便移植，如果当前内核版本号与此文件中的版本号不同时，就得修改。所以上面的方法有很好的移植性，而且可读性也强。

这里会经常出现`$(variable name)`这样的字符串，其实这是对括号内变量的一种引用，具体可参考Makefile的相关语法规则。

## 3.make

完成上述两个文件后，在当前目录下运行`make`命令，就会生成`hello.ko`文件，即模块目标文件。

## 4.`insmod`,`rmmod`和`dmesg`

insmod命令可以使我们写的这个模块加入到内核中，但是一般我们要加上sudo。rmmod当然就是卸载这个模块了。我们在加载或卸载模块时都有一些提示语，即我们printk中显示的语句，这时候可以用dmesg命令来查看。

ok，第一个模块编程就这么简单，try一下！

_Update 2011/04/03_

本文所描述的程序在ubuntu系统下测试成功。其他的Linux发行版应适当修改源码目录，即修改LINUX_KERNEL_PATH。
