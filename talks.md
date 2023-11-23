---
title: Talks
metas:
    description:
        A number of talks I've given at various events about my work on web browsers and standards.
---

These are various talks I've given at various events about my work on web
browsers and standards:

## “Past and future of server-side runtimes”

_(given together with [Nicolò Ribaudo](https://github.com/nicolo-ribaudo))_

<dl>
    <dt>Event:</dt>
    <dd><a href="https://www.nodeconf.eu">NodeConf EU 2023</a></dd>
    <dt>Date:</dt>
    <dd><time datetime="2023-11-08">November 8th 2023</time></dd>
    <dt>Length:</dt>
    <dd>~25 minutes</dd>
    <dt>Slides:</dt>
    <dd><a target="_new" href="https://abotella.pages.igalia.com/past-and-future-of-server-side-runtimes">https://abotella.pages.igalia.com/past-and-future-of-server-side-runtimes</a>
</dl>

<iframe class="youtube" src="https://www.youtube-nocookie.com/embed/LdnmN2qGo0g" title="YouTube video player: Past and future of server-side runtimes" frameborder="0" allow="picture-in-picture; web-share" allowfullscreen></iframe>

The history of server-side JavaScript runtimes has seen evolutions and
revolutions in a number of aspects: ways of doing I/O, module systems,
interoperability across different runtimes, interoperability with the web, and
much more.

This talk explores this history, covering past innovations and
standardization efforts (did you know that
[CommonJS](https://wiki.commonjs.org/wiki/CommonJS) was much more than a module
system?). We then learn about [WinterCG](https://wintercg.org/), a new effort to
coordinate runtimes to interoperate with the web, and discuss how it can shape
the future of server-side JavaScript.

## “Integrating Task Attribution and `AsyncContext`”

<dl>
    <dt>Event:</dt>
    <dd><a href="https://www.chromium.org/events/blinkon-18/">BlinkOn 18</a></dd>
    <dt>Date:</dt>
    <dd><time datetime="2023-10-19">October 19th 2023</time></dd>
    <dt>Length:</dt>
    <dd>~25 minutes</dd>
    <dt>Slides:</dt>
    <dd><a target="_new" href="https://abotella.pages.igalia.com/async-context-integration">https://abotella.pages.igalia.com/async-context-integration</a></dd>
</dl>

<iframe class="youtube" src="https://www.youtube-nocookie.com/embed/vGCOwR73hC8" title="YouTube video player: Integrating Task Attribution and AsyncContext" frameborder="0" allow="picture-in-picture; web-share" allowfullscreen></iframe>

[`AsyncContext`](https://github.com/tc39/proposal-async-context) is a TC39
proposal that tracks user-provided values across asynchronous continuations
(`await` points), as well as web APIs such as event handlers. The work that's
currently being done in
[task attribution](https://docs.google.com/document/d/1_m-h9_KgDMddTS2OFP0CShr4zjU-C-up64DwCrCfBo4/edit?usp=sharing)
also tracks browser-internal values across asynchronous continuations and web
APIs. It would be better to layer one of these two features on top of the other,
in Chromium and in the specifications.

This session aims to discuss this integration, whether the semantics of these
two features agree in regards to web APIs, and how they should be layered.

## “Updates on `line-clamp`”

<dl>
    <dt>Event:</dt>
    <dd><a href="https://www.chromium.org/events/blinkon-18/">BlinkOn 18</a></dd>
    <dt>Date:</dt>
    <dd><time datetime="2023-10-17">October 17th 2023</time></dd>
    <dt>Length:</dt>
    <dd>3-minute lightning talk</dd>
    <dt>Slides:</dt>
    <dd><a target="_new" href="https://abotella.pages.igalia.com/line-clamp-2023">https://abotella.pages.igalia.com/line-clamp-2023</a></dd>
</dl>

<iframe class="youtube" src="https://www.youtube-nocookie.com/embed/VZNm7ik4hdE" title="YouTube video player: Updates on line-clamp" frameborder="0" allow="picture-in-picture; web-share" allowfullscreen></iframe>

This lightning talk discusses the updates on `line-clamp` that happened since
the previous edition of BlinkOn, in particular about how the CSS Working Group
is working on two separate proposals, and on how I made working implementations
in Chromium for both of them.

## “Specifying `line-clamp`”

<dl>
    <dt>Event:</dt>
    <dd><a href="https://www.chromium.org/events/blinkon-17/">BlinkOn 17</a></dd>
    <dt>Date:</dt>
    <dd><time datetime="2022-11-15">November 15th 2022</time></dd>
    <dt>Length:</dt>
    <dd>~3-minute lightning talk</dd>
    <dt>Slides:</dt>
    <dd><a target="_new" href="https://abotella.pages.igalia.com/blink-on-17-line-clamp">https://abotella.pages.igalia.com/blink-on-17-line-clamp</a></dd>
</dl>

<iframe class="youtube" src="https://www.youtube-nocookie.com/embed/DWZ3BcDSpo0" title="YouTube video player: Updates on line-clamp" frameborder="0" allow="picture-in-picture; web-share" allowfullscreen></iframe>

This lightning talk discusses the `-webkit-line-clamp` CSS property, which
clamps an element's text to a number of lines with an ellipsis at the end. It
talks about its many shortcomings, and about various proposals under discussion
by the CSS Working Group on how to fix them.
