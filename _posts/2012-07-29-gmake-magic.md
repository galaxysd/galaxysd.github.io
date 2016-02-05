---
layout: post
title: "Make的黑魔术咒文"
tagline: "见习魔法师的Spellbook"
description: ""
category: Coding
tags: [Make, ZT]
---

作为Spellbook，也就是小抄，我才不会介绍[make](http://en.wikipedia.org/wiki/Make_%28software%29)到底是什么呢！

## 咒文三要素

……也就是规则(rule)啦。每条规则都包括以下三部分：

* Targets
* Prerequisites
* Commands

实际写出来是这个样子的：

    target1 target2 ... : preq1 preq2
        cmd1
        cmd2

规则的触发条件很简单: 当prerequisites中某项的修改时间新于targets中的某项，则执行commands部分。

## 咒文好长我不想重复读怎么办

……请使用变量(variables)

    CC = g++
    OBJECTS = hello.o bye.o
    greeting : $(OBJECTS)
        $(CC) -o $@ $(OBJECTS)

* `$@`是规则中的目标名;
* 使用`+=`添加新条目进入列表 `OBJECTS += hey.o`;
* 使用`=`时,若等号左边没被用到,等号右边就不会展开;当需要等号右边在定义时马上被展开的话，改用`:=`;
* `?=`仅在该变量从未被设置过时生效

## 写依赖项好麻烦啊怎么办

……请使用隐含规则(Implicit Rule)以及`-M`选项

    # 定义隐含规则
    %.d : %.cpp
        $(CC) $(CFLAGS) $(CPPFLAGS) -M $< > $@
    # 当参数不为clean时
    ifeq($(findstring $(MAKECMDGOALS), clean),)
    -include $(OBJECTS:.o=.d)
    endif

呜啊这个例子好复杂，能不解释么……(逃)

* `-M`选项可以从源文件中产生规则；如果是GNU C编译器的话，可以换成`-MM`, 该选项不会生成系统头文件的prerequisites
* `$<`是规则中的第一个prerequisite的名称
* `$(CC)`使用的编译器的名称
* `$(CFLAGS)`传入编译器的选项
* `$(CPPFLAGS)`传入预处理器的选项
* `$(OBJECTS:.o=.d)`将OBJECTS里每项的后缀从.o改成.d

## 呜啊.d/.o文件都生成在.c文件的目录里了好讨厌

……请把它们扔到单独的文件夹中

    BUILDDIR = build
    SOURCES = hello.cpp bye.cpp
    OBJECTS = $( addprefix $(BUILDDIR)/,$(SOURCES :.cpp=.o) )
    DEPS = $( OBJECTS :.o=.d)
    # ...
    $( BUILDDIR )/%.o : %.cpp
        $(CC) $( CFLAGS ) $( CPPFLAGS ) -o $@ -c $<
    $( BUILDDIR )/%.d : %.cpp
        $(CC) $( CFLAGS ) $( CPPFLAGS ) -MT $(@:.d=.o) -M $< > $@

还、还要解释么……

* `-MT`选项强制指定target为`$(@:.d=.o)`

## 好复杂的赶脚有没有实例呢

…………
[source link](https://gist.github.com/ZephyrSL/3194416/)

{% highlight Makefile %}
CC = g++
EXECUTABLE = Datastructure_test
SOURCES = Datastructure_test.cpp SPList.cpp
# Put generated files into seperate directory
BUILDDIR = build
OBJECTS = $(addprefix $(BUILDDIR)/,$(SOURCES:.cpp=.o))
DEPS = $(OBJECTS:.o=.d)

# Switch of full output
Q ?= @

# user configuration
# include config.mak

# Adapt C flags for debug/optimized build
ifdef NDEBUG
CFLAGS += -O3 -DNDEBUG
else
CFLAGS += -O0 -g
endif

CFLAGS 		+= $(MY_CFLAGS)
CPPFLAGS 	+= $(MY_CPPFLAGS)

.PHONY: clean

$(BUILDDIR)/$(EXECUTABLE) : $(OBJECTS)
	$(CC) -o $@ $(OBJECTS)

ifeq ($(findstring $(MAKECMDGOALS), clean),)
-include $(DEPS)
endif

# %.d : %.c
# 	$(CC) -M $< > $@

$(BUILDDIR)/%.o : %.cpp
	@echo "===> DEPEND $@"
	$(Q)$(CC) $(CFLAGS) $(CPPFLAGS) -o $@ -c $<

$(BUILDDIR)/%.d : %.cpp
	@echo "===> COMPILE $@"
	$(Q)$(CC) $(CFLAGS) $(CPPFLAGS) -MT $(@:.d=.o) -M $< > $@

clean :
	rm -f $(OBJECTS) $(EXECUTABLE)
{% endhighlight %}

* 引入了`config.mak`文件，用来分离放置用户自定义的选项
* 因为`clean`不是文件，所以将其声明为`.PHONY`
* 加入了`$(Q)`这样的黑魔术，使用`make Q=`能输出详细内容

## 这份小抄弱爆了请给我更好的spellbook

……请猛击[GNU Make Manual Quick Reference](http://www.gnu.org/software/make/manual/make.html#Quick-Reference)









