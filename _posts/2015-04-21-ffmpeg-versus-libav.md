---
layout: post
date: 'Tue 2015-04-21 15:05:43 +0800'
slug: "ffmpeg-versus-libav"
title: "FFmpeg versus Libav"
description: ""
category: 
tags: ZT, Programming
---

# FFmpeg versus Libav
Nikoli edited this page on Mar 22 · 23 revisions

https://github.com/mpv-player/mpv/wiki/FFmpeg-versus-Libav/42a2bd9c16b04a7aeaa6090b2def10b0df948b31

---

Relation to mpv
===============

FFmpeg and Libav are libraries for multimedia decoding (and more). Both
libraries expose almost the same API and features.

Note that both libraries actually come as a set of libraries, and both projects use the same library names. The libraries are named libavcodec, libavformat, libavutil, and more. There is a FFmpeg libavcodec and a Libav libavcodec.

Many things in mpv, including video decoding, are done via FFmpeg or Libav.
It's a major mpv dependency, and differences between FFmpeg and Libav can have
a major impact on its behavior: the number of files it can decode, whether it
decodes correctly, what video and audio filters are provided, network behavior,
and more.

FFmpeg and Libav history
========================

In 2011, parts of the FFmpeg developers were unhappy about the FFmpeg
leadership, and decided to take over. This didn't quite work out. Apparently
Fabrice Bellard, original FFmpeg developer and owner of the ffmpeg.org
domain name, decided not to hand over the domain name to the _new_
maintainers. So they followed Plan B, and forked FFmpeg, resulting in Libav.
Since then, Libav did its own development, and completely ignored whatever
FFmpeg did. FFmpeg, on the other hand, started to merge literally everything
Libav did.

The reason for the fork is most likely that the developers hate each other.
While this formulation seems somewhat sloppy, it is most likely the truth. To
this date, the ``#libav-devel`` IRC channel still has Michael Niedermayer (the
FFmpeg maintainer since 2004 according to Wikipedia) on their ban list (similar
misbehavior is exhibited by some FFmpeg developers). There is little to no
cooperation between the two projects.

More about FFmpeg's history and the fork incident can be found on Wikipedia.

Situation today
===============

FFmpeg has more features and slightly more active development than Libav,
going by mailing list and commit volume. In particular, FFmpeg's features are
a superset of Libav's features. This is because FFmpeg merges Libav's git
master on a daily basis. Libav on the other hand seems to prefer to ignore
FFmpeg development (with occasional cherry-picking of bug fixes and features).

Some Linux distributions, especially those that had Libav developers as FFmpeg
package maintainers, replaced FFmpeg with Libav, while other
distributions stick with FFmpeg. Application developers typically have to
make sure their code works with both libraries. This can be trivial to hard,
depending on the details. One larger problem is that the difference between
the libraries makes it hard to keep up a consistent level of the user experience,
since either library might silently or blatantly be not up to the task. It
also encourages library users to implement some features themselves, rather
than dealing with the library differences, or the question to which project
to contribute.

FFmpeg and Libav developers also seem to have the tendency to ignore the
damage their rivalry is causing. Apparently fighting out these issues on
the users' backs is better than reconciling. This means everyone using
these libraries either has to suffer from the differences, or reimplement
functionality that is not the same between FFmpeg and Libav. mpv does not
follow the latter approach to avoid bloat, thus the choice between FFmpeg
or Libav matters.

Is FFmpeg or Libav preferred for use with mpv?
==============================================

Although mpv attempts to work well with both FFmpeg and Libav,  FFmpeg is
preferred in general. This is simply because FFmpeg merges from Libav, and
seems to have more features and fewer bugs than Libav. Although we don't
agree with everything FFmpeg does, and we like some of Libav's general
goals and development directions, FFmpeg is just better from a practical
point of view.

