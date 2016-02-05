---
layout: post
date: 'Mon 2016-01-11 13:06:16 +0800'
slug: "sds-from-redis"
title: "SDS from Redis"
description: ""
category: 
tags: [ZT]
---

看上去`struct sdshdr`已经是最简存在了，`len`保存总大小、`free`用来得到数据尾地址用来追加。

https://gist.github.com/jasonlvhit/bdd88571331d7b6dac1e

SDS -> Simple Dynamic String，简单动态字符串，为了性能和实现上的需要，Redis中用SDS取代了标准C中字符串（对不起，一个以'\0'结尾的char*）类型。SDS的实现比较简单，但却是维持Redis高效率的关键组件，SDS的源码在Redis源码文件中的sds.h和sds.c中可以找到。

相对于传统的标准C字符串，SDS主要有下面几个看起来好一点的特性:

* 二进制安全，字符串中允许拥有任意类型的数据，包括'\0'
* 在O(1)时间内获取字符串长度（strlen）
* 高效的字符串追加操作（append）

第一点和第二点的实现其实很简单，为了在O(1)时间内获得长度，我们只有把这个长度存起来，有了长度我们也就能够判断字符串的开始和终止，也就是说，我们不再需要强制要求字符串是'\0'终止的了。

我们可以容易的理解下面这个sds的定义(来自黄建宏的Redis源码注释，sds.h):

``` c
struct sdshdr {

    // buf 已占用长度
    int len;

    // buf 剩余可用长度
    int free;

    // 实际保存字符串数据的地方
    // 利用c99(C99 specification 6.7.2.1.16)中引入的 flexible array member,通过buf来引用sdshdr后面的地址，
    // 详情google "flexible array member"
    char buf[];
};
```

关于第三点，更加高效的字符串追加操作，这里的动态字符串，类似于C++中的vector，或者Python中的list，可以在原字符串的后面追加新的字符或字符串，而不必要“彻底的重新分配内存”。SDS的动态字符串实现策略同C++的vector和Python中的List如出一辙(算法的很多经典的实现策略都是类似的）：

注意sds结构体中有一成员名为free，这里保存了sds一个实例霸占着的，但未被其使用的空间大小，sds拥有着比实际拥有的字符串成员占据内存大小更大的空间，所以在追加新字符串的时候，我们不必要分配空间给这个sds。

那么sds的内存分配策略是怎样的？.....和Cpapa中的vector和python 中的 list是一样的。

这里同样引用建宏兄的redis源码注释中的内容：

``` c
sds sdsMakeRoomFor(
    sds s,
    size_t addlen   // 需要增加的空间长度
) 
{
    struct sdshdr *sh, *newsh;
    size_t free = sdsavail(s);
    size_t len, newlen;

    // 剩余空间可以满足需求，无须扩展
    if (free >= addlen) return s;

    sh = (void*) (s-(sizeof(struct sdshdr)));

    // 目前 buf 长度
    len = sdslen(s);
    // 新 buf 长度
    newlen = (len+addlen);
    // 如果新 buf 长度小于 SDS_MAX_PREALLOC 长度
    //这里SDS——MAX_PREALLOC的大小为1M
    // 那么将 buf 的长度设为新 buf 长度的两倍
    if (newlen < SDS_MAX_PREALLOC)
        newlen *= 2;
    else
        newlen += SDS_MAX_PREALLOC;

    // 扩展长度
    newsh = zrealloc(sh, sizeof(struct sdshdr)+newlen+1);

    if (newsh == NULL) return NULL;

    newsh->free = newlen - len;

    return newsh->buf;
}
```

所以SDS，是一个经典的用空间换取时间效率的实现。

> 深深的分割线...tatata...
--------------

PS.

Redis的代码写的很赞，简洁并且很易读，并且有很多地方看的让人脑洞大开，比如SDS模块中，下面的这个函数，恕我当时年幼无知(现在更无知)，被这个函数深深的折服：

``` c
static inline size_t sdslen(const sds s) {
    struct sdshdr *sh = (void*)(s-(sizeof(struct sdshdr)));
    return sh->len;
}
```

最后：
Be Happy!

