---
layout: post
date: 'Mon 2015-08-10 18:47:28 +0800'
slug: "jieba-cut-chinese-ling-jihua"
title: "［结巴］中文分词 与［令完成已经完成令计划的计划］"
description: ""
category: 
tags: Programming, Joke
---

源起是这则推文：

`把“令完成已经完成令计划的计划”这个新闻标题分词之后发到群里的结果`

![令完成已经完成令计划的计划](/assets/images/2015/jieba.cut.png)

<blockquote class="twitter-tweet" lang="en"><p lang="zh" dir="ltr">把“令完成已经完成令计划的计划”这个新闻标题分词之后发到群里的结果，哈哈。标题出处的微博在这里<a href="http://t.co/qtS2vnVmRN">http://t.co/qtS2vnVmRN</a> <a href="http://t.co/dzmEIOBb0Q">pic.twitter.com/dzmEIOBb0Q</a></p>&mdash; RMS门下走狗 (@ggarlic) <a href="https://twitter.com/ggarlic/status/630678454652919808">August 10, 2015</a></blockquote>

微博链接当然被和谐了，但咱对`jieba`的出现有些好奇，就g了下，然后
发现 结巴分词 有一堆语言版本……

最初的应该是Python版本，fxsjy/jieba 的 [结巴中文分词](https://github.com/fxsjy/jieba)。
同时搜到的还有 PHP版，fukuball/jieba-php 的 [目前翻譯版本為 jieba-0.19 版本](https://github.com/fukuball/jieba-php)。
然后就是 R语言版，qinwf/jiebaR 的 [jiebaR 中文分词](https://github.com/qinwf/jiebaR/)。

最后，网上说有C/C++的，于是咱再搜，终于找到了，是[Yanyi Wu](https://github.com/yanyiwu)写的。
包括[yanyiwu/cppjieba](https://github.com/yanyiwu/cppjieba), [yanyiwu/cjieba](https://github.com/yanyiwu/cjieba)。
以及[清爽头文件库的 yanyiwu/libcppjieba](https://github.com/yanyiwu/libcppjieba), [yanyiwu/nodejieba](https://github.com/yanyiwu/nodejieba)。

然后，有个["结巴"中文分词系列性能评测](http://yanyiwu.com/work/2015/06/14/jieba-series-performance-test.html)。

### 性能测试

测试机器是同一台机器，低配MacBookAir。

测试过程也是一样：

先按行读取文本围城到一个数组里，然后循环对围城每行文字作为一个句子进行分词。因为只对围城这本书分词一遍太快了，容易误差。   所以循环对围城这本书分词50次。基本上每次分词耗时都很稳定。 分词算法都是采用【精确模式】

####【耗时数据平均值如下，从低到高排序。】

* C++版本 CppJieba 7.6 s
* Node.js版本 NodeJieba 10.2 s
* go语言版本 Jiebago 67.4 s
* Python版本 Jieba 89.6 s

注明：以上耗时都是计算分词过程的耗时，不包括词典载入的耗时。

#### 测试的源码分别如下：

* CppJieba Performance Test 基于 CppJieba 版本 v3.0.0
* NodeJieba Performance Test 基于 NodeJieba 版本 v1.0.3
* Jiebago Performance Test 基于 Jiebago 版本 v0.3.2
* Jieba Performance Test 基于 Jieba 版本 v0.32

这些时间数据本身没什么意义，因为在不同机器上跑出来的都不一样。 但是他们之间的对比是有意义的。

#### 拿最低的基准数据 CppJieba 的耗时 7.6s 作为参照物。那么其他程序的耗时分别是：

* NodeJieba = 1.34 * CppJieba
* Jiebago = 8.86 * CppJieba
* Jieba = 11.79 * CppJieba

###【结果分析】

* CppJieba 性能最高这个符合我的预期，因为自己在它的开发过程也一直在考虑性能方面。
* NodeJieba 是 CppJieba 包装而来的，所以我觉得在两倍之内都是正常的。
* Jiebago 这么高的耗时就完全不正常了，毕竟是go语言写的，简单翻阅过源码，可优化空间还是很大的。
* Jieba 耗时确实比较多，应该也有不小的优化空间，但是我想说的是，性能不是唯一标准，简单易用也很重要，Jieba依然最优秀的国产开源软件之一。



额，就酱啦。
懒得开个repo去整理加mirror。理论上这种没有政治问题的软件不会被自主规制才对。而且fork的人也不少，咱就不fork了。  
其实是咱现在用不上，的说。