It shouldn't be forgotten that Libav is doing significant and important
development, but since everything they do ends up in FFmpeg anyway, there
is barely any reason to prefer Libav over FFmpeg from the user point of view.
It's also possible that FFmpeg agrees faster to accept gross hacks to paint over
bugs and issues than Libav, however, in the user's perception FFmpeg
will perform better because of that.

Comparison between FFmpeg and Libav
===================================

This is pretty superficial, and should give only a general impression over
differences. Also, this might be biased by the personal views of the
author of this text.

FFmpeg advantages / Libav disadvantages
---------------------------------------
- merges everything from Libav, so almost all Libav features and bug fixes are
  part of FFmpeg
- seems to be more popular (more patches, more activity on the mailing lists
  and the bug tracker)
- FFmpeg definitely has more features and more complete implementations of at
  least some file formats
- Libav has very long release cycles, which force us to be backwards compatible
  with very old code. Libav also likes to miss Debian/Ubuntu deadlines.
- Sometimes FFmpeg adds APIs we want to use, and Libav doesn't have them. This
  causes us pain, and the blame goes to Libav for not providing them.
- Really messy backporting of major FFmpeg features. (E.g. see VP9
  decoder: after it was developed and merged in FFmpeg, Libav picked
  up the VP9 patches, made their own changes, both functional and
  cosmetic, squashed it into one commit. The original authors of the
  decoder had to figure out what was changed and possibly improved,
  and what was purely cosmetic.)
  (See also HEVC incident.)

FFmpeg disadvantages / Libav advantages
---------------------------------------
- the insane amount and volume of merging from a codebase that has been
  diverging for several years most likely has some negative effects on
  FFmpeg
- FFmpeg is relatively paranoid about being compatible to Libav, which adds
  bloat, and also allows Libav to dictate the API, somewhat stifling FFmpeg
  development and adding stupid artifacts to the FFmpeg ABI
- Libav is going somewhat clean directions in API development (although
  everything from this ends up in FFmpeg anyway)
- FFmpeg seems to have an "anything goes" attitude, and merges/accepts just
  about anything, sometimes only for the purpose to have it before Libav. (E.g. see
  HEVC decoder: developed mainly on the Libav side, though separate from the
  Libav repository, it was hastily merged by FFmpeg shortly before Libav was
  done with the merge that was prepared for months.)
  (See also VP9 incident.)
- FFmpeg never cleans up anything. The shit keeps piling up.
- Libav does major work cleaning up the API and internals.

Disadvantages of using Libav with mpv
=====================================

Libav lacks some features, and this list is supposed to give an overview which
missing features have a larger impact on the features mpv appears to provide.
Note that some of these features were removed from mpv's core and replaced with
FFmpeg functionality. (In some cases, it turned out only later that Libav
didn't provide the required functionality.)

- external vobsubs (.sub/.idx files) can be read only if built with FFmpeg
  (http://bugzilla.libav.org/show_bug.cgi?id=419)
- Libav misses support for a big number of various text subtitle formats
  (http://bugzilla.libav.org/show_bug.cgi?id=419)
  (mpv still has legacy parsers from mplayer, though)
- we plan to replace most video/audio filters with FFmpeg's, but Libav lacks
  some of them: vf_noise, vf_phase, vf_stereo3d, vf_pullup
  (some more MPlayer filters have been removed from mpv, but are available
  in ffmpeg's libavfilter)
- Libav PGS subtitle decoder doesn't handle multiple subtitle rects
  (http://bugzilla.libav.org/show_bug.cgi?id=418)
- Libav http implementation doesn't return the content type, which makes opening
  web radio streams slow (plus mp3 streams might fail entirely to open)
  (fixed in Libav 10?)

This list is not complete. In some cases we might not be aware of differences
in functionality and performance until we encounter it. Most mpv developers
exclusively use FFmpeg, which makes spotting such issues harder.

External Reading
================

Wikipedia: http://en.wikipedia.org/wiki/FFmpeg#History
