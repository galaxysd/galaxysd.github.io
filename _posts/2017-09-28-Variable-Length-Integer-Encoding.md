---
layout: post
title: Variable-Length Integer Encoding
category: Programming
status: publish
tags: [Algorithm]
---

今天在推上[提到](https://twitter.com/galaxy001/status/913274598073950209)整数的变长编码，事后正式搜了堆，是以整理。

首先，目前 GCC 能直接处理的整数最大是[128位](https://stackoverflow.com/questions/11656241/how-to-print-uint128-t-number-using-gcc/11660651#11660651)的[`__int128`](https://gcc.gnu.org/onlinedocs/gcc/_005f_005fint128.html)，更多位数的需要自己用数组实现。所以，这里的整数以 128位（16字节）为上限。

现成的标准是小头的 [LEB128](https://en.wikipedia.org/wiki/LEB128) (Little Endian Base 128)，出自[DWARF](https://en.wikipedia.org/wiki/DWARF)这个调试数据的文件格式。
以及大头的 [VLQ](https://en.wikipedia.org/wiki/Variable-length_quantity) (variable-length quantity)，比如谷歌的 Protocol Buffers 中的 [Base 128 Varints](https://developers.google.com/protocol-buffers/docs/encoding#varints)，`varints`。

（话说，正式的说法是：小端序（英：little-endian）或称小尾序。大端序（英：big-endian）或称大尾序。

以 `Signed LEB128` [为例](https://en.wikipedia.org/wiki/LEB128#Signed_LEB128)，-624485 (0xFFF6789B) is encoded as 0x9B 0xF1 0x59. The lower bits of the two's complement of it is 0110_01111000_10011011; to ensure the MSB of 1, padding one 1 to 21 bit is enough (这里应该是在说符号位); and encoding 1011001_1110001_0011011 is 0x9B(10011011) 0xF1(11110001) 0x59 (01011001):

````
MSB ------------------ LSB 
      01100111100010011011  In raw two's complement binary
     101100111100010011011  Sign extended to a multiple of 7 bits
 1011001  1110001  0011011  Split into 7-bit groups
01011001 11110001 10011011  Add high 1 bits on all but last (most significant) group to form bytes
    0x59     0xF1     0x9B  In hexadecimal

→ 0x9B 0xF1 0x59            Output stream (LSB to MSB)
````

其中，[MSBit](https://en.wikipedia.org/wiki/Most_significant_bit) 是 most significant bit，即最高有效位，是指一个 n 位二进制数字中的 n-1 位，具有最高的权值 2<sup>n-1</sup>。
MSByte 则是具有最大权重的字节。

------

Galaxy 还看到 John M. Dlugosz 在2003年折腾 [ZIP2 格式](http://www.dlugosz.com/ZIP2/structure.html)时做的`sintV`[方案](http://www.dlugosz.com/ZIP2/VLI.html)。
我摘录在[文章末尾](#dlugosz-variable-length-integer-encoding--revision-2)，作为借鉴。

其实，他这种把标记位放在开头的方法，对高级语言来说确实是方便些，不用来回`seek`。但 C 里面`seek`其实挺方便的。

然后，Galaxy 也查了下压缩。wiki上有[Universal code (data compression)](https://en.wikipedia.org/wiki/Universal_code_%28data_compression%29)，arXiv上找到了[Daniel Lemire](https://arxiv.org/find/cs/1/au:+Lemire_D/0/1/0/all/0/1)的算法文献：

* [Decoding billions of integers per second through vectorization](https://arxiv.org/abs/1209.2137)
* [Stream VByte: Faster Byte-Oriented Integer Compression](https://arxiv.org/abs/1709.08990)

及相关的库：

* [FastPFOR C++](https://github.com/lemire/FastPFor)
* [TurboPFor](https://github.com/powturbo/TurboPFor)

其实，Galaxy 最先关注的库是基于 [Rice coding](https://en.wikipedia.org/wiki/Golomb_coding) 的 Run-Length Golomb-Rice (RLGR)。代码在微软的 [RemoteFX codec](https://msdn.microsoft.com/en-us/library/ff635799.aspx)，或者直接看 FreeRDP 上面[RLGR1的源码](https://github.com/FreeRDP/FreeRDP/blob/13a1d80daf067f926641240b83dbacedec3dce63/libfreerdp/codec/rfx_rlgr.c)。

不过，看完那堆 SIMD 的东西，Galaxy 意识到，这些都是内存或临时文件中用的，标准化的文件格式还是应该用简简单单的`LEB128`。

---

### Dlugosz' Variable-Length Integer Encoding — Revision 2

#### Introduction

Since the whole idea of the ZIP2 file format is to save room, it is wasteful to store values with a larger number of bytes when a small number is generally enough. Also, since it is designed with the future in mind, what is the upper limit of the value's size? For example, 32 bits might be a good choice for a length value now, but insufficient in the near future. So it is natural that many integer values will be stored as variable-sized integers. It will be short when possible, keeping the file efficient. However, it may be long when necessary.

My first idea was to simply use UTF-8 encoding. However, this is less efficient for small integers than it could be (two byte forms only goes up to 2K) and is limited to handling numbers up to 31 bits. A design goal was to handle 64 bits, so this would not do.

Since I was looking for something different anyway, it became clear that the design considerations for UTF-8 were simply not applicable for my needs. A simpler format would work quite well, and offer other benefits in exchange.

#### History and Previous Versions

Version 1 of this idea used a very simple and elegant approach, where an n- byte field contained n-1 1-bits, a 0-bit, and finally 7*n bits making up the number. This proved more difficult than anticipated to implement efficiently in Perl, and has the disadvantage of not knowing how many bytes you need to read from a stream before you know the length.

Version 2 is totally revised, but has some features in common. It further optimizes some common number ranges, and makes reading from a stream easier.

It can't be explained in a sentence anymore, but requires some tables. But, real implementations used tables anyway, so it's not actually more difficult to program.

#### Overview

The first byte of the variable-length field will indicate how long the field is, and may contain some bits of the value. Subsequent bytes contain the rest of the number's value. In addition, there is a super-extended form that encodes the length in the second (or more) bytes, but this is not needed except for very large multi-precision integers.

In all cases, masking off the highest bits will leave the value readable in big-endian format in the field, once you know the field's length (which is encoded in those high bits).

|prefix bits|bytes|data bits|unsigned range|
|:---|---:|---:|:---|
|0|1|7|127|
|10|2|14|16,383|
|110|3|21|2,097,151|
|111 00|4|27|134,217,727 (128K)|
|111 01|5|35|34,359,738,368 (32G)|
|111 10|8|59|holds the significant part of a Win32 FILETIME|
|111 11 000|6|40|1,099,511,627,776 (1T)|
|111 11 001|9|64|A full 64-bit value with one byte overhead|
|111 11 010|17|128|A GUID/UUID|
|111 11 111|n|any|Any multi-precision integer|

A byte with its high bit cleared is a one-byte value, holding a number from 0- 127. If the high bit is set, the next highest bit indicates that the value is two bytes long when clear, longer when set.

So a two-byte value can hold up to 16K, which is sufficient for ordinals most of the time. A 4-byte value can hold up to 128 Meg, which is sufficient for most length values. If you're storing files longer than that, an extra byte for a longer length field is not significant.

Longer fields still have less than 1 byte of overhead to encode the length. A 64-bit Windows FILETIME really has 57 bits for current time values, and that will still encode to a 8-byte field (5 bits overhead for the length).

There are 4 unused encodings with 1 byte of overhead, and they can be assigned to optimize cases for common needs, as they are discovered. For more arbitrary storage, a final form gives the length as a separate value, and can encode any length.

#### Benifits and Features

* Efficient encoding keeps the values short most of the time.
* Easy to decode, compared to UTF-8. Rather than extracting some bits from each byte and shifting them into position, the value can be read simply by masking off the high bits.
* The algorithm extends to integers of arbitrary size.

#### Details

There are four general forms. The shortest preserve minimum size and maximum range for ordinal values. They have n= 0, 1, or 2 leading 1 bits followed by a 0 bit, followed by n additional bytes.

The second format has 3 leading 1 bits, followed by a 2-bit selector. The selector encodes for 3, 4 or 7 additional bytes.

When the selector is binary 11, the rest of the byte encodes a 3-bit selector that encodes more lengths.

When that selector is binary 111, the length follows the first byte. The length is itself encoded as a VLI. That is followed by that many value bytes.

`[0 xxxxxxx]` holds 0—127 in one byte.

The first bit is zero, indicating this form. The remaining 7 bits hold the value.

`[10 xxxxxx] [yyyyyyyy]` holds 0—16,383 in two bytes.

The first two bits are 10, indicating this form. The remaining 6 x bits are the most-significant bits of the value, and the second byte is the least-significant 8 bits of the value.

If you mask off the first two bits (set them both to zero for an unsigned vli), the two bytes will hold the value in big-endian.

`[110 xxxxx] [yyyyyyyy] [zzzzzzzz]` holds 0—2,097,151 in three bytes.

The first three bits are `110`, indicating this form. The remaining 5 `x` bits are the most-significant bits of the value, followed by two more bytes of value.

`[111 ff xxx] [[ n bytes ]]`

The first three bits are `110`, indicating this form. The following two `f` bits encode the length. The remaining 3 `x` bits are the most-significant bits of the value, followed by the specified number of additional value bytes.

Values of `ff` encode: `00` = 3 more bytes (27 bits of value total), `01` = 4 more bytes (35 bits total), `10` =7 more bytes (59 bits total), and `11` means to use the even longer `g` format.

These are listed individually below.

`[111 00 xxx] [[ 3 bytes ]]` holds 0—128K in 4 bytes.  
`[111 01 xxx] [[ 4 bytes ]]` holds a 35-bit value.  
`[111 10 xxx] [[ 7 bytes ]]` holds a 59-bit value.

`[111 11 ggg] [[ n bytes ]]`

The first five bits are `11111`, indicating this form. The following three `g` bits encode the length. This is followed by the indicated number of value bytes.

Values of `ggg` encode: `000` = 5 more bytes, `001` = 8 more bytes, `010` = 16 more bytes, and `111` means to use the even longer `v` format. The other 4 values of `ggg` are reserved for future definition.

`[111 11 000] [[ 5 bytes ]]`  
`[111 11 001] [[ 8 bytes ]]`  
`[111 11 010] [[ 16 bytes ]]`  
`[111 11 011] [[ ??? ]]` is reserved  
`[111 11 100] [[ ??? ]]` is reserved  
`[111 11 101] [[ ??? ]]` is reserved  
`[111 11 110] [[ ??? ]]` is reserved  
`[111 11 111] [[ v-field ]] [[ lots more bytes]]`

#### Examples

Example numbers are written with a leading +/- to indicate signed values, and with no prefix to indicate unsigned values. The prefix (+) means that the number has the same encoding whether treated as signed or unsigned.

|number|encoding|form|notes|
|:---|---:|---:|:---|
|(+) 1|01|0 {7 bits}|
|(+) 5|05|0 {7 bits}|
|(+) 20|14|0 {7 bits}||
|(+) 200|80 c8|10 {14 bits}||
|(+) 400|81 90|10 {14 bits}||
|(+) 10,000|a7 10|10 {14 bits}||
|(+) 16,384|c0 40 00|110 {21 bits}|Smallest unsigned number that needs 3 bytes|
|(+) 2,000,000|de 84 80|110 {21 bits}||
