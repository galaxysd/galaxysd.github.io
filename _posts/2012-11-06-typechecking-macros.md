---
layout: post
title: "Typechecking tricks using macros in C"
tagline:
description: ""
category: Coding
tags: [C, ZT]
comments: true
---

短笔记一篇嗯…

事发于豆瓣上的学习型友邻A Liutos君在前晚提出一个话题"要是C的宏对参数也有类型要求就好了", 然后学习型友邻B Fleuria叔果断告知了"Linux内核里的宏许多都加有类型检查的tricks". 然后菜逼小弟就在跟帖里学习涨姿势了= =….

在Linux内核的[kernel.h](http://lxr.free-electrons.com/source/include/linux/kernel.h#L568)里的`min(x, y)`就用到了类型检查的tricks:

	#define min(x, y) ({                                \
            	typeof(x) _min1 = (x);                  \
            	typeof(y) _min2 = (y);                  \
            	(void) (&_min1 == &_min2);              \
            	_min1 < _min2 ? _min1 : _min2; })

需要注意的的地方是:

- typeof 是gcc extensions的特性,并不属于c标准. 这不禁让我很好奇如果用别的Non-gcc编译器(例如Intel C)来编译Linux kernel到底有多轻松/麻烦…
- 第三行里的trick是,如果代码里尝试將两个不同类型的指针进行比较,编译器会输出一条warning. 例如gcc就会输出`warning: comparison of distinct pointer types lacks a cast`. 

假如你很确定不需要严格的检查类型,就可以用[kernel.h](http://lxr.free-electrons.com/source/include/linux/kernel.h#L632)里_t结尾的macro,自己指定参数的类型

	#define min_t(type, x, y) ({                        \
            	type __min1 = (x);                      \
            	type __min2 = (y);                      \
            	__min1 < __min2 ? __min1: __min2; })

文本替换就是方便…

最后就随手帖拯救懒人嗯…(disqus, jekyll和gist间的相性貌似很差的赶脚= =)
[source link](https://gist.github.com/ZephyrSL/4022951#file-typechecking_macros-c)
{% highlight C %}
#include <stdio.h>

#define min_t(type, x, y) ({                        \
	type __min1 = (x);                      \
	type __min2 = (y);                      \
	__min1 < __min2 ? __min1: __min2; })

/* generate warning if the types are unmatched: "comparison of distinct pointer types lacks a cast" */
#define min(x, y) ({                                \
	typeof(x) _min1 = (x);                  \
	typeof(y) _min2 = (y);                  \
	void) (&_min1 == &_min2);              \ 
	_min1 < _min2 ? _min1 : _min2; })


int main(int argc, char const *argv[])
{
  int a = 12;
  unsigned b = 14;
  printf("min_t: %d\n", min_t(int, a, b));
  printf("min: %d\n", min(a, b));
  return 0;
}
{% endhighlight %}

EOF



