---
layout: post
date: 'Mon 2016-01-11 12:58:56 +0800'
slug: "tail-recursion"
title: "Tail Recursion"
description: ""
category: 
tags: [ZT]
---

Galaxy前日在推上看到有人发啥[御用 C++ 构建之编译规范](http://tech.acgtyrant.com/%E5%BE%A1%E7%94%A8-C-%E6%9E%84%E5%BB%BA%E4%B9%8B%E7%BC%96%E8%AF%91%E8%A7%84%E8%8C%83/)，跑去看，瞅见评论那有人提“尾递归”，额，应该是推特的评论吧？刚才去看有没了，毕竟过去快一周了，可能记混了。

总之，后来Galaxy搜了下“尾递归”，搜到这个可以看的。  
以上。

https://gist.github.com/jasonlvhit/841e3ffb4431a2ff18c2

这两天过了遍Lua，Lua的一个语言特性是支持尾递归，这是我接触的第一个支持尾递归的语言（尾递归优化）

### 什么是尾递归

尾递归，是尾调用的一种类型，后者更加准确，因为实际的正确尾递归（Proper Tail Recursion）是不涉及递归的。尾调用是指一个函数里的最后一个动作是一个函数调用的情形：即这个调用的返回值直接被当前函数返回的情形。这种情形下称该调用位置为尾位置。若这个函数在尾位置调用本身（或是一个尾调用本身的其他函数等等），则称这种情况为尾递归，是递归的一种特殊情形。尾调用不一定是递归调用，但是尾递归特别有用，也比较容易实现。

我们直接的来看一下Lua中尾调用：

``` lua
function f(x)
    return g(x)
end
```

上述例子中，函数 f 调用函数 g 之后，不会执行任何多余的操作，在这种情况下，当被调用的函数
g 运行结束时不需要返回到调用者函数 f。因此，执行尾调用时不需要在栈中保留有关调用者的任何信息。
某些语言的实现，比如 Lua 解释器，充分利用了这种特性，在处理尾调用时不使用额外的栈空间，通常
我们称这种语言的实现支持了正确的尾调用。也正由于尾调用的栈空间不会成线性增长，所以我们可以用尾调用实现无穷递归和嵌套函数。

同样需要注意的是，尾递归，尾调用的条件也是非常苛刻的，**函数 f 调用函数 g 之后，不会执行任何多余的操作**，这一点很重要，例如下面的这些表达式，均不是尾调用：

``` lua
return (g(x))
return g(x) + 1
return x or g(x)
```

### Python，尾递归

如果你熟悉Python，你可能会碰到过一个maximum recursion depth exceeded的错误，无论你有没有遇到过，让我们执行下下面的函数：

``` python
>>> def f():
...  return f()
...
>>> f()
...
...
Runtime Error: maximum recursion depth exceeded

```
按照定义，上面定义的函数f，是一个标准的尾递归，如果Python能够正确的解释尾递归的话，这不会引起堆栈溢出，但是不幸的是，它真的溢出了。

让我们修改上面的函数，来观察一下函数执行中的堆栈状态：

``` python
import sys

def f():
  print(sys._current_frames())
  return f()
```

函数```_current_frames```会打印出当前的栈帧地址，如果我们执行上面的函数f，会得到类似下面的结果：

```
{6984: <frame object at 0x00000000029CABE0>}
{6984: <frame object at 0x00000000029CAA38>}
{6984: <frame object at 0x00000000029CA890>}
{6984: <frame object at 0x00000000029CA6E8>}
{6984: <frame object at 0x00000000029CA540>}
{6984: <frame object at 0x00000000029CA398>}
```

观察最后的栈帧地址，会发现，栈帧不断的上升，也就是说Python的解释器并没有实现标准意义上的尾递归。

同样，**Java**也不支持。

我们也可以用lua实现同样的函数：

``` lua
> function f(x)
>>  return f(x)
>> end
>f(3)
...
```

这个函数会运行到。。。。海枯石烂。。

### C，编译器的尾递归优化

对很多C中的递归函数，函数调用中的返回地址、函数参数、寄存器值的压栈是没有必要的，例如阶乘：
``` c
int factorial(int n)
{
    return n == 0 ? 1 : n * factorial(n - 1);
}
```
现在的C编译器大多会对这样的函数进行尾递归优化，例如在gcc中，我们执行O2优化：
``` batch
$ gcc fact.c -O2 fact
```
编译器会把原来的函数调用```call```指令，优化为```jump```，也就是类似于循环，而不是执行函数调用。

考虑Wiki中给出的例子：

```
function foo(data1, data2)
   a(data1)
   return b(data2)
```
其中 data1、data2 是参数。编译器会把这个代码翻译成以下汇编：

```
foo:
  mov  reg,[sp+data1] ; 透过栈指针（sp）取得 data1 并放到暂用暂存器。
  push reg            ; 将 data1 放到栈上以便 a 使用。
  call a              ; a 使用 data1。
  pop                 ; 把 data1 從栈上拿掉。
  mov  reg,[sp+data2] ; 透过栈指針（sp）取得 data2 並放到暂用暂存器。 
  push reg            ; 将 data2 放到栈上以便 b 使用。 
  call b              ; b 使用 data2。
  pop                 ; 把 data2 從栈上拿掉。
  ret
```

尾部调用优化会将代码变成：

```
foo:
  mov  reg,[sp+data1] ; 透过栈指针（sp）取得 data1 并放到暂用暂存器。
  push reg            ; 将 data1 放到栈上以便 a 使用。
  call a              ; a 使用 data1。
  pop                 ; 把 data1 從栈上拿掉。
  mov  reg,[sp+data2] ; 透过栈指針（sp）取得 data2 並放到暂用暂存器。  
  mov  [sp+data1],reg ; 把 data2 放到 b 预期的位置。
  jmp  b              ; b 使用 data2 並返回到调用 foo 的函数。
```

### 参考

* [What is the tail recursion? -- Stack Overflow](http://stackoverflow.com/questions/33923/what-is-tail-recursion)
* [Programming in Lua](http://www.lua.org/pil/)
* [尾调用 -- Wiki](http://zh.wikipedia.org/zh/%E5%B0%BE%E8%B0%83%E7%94%A8)
* [什么是尾递归 -- 知乎](http://www.zhihu.com/question/20761771)
* [CSAPP第5章有关于程序优化的更详细内容](http://book.douban.com/subject/1230413/)
