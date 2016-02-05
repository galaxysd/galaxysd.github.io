---
layout: post
title: "改善用户体验：图片的预加载[翻译]"
category: Javascript
tags: [ZT]
comments: true
---

[这家伙](https://github.com/nomospace/nomospace.github.com/blob/master/_posts/2011-03-16-image-preload.md)写的什么Markdown，完全是堆HTML，还带一堆`style`，一点都不简洁。差评！（后来发现163那边作者是同一人，所以，自己的163博客也是直接dump么……）

原文那个zip例子现在找不到了，而且jQuery出来后自己写轮子就显得过时了。
一个功能相反的例子是下面这个，它出现在原文评论中。

https://github.com/tuupola/jquery_lazyload

----
本文地址：http://blog.163.com/jinlu_hz/blog/static/1138301522011216114141761/ <br>
原文地址：http://msdn.microsoft.com/en-us/scriptjunkie/gg681862.aspx <br>
原文作者：Jan Lehmann [@lehmjan](http://twitter.com/lehmjan)

翻译能力有限，辞不达意的地方请自动跳过或者直接阅读[原文](http://msdn.microsoft.com/en-us/scriptjunkie/gg681862.aspx)。

——以下为翻译——

目前对打造一个操作系统桌面般用户体验的关注度日益升高，用到的图片数量也越来越庞大。为了满足各种需求，对话框、标签栏、工具条、幻灯与日历组件等变得十分重要。
图片的预加载能够提升网站性能和可用性，同时也避免了一些页面的因图片未加载完毕而产生的闪烁感和片段感。

###Frequently used Techniques（惯用伎俩）

有两种惯用伎俩实现图片预加载：

####Css sprites
Css sprites有效限制了页面上的HTTP请求数，所有的小图片被拼在了一张大图片上，然后通过CSS来定位相应元素。
但有一个缺点，只有刚开始时（页面第一次载入时）出现的图片会被影响到。其他那些动态载入、计划稍后呈现的图片不会被加载，在此产生了一个延迟。所以这个技术的目标与静态网站一致，大大降低图片数量。

####JavaScript
另一个手段就是JavaScript了，无非就是将每个图片的URL塞进一个数组。

{% highlight JavaScript %}
var myImages = ["image_1.jpg", 'image_2.jpg', 'image_3.jpg', ...];
{% endhighlight %}

然后循环数组，为每个URL创建一个image对象。这么做的好处是保证所有的图片都已经被浏览器缓存完毕，并能够毫无延迟地为浏览器后期所用。

{% highlight JavaScript %}
for (var i = 0; i <= myImages.length; i++) {
var img = new Image(); 
     img.src = myImages[i];
}
{% endhighlight %}

该解决方案的时间开销都用在了将每一个图片URL放进一个数组中去，并维护数组的一致性。网站每次修改（例如新增了图片或者图片的URL改变）都会影响数组，如果有无数图片要修改那么这个操作将非常耗时。

###Automated image preloading with progress indicator（带有载入进度指示的图片自动预加载）

一个更有效的手段是自动收集图片URL。
第一步是分析页面上所有CSS link和内联样式。通过遍历`document.styleSheets`对象成员，访问每一个正在使用的样式表。
{% highlight JavaScript %}
for (var i = 0; i < document.styleSheets.length; i++){
{% endhighlight %}

获取Css的基础路径很重要，这是为后期获取图片的绝对路径做准备。
{% highlight JavaScript %}
var baseURL = getBaseURL(document.styleSheets[i].href);
{% endhighlight %}

出于浏览器兼容性考虑，很有必要检测是否每个样式表的"cssRules"或者"rules"都含有数据。
{% highlight JavaScript %}
if (document.styleSheets[i].cssRules) {
    cssRules = document.styleSheets[i].cssRules
}
else if (document.styleSheets[i].rules) {
    cssRules = document.styleSheets[i].rules
}
{% endhighlight %}

每条Css规则会被解析是否为空值，或者说是否为一个与图片相关的规则。正则表达式正好能够做这个事情。
{% highlight JavaScript %}
var cssRule = cssRules[j].style.cssText.match(/[^\(]+\.(gif|jpg|jpeg|png)/g);
{% endhighlight %}

然后，获取到的每个图片的URL会被塞进数组为后期所用。
{% highlight JavaScript %}
function analyzeCSSFiles() {
    var cssRules; // CSS rules
    
    for (var i = 0; i < document.styleSheets.length; i++) { // loop through all linked/inline stylesheets
       
        var baseURL = getBaseURL(document.styleSheets[i].href); // get stylesheet's base URL 
 
        // get CSS rules
        if (document.styleSheets[i].cssRules) {
            cssRules = document.styleSheets[i].cssRules
        }
        else if (document.styleSheets[i].rules) {
            cssRules = document.styleSheets[i].rules
        }
        
        // loop through all CSS rules
        for (var j = 0; j < cssRules.length; j++) {
            if (cssRules[j].style && cssRules[j].style.cssText) {
                // extract only image related CSS rules 
                // parse rules string and extract image URL
                var cssRule = cssRules[j].style.cssText.match(/[^\(]+\.(gif|jpg|jpeg|png)/g);
                if (cssRule) {
                    // add image URL to array
                    cssRule = (cssRule + "").replace("\"", "")
                    imageURLs.push(baseURL + cssRule);
                }
            }
        }
    }
}
{% endhighlight %}

为获取每个图片的绝对路径，在此实现一个"getBaseUrl"的函数用来提取每个CSS文件里的绝对路径。
{% highlight JavaScript %}
function getBaseURL(cssLink) {
    cssLink = (cssLink) ? cssLink : 'window.location.href'; // window.location.href for inline style definitions
    
    var urlParts = cssLink.split('/'); // split link at '/' into an array
    urlParts.pop(); // remove file path from URL array
    
    var baseURL = urlParts.join('/'); // create base URL (rejoin URL parts)
    
    if (baseURL != "") 
    {
        baseURL += '/'; // expand URL with a '/'
    }
    
    return baseURL;
}
{% endhighlight %}

通过遍历集合，为页面上的每个图片创建一个image对象用以预加载，使得浏览器能够事先缓存住这些图片。切记这边使用"setTimeout"来确保每个图片在加载下一个前被完全加载，因为许多浏览器无法同时处理2个以上的请求。为避免可能出现的停顿现象，我们在此为"load","onreadystatechange"以及"error"事件增加一个处理函数。假如缺失的图片不能被正常加载，那么"errorTimer"会做一些弥补工作。
{% highlight JavaScript %}
function preloadImages() {
    if (imageURLs && imageURLs.length && imageURLs[imagesLoaded]) { // if image URLs array isn't empty
        var img = new Image(); // create a new imgage object
        img.src = imageURLs[imagesLoaded]; // set the image source to the extracted image URL
        
        setTimeout(function () {
            if (!img.complete) {
                jQuery(img).bind('onreadystatechange load error', onImageLoaded); // bind event handler
            } else {
                onImageLoaded(); // image loaded successfully, continue with the next one
            }
                        
            errorTimer = setTimeout(onImageLoaded, 1000); // handle missing files (load the next image after 1 second)
        }, 25);
    }
    else {
        showPreloadedImages();
    }
}
 
function onImageLoaded() {
    clearTimeout(errorTimer); // clear error timer
    
    imagesLoaded++; // increase image counter
    
    preloadImages(); // preload next image
}
{% endhighlight %}

为改善用户体验，我们修改"onImageLoaded"事件处理函数，目的与进度条进行交互。

首先，为显示进度条而加载jQuery UI样式表和所需的javascript文件：
{% highlight JavaScript %}
<link type="text/css" href="css/ui-lightness/jquery-ui-1.8.6.custom.css" rel="stylesheet" />
<script type="text/javascript" src="js/jquery-1.4.2.min.js"></script>
<script type="text/javascript" src="js/jquery-ui-1.8.6.custom.min.js"></script>
{% endhighlight %}

然后初始化进度条：
{% highlight JavaScript %}
$(document).ready(function () {
    $("#progressbar").progressbar({ value: 0 }); // initialize progress bar
});
{% endhighlight %}

最后，扩展"onImageLoaded"事件处理函数。每个图片在加载完毕后，进度条会重新计算进度，调整UI。
这个预加载函数的成功之处在于每个图片都被加载到了页面，在整个加载操作完成之后，所有的图片会同时呈现在页面上。
{% highlight JavaScript %}
function onImageLoaded() {
    clearTimeout(errorTimer); // clear error timer
 
    $("#imagelist").append("<span>" + imagesLoaded + ": </span><img src='" + imageURLs[imagesLoaded] + "'/>"); // append image tag to image list
 
    imagesLoaded++; // increase image counter
 
    var percent = parseInt(100 * imagesLoaded / (imageURLs.length - 1)); // calculate progress
 
    $("#progressbar").progressbar({ value: percent }); // refresh progress bar
    $("#progressbarTitle").text("Preloading progress: " + percent + "%"); 
 
    preloadImages(); // preload next image
}
{% endhighlight %}

###A small step to get better（还能做的更好）
预加载图片是一个改善用户体验，使网站显得更为专业的一个简单手段。通过程序自动分析Css规则，你能够不费力气的处理大量图片。
进度条提示用户大概还要等待加载的时间，有效提高了用户满意度。jQuery还提供了许多像进度条一样超棒的插件，使用这些插件无疑能使你的网站蓬荜生辉。

[这个链接](http://gallery.msdn.microsoft.com/scriptjunkie/Improving-User-Experience-7a95c238)包含本文所有实例，你可以略作修改再整合到自己的项目中去。


——翻译结束——
2011-03-16 12:18:35
