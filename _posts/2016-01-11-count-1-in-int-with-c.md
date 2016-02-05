---
layout: post
date: 'Mon 2016-01-11 13:13:18 +0800'
slug: "count-1-in-int-with-c"
title: "Count 1 in Int with C"
description: ""
category: 
tags: []
---

两则关于 C 的笔记。额，实际数的是`Int8`，消掉1那个应该是作业？

https://gist.github.com/jasonlvhit/71a5437ca2563578ee32

how-many-1.md

一个二进制数中有多少个一，经典问题，第一次看见是在C和指针中，使用的方法是移位。

## 查表

查表是最简单的做法，并且是时间复杂度最好的算法。

## 移位

``` c
#include <stdio.h>

int main(){
	int i = 255;
	int count = 0;
	while(i){
		if(i & 1)
			count ++;
		i = i >> 1;

	}
	printf("%d\n",count );
	return 0;
}
```
时间复杂度O(len(i))

## 时间复杂度为i中1的个数的做法
``` c
#include <stdio.h>

int main(){
	int i = 255;
	int count = (i > 0? 1: 0);
	while(i){
		if(i & (i - 1))
			count ++;
		i = (i - 1) & i;

	}
	printf("%d\n",count );
	return 0;
}
```
和小美蒙了一晚上的算法，竟然蒙出来了，很是刺激。

出发点很简单，从一个只有一个1的数开始，想办法消掉这个1，然后推广开到若干个1.

---

C都忘干净了。。。

https://gist.github.com/jasonlvhit/9287727

#C数组下标的实现
````
	其实一个例子就能说明，C中数组下标的实现方法。
	................
	int array[4];

	array[2] 和 2[array]是等价的。
	................
	2[array]，这是个什么玩意儿。
	2[array]等价于：
	*(2 + array)

	array[2]等价于:
	*(array + 2)

	。。。。。。。。。。
````
