---
layout: post
title: "Archlinux下有关无损音乐的折腾"
date: 2013-10-06 23:29
comments: true
tags: [Linux, music, ZT]
---

最近发现一些旧番的音乐只有无损的了...MP3的已经无法满足大众的需求了么....  
但是在Linux下直接用MPD播放无损音乐不能分轨播放实在是不能接受.
于是就开始找寻切割的方法...Archwiki有相关的条目[APE+CUE Splitting](https://wiki.archlinux.org/index.php/APE%2BCUE_Splitting)
但是,有个明显的缺陷是分轨之后的文件居然不是用歌曲名字命名的!
而且还是我不怎么喜欢的wav格式...
不过我还是在菊苣的帮助下找到了完美的解决方案~

#无损音乐的分轨
Linux下有个shntool的工具非常实用,可以完美解决无损音乐分轨的问题.
根本不需要wiki里面说的cuebreakpoints  
`shntool split -f example.cue -t %n_%p_%t  -o  'cust  ext=mp3  lame  --quiet  - %f' example.ape`  
-t指的是文件的标题,%n 代表编号,%p 表示 Performer，%t 表示 Title.都是从cue里面读取的信息,shntool默认不支持
mp3格式的,所以需要指定用lame编码器进行编码.当然很多人只是想分轨,并不想转换成压缩的mp3格式.  
`shntool split -f example.cue -t %n_%p_%t  -o  flac example.ape`  
直接转换成flac格式就好了,因为flac格式是开源的无损音乐格式,播放器对它支持的肯定比较好.

#给每个音乐文件打TAG
转换之后的文件只是单纯的音乐文件,每个音乐并没有包含想关的TAG信息,这时候需要用cuetag.sh给每个音乐文件打TAG  
[cuetag.sh脚本](https://gist.github.com/acgotaku/7279681) 最新版貌似有问题不能使用.  
`cuetag.sh file.cue *.mp3`  
命令很简单,在转换好的音乐文件夹下指定cue文件和mp3文件即可自动打TAG,但是需要注意的一点是,这个脚本打的是ID3v1的标签,如果是非英语语言的话,
会出现乱码问题.详情请戳[Mp3标签乱码问题分析与解决方案](http://linux-wiki.cn/wiki/Mp3%E6%A0%87%E7%AD%BE%E4%B9%B1%E7%A0%81%E9%97%AE%E9%A2%98%E5%88%86%E6%9E%90%E4%B8%8E%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88)
所以,之后我们还是要使用[mp3tagiconv](https://code.google.com/p/mp3tagiconv/)
这个工具来进行标签的转换使得所有的播放器都能够正确识别mp3音乐的标签.  
`for i in *.mp3; do echo "y"| mp3tagiconv "${i}" ;done`  
因为mp3tagiconv这个工具每次更新标签都会提示yes or no ,所以我就修改了下执行方式,使得批量自动化修改.flac格式的音乐不存在TAG编码问题.

#flac转换为mp3
虽然在PC上听无损比较爽,但是放在手机上受制于存储空间和CPU性能,还是转换成Mp3比较好.  
`flac -d -c example.flac | lame -q 0 -b 320 - example.mp3`  
如果想保留flac的回放增益特性的话可以在转换的时候加上  
`--apply-replaygain-which-is-not-lossless` 参数.

到此,折腾完毕...

#cuetag.sh脚本存档
{% highlight bash %}
#! /bin/sh

# cuetag.sh - tag files based on cue/toc file information
# uses cueprint output
# usage: cuetag.sh <cuefile|tocfile> [file]...
# dependencies:
# id3v2
CUEPRINT=cueprint
cue_file=""

usage()
{
	echo "usage: cuetag.sh <cuefile|tocfile> [file]..."
}

# Vorbis Comments
# for FLAC and Ogg Vorbis files
vorbis()
{
	# FLAC tagging
	# --remove-all-tags overwrites existing comments
	METAFLAC="metaflac --remove-all-tags --import-tags-from=-"

	# Ogg Vorbis tagging
	# -w overwrites existing comments
	# -a appends to existing comments
	VORBISCOMMENT="vorbiscomment -w -c -"

	case "$2" in
	*.[Ff][Ll][Aa][Cc])
		VORBISTAG=$METAFLAC
		;;
	*.[Oo][Gg][Gg])
		VORBISTAG=$VORBISCOMMENT
		;;
	esac

	# space seperated list of recomended stardard field names
	# see http://www.xiph.org/ogg/vorbis/doc/v-comment.html
	# TRACKTOTAL is not in the Xiph recomendation, but is in common use
	
	fields='TITLE VERSION ALBUM TRACKNUMBER TRACKTOTAL ARTIST PERFORMER COPYRIGHT LICENSE ORGANIZATION DESCRIPTION GENRE DATE LOCATION CONTACT ISRC'

	# fields' corresponding cueprint conversion characters
	# seperate alternates with a space

	TITLE='%t'
	VERSION=''
	ALBUM='%T'
	TRACKNUMBER='%n'
	TRACKTOTAL='%N'
	ARTIST='%c %p'
	PERFORMER='%p'
	COPYRIGHT=''
	LICENSE=''
	ORGANIZATION=''
	DESCRIPTION='%m'
	GENRE='%g'
	DATE=''
	LOCATION=''
	CONTACT=''
	ISRC='%i %u'

	(for field in $fields; do
		value=""
		for conv in `eval echo \\$$field`; do
			value=`$CUEPRINT -n $1 -t "$conv\n" "$cue_file"`

			if [ -n "$value" ]; then
				echo "$field=$value"
				break
			fi
		done
	done) | $VORBISTAG "$2"
}

id3()
{
	MP3INFO=mid3v2

	# space seperated list of ID3 v1.1 tags
	# see http://id3lib.sourceforge.net/id3/idev1.html

	fields="TITLE ALBUM ARTIST YEAR COMMENT GENRE TRACKNUMBER"

	# fields' corresponding cueprint conversion characters
	# seperate alternates with a space

	TITLE='%t'
	ALBUM='%T'
	ARTIST='%p'
	YEAR=''
	COMMENT='%c'
	GENRE='%g'
	TRACKNUMBER='%n'

	for field in $fields; do
		value=""
		for conv in `eval echo \\$$field`; do
			value=`$CUEPRINT -n $1 -t "$conv\n" "$cue_file"`

			if [ -n "$value" ]; then
				break
			fi
		done

		if [ -n "$value" ]; then
			case $field in
			TITLE)
				$MP3INFO -t "$value" "$2"
				;;
			ALBUM)
				$MP3INFO -A "$value" "$2"
				;;
			ARTIST)
				$MP3INFO -a "$value" "$2"
				;;
			YEAR)
				$MP3INFO -y "$value" "$2"
				;;
			COMMENT)
				$MP3INFO -c "$value" "$2"
				;;
			GENRE)
				$MP3INFO -g "$value" "$2"
				;;
			TRACKNUMBER)
				$MP3INFO -T "$value" "$2"
				;;
			esac
		fi
	done
	$MP3INFO -s "$2"
}

main()
{
	if [ $# -lt 1 ]; then
		usage
		exit
	fi

	cue_file=$1
	shift

	ntrack=`cueprint -d '%N' "$cue_file"`
	trackno=1

	if [ $# -ne $ntrack ]; then
		echo "warning: number of files does not match number of tracks"
	fi

	for file in "$@"; do
		case $file in
		*.[Ff][Ll][Aa][Cc])
			vorbis $trackno "$file"
			;;
		*.[Oo][Gg][Gg])
			vorbis $trackno "$file"
			;;
		*.[Mm][Pp]3)
			id3 $trackno "$file"
			;;
		*)
			echo "$file: uknown file type"
			;;
		esac
		trackno=$(($trackno + 1))
	done
}

main "$@"
{% endhighlight %}
