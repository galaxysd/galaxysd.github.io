---
layout: post
date: 'Fri 2013-05-03 14:04:22 +0800'
slug: "multi-line-commenting-in-bash"
title: "BASH中的多行注释"
description: ""
category: 
tags: [Tips, BASH, ZT, heredoc, Galaxy]
---

在Shell脚本中，单行注释是在前面`#`，例如`#生成全量索引`.

转自 [shell多行注释 @ chinaunix](http://blog.chinaunix.net/uid-24148050-id-3025447.html) 2011-11-22 21:02:08

把shell多行注释掉，有如下方法：

## 第一种：基于 [here document](http://en.wikipedia.org/wiki/Here_document) 和 `:` 实现

如果被注释的内容中有反引号会报错

    :<<BLOCK
    ....被注释的多行内容
    BLOCK


解决注释中有反引号的问题

    :<< 'BLOCK
    ....被注释的多行内容
    BLOCK'

或者干脆只留单引号

    :<< '
    ....被注释的多行内容
    '


## 第二种：当注释内容中有括号时报语法错误错，但里面有反引号,引号时没有问题

    :||{
    ....被注释的多行内容
    }


## 第三种：会对注释内容中的括号引号等语法错误报错

    if false ; then
     ....被注释的多行内容
    fi



-----


## Heredoc与重定向输入

Here文档 为需要输入数据的程序(如 mail sor 或cat) 接收内置文本，
直至用户自定义的休止符。

	cat << FINISH
	Hello there $LOGNAME
	The time is `date`
	If you want to know who is god, type "echo \$LOGNAME"
	FINISH

	$ cat << FINISH
	> Hello there $LOGNAME
	> The time is `date`
	> If you want to know who is god, type "echo \$LOGNAME"
	> FINISH
	Hello there
	The time is Fri May  3 14:17:56 CST 2013
	If you want to know who is god, type "echo $LOGNAME"

here 文档常被shell脚本用来生成 菜单 或 被用来 多行注释



## 用 heredoc 和 `case` 命令生成菜单

 # cat ./profile

	echo "select a terminal type: "
	cat << ENTER
	    1)    vt 120
	    2)    wyse50
	    3)    sun
	ENTER
	
	read choice
	
	case "$choice" in
	1)    TERM=vt120
	    export TERM
	    ;;
	2)    TERM=wyse50
	    export TERM
	    ;;
	3)    TERM=sun
	    export TERM
	    ;;
	esac
	
	echo "TERM is $TERM"
