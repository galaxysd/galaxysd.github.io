---
layout: post
title: "让Jekyll支持Latex"
description: ""
category: Blog
tags: [Jekyll, Latex, Blog Maintenance, ZT]
---

<!-- 这几天蛋疼，又折腾了一下blog，从原来的Octopress又弄成了Jekyll。
意料之外的是，妹纸看到Jekyll Bootstrap的模板颇为喜欢，说比Octopress默认的好看多了=_=...然后我就莫名其妙地多了一个任务，研究出Jekyll怎么支持Latex，并帮她搭一个blog...Orz -->

三步轻松解决，环保节能无公害(大概):

1. 在_layouts/default.html内加入以下内容
{% highlight JavaScript %}
<!-- MathJax Section -->
<script type="text/javascript"
src="http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
<script>
    MathJax.Hub.Config({
          tex2jax: {
          skipTags: ['script', 'noscript', 'style', 'textarea', 'pre']
          }
    });
    MathJax.Hub.Queue(function() {
        var all = MathJax.Hub.getAllJax(), i;
        for(i=0; i < all.length; i += 1) {
            all[i].SourceElement().parentNode.className += ' has-jax';
        }
    });
</script>
{% endhighlight %}

2. 上一步已经加入了has-jax字符串，接下来再更改style.css
{% highlight css %}
body div.content {}
    body div.content code.has-jax {
        font: inherit;
        font-size: 100%;
        background: inherit;
        border: inherit;
        color: #000000;
    }
{% endhighlight %}

3. 然后就没有什么事了…
    `\[
    \frac{1}{\Bigl(\sqrt{\phi \sqrt{5}}-\phi\Bigr) e^{\frac25 \pi}} =
    1+\frac{e^{-2\pi}} {1+\frac{e^{-4\pi}} {1+\frac{e^{-6\pi}}
    {1+\frac{e^{-8\pi}} {1+\ldots} } } }
    \]`

Reference:

[LaTeX Math Magic](http://cwoebker.com/posts/latex-math-magic/)


