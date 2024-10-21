---
title: Newline normalizations in form submissions
date: 2021-05-27T15:05:15Z
updated: 2023-03-02T10:29:17Z
published: true
description:
    During form submissions in browsers, newlines get normalized to CRLF. That
    normalization is more complex than you might think. This is a deep dive on
    the recent HTML standard changes in that area (as of May 2021).
tags:
    - web browsers
    - web specifications
    - form submission
---

_**Note:** I originally published this post
[on the WHATWG blog](https://blog.whatwg.org/newline-normalizations-in-form-submission).
When reposting it in this blog (in March 2023), I added syntax highlighting,
fixed a few typos, and added a clarifying comment on one of the code samples._

If you work with form submissions, you might have noticed that form values
containing newlines are normalized to CRLF, no matter whether the DOM value had
LF or CR instead:

```html
<form action="./post" method="post" enctype="application/x-www-form-urlencoded">
  <input type="hidden" name="hidden" value="a&#x0D;b&#x0A;c&#x0D;&#x0A;d" />
  <input type="submit" />
</form>

<script>
  // Checking that the DOM has the correct newlines and the normalization
  // happens during the form submission.
  const hiddenInput = document.querySelector("input[type=hidden]");
  console.log("%s", JSON.stringify(hiddenInput.value)); // "a\rb\nc\r\nd"
</script>
```

```
hidden=a%0D%0Ab%0D%0Ac%0D%0Ad
```

But although it might seem simple on the surface, newline normalization in form
submissions is a topic that runs deeper than I thought, with bugs in the spec
and differences across browsers. This post goes through what the spec used to
do, what browsers (used to) implement, and how we went about fixing it.

## First, some background on form submission

The data to submit from a form is modeled as an
[entry list](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#entry-list)
– entries being pairs of names (strings) and values (either strings or
[`File`](https://w3c.github.io/FileAPI/#file-section) objects). This is a list
rather than a map because a form can have multiple values for each name – which
is how <lang html> `<input type="file" multiple>` and `<select multiple>`</lang>
work – and their relative order with the rest of form entries matters.

The algorithm that does the job of going through every submittable element
associated with a particular form and collecting their corresponding form
entries is the
["construct the entry list"](https://html.spec.whatwg.org/commit-snapshots/4cfb2b76873e23e8a8ac762f5ddaa0a6630b3e6e/#constructing-form-data-set)
algorithm. This algorithm does what you'd expect – it discards disabled controls
and buttons not pressed, and then for each control it calls the
["append an entry"](https://html.spec.whatwg.org/commit-snapshots/4cfb2b76873e23e8a8ac762f5ddaa0a6630b3e6e/#append-an-entry)
algorithm, which used to replace any newlines in the entry name and value (if
that value is a string) with CRLF before appending the entry.

"Construct the entry list" is called early into the form submission algorithm,
and the resulting entry list is then passed to the encoding algorithm for the
corresponding enctype. Since only the `multipart/form-data` enctype supports
uploading files, the algorithms for both `application/x-www-form-urlencoded` and
`text/plain` encode the value's filename instead.

## First signs of trouble

My first foray into the encoding of form payloads was in defining precisely how
entry names (and filenames of file entry values) had to be escaped in
`multipart/form-data` payloads, and since LF and CR have to be percent escaped,
newlines came up during testing.

One thing I noticed is that, if you have newlines inside a filename – yes, that
is something you can have – they're normalized differently than for an entry
name or a string value.

```html
<form id="form" action="./post" method="post" enctype="multipart/form-data">
  <input type="hidden" name="hidden a&#x0D;b" value="a&#x0D;b" />
  <input id="fileControl" type="file" name="file a&#x0D;b" />
</form>

<script>
  // A file with filename "a\rb", empty contents, and "application/octet-stream"
  // MIME type.
  const file = new File([], "a\rb");

  // This is a hack to add files to an <input type="file"> from JS.
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  document.getElementById("fileControl").files = dataTransfer.files;

  document.getElementById("form").submit();
</script>
```

Here is the resulting `multipart/form-data` payload in Chrome and Safari
(newlines are always CRLF):

```
------WebKitFormBoundaryjlUA0jn3NUYxIh2A
Content-Disposition: form-data; name="hidden a%0D%0Ab"

a
b
------WebKitFormBoundaryjlUA0jn3NUYxIh2A
Content-Disposition: form-data; name="file a%0D%0Ab"; filename="a%0Db"
Content-Type: application/octet-stream


------WebKitFormBoundaryjlUA0jn3NUYxIh2A--
```

And this is in Firefox 88 (the current stable version as of this writing):

```
-----------------------------26303884030012461673680556885
Content-Disposition: form-data; name="hidden a b"

a
b
-----------------------------26303884030012461673680556885
Content-Disposition: form-data; name="file a b"; filename="a b"
Content-Type: application/octet-stream


-----------------------------26303884030012461673680556885--
```

As you can see, Firefox substitutes a space for any newlines (CR, LF or CRLF) in
the `multipart/form-data` encoding of entry names and filenames, rather than
percent-encoding them as do Chrome and Safari. This behavior was made illegal in
the spec in pull request [#6282](https://github.com/whatwg/html/pull/6282), but
it couldn't be fixed in Firefox until the spec decided on a normalization
behavior. In the case of values, Firefox normalizes to CRLF as the other
browsers do.

As for Chrome and Safari, here we see that newlines in entry names and string
values are normalized to CRLF, but filenames are not normalized. From the entry
list construction algorithm as described above, this makes sense because entry
values are only normalized to CRLF _when they are strings_ – files are
unchanged, and so are their filenames.

Except that, if you change the form's enctype in the above example to
`application/x-www-form-urlencoded`, you get this in every browser:

```
hidden+a%0D%0Ab=a%0D%0Ab&file+a%0D%0Ab=a%0D%0Ab
```

Since `multipart/form-data` is the only enctype that allows file uploads, other
enctypes use their filenames instead. But here it seems like every browser is
CRLF-normalizing the filenames, even though in the spec that substitution
happens long after constructing the entry list.

## Normalizations with `FormData` and `fetch`

The [`FormData`](https://xhr.spec.whatwg.org/#interface-formdata) class started
out as a way to send `multipart/form-data` form payloads through the
`XMLHttpRequest` and `fetch` APIs without having to generate that payload in
JavaScript. As such, `FormData` instances are basically a JS-accessible wrapper
over an entry list.

So let's try the same with `FormData`:

```js
const formData = new FormData();
formData.append("hidden a\rb", "a\rb");
formData.append("file a\rb", new File([], "a\rb"));

// FormData objects in fetch will always be serialized as multipart/form-data.
await fetch("./post", { method: "POST", body: formData });
```

Safari sends the same form payload as above, with names and values normalized to
CRLF, and so does Firefox 88 with values normalized to CRLF (and names and
values having their newlines escaped as spaces). But Chrome keeps names,
filenames and values unnormalized (here the `␍` character stands for CR):

```
------WebKitFormBoundarySMGkMfD8mVOnmGDP
Content-Disposition: form-data; name="hidden a%0Db"

a␍b
------WebKitFormBoundarySMGkMfD8mVOnmGDP
Content-Disposition: form-data; name="file a%0Db"; filename="a%0Db"
Content-Type: application/octet-stream


------WebKitFormBoundarySMGkMfD8mVOnmGDP--
```

Since `FormData` is just a wrapper over an entry list, and `fetch` simply calls
the `multipart/form-data` encoding algorithm, no normalizations should take
place. So it looks like Chrome was following the spec here, while Firefox and
Safari were apparently doing some newline normalization (for Firefox, only on
values) at the time of serializing as `multipart/form-data`.

With `FormData` you can also investigate what the "construct the entry list"
algorithm does, since if you pass a <lang html> `<form>`</lang> element to the
`FormData` constructor, it will call that algorithm outside of a form submission
context, and let you inspect the resulting entry list.

```html
<form id="form">
  <input type="hidden" name="a&#x0D;b" value="a&#x0D;b" />
</form>

<script>
  const formData = new FormData(document.getElementById("form"));
  for (const [name, value] of formData.entries()) {
    console.log("%s %s", JSON.stringify(name), JSON.stringify(value));
  }
  // Firefox and Safari print: "a\rb" "a\rb"
  // Chrome prints: "a\r\nb" "a\r\nb"
  // These results don't depend on the form's enctype.
</script>
```

So it seems like Firefox and Safari are not normalizing as they construct the
entry list, and instead normalize names and values at the time that they encode
the form into an enctype. In particular, since the
`application/x-www-form-urlencoded` and `text/plain` enctypes don't allow file
uploads, file entry values are substituted with their filenames _before_ the
normalization. Entry lists that aren't created from the "construct an entry
list" algorithm get normalized all the same.

Chrome instead follows the specification (as it used to be) in normalizing in
"construct an entry list" and not normalizing later, even for entry lists
created through other means. But that doesn't explain why filenames in the
`application/x-www-form-urlencoded` and `text/plain` enctypes are normalized.
Does Chrome also have an additional normalization layer?

## Investigating late normalization with the `formdata` event

It would be great to investigate in more detail what Chrome and other browsers
do _after_ constructing the entry list. Since the entry list construction
already normalizes entries, any further normalizations that might happen further
down the line are obscured in the common case.

In the case of `multipart/form-data`, we can test this because using a
`FormData` object with `fetch` doesn't invoke "construct an entry list", and so
can see what happens to unnormalized entries. For other enctypes there is no way
to create an entry list that doesn't go through "construct an entry list", but
as it turns out, the "construct an entry list" algorithm itself offers two ways
to end up with unnormalized entries:
[form-associated custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html#form-associated-custom-elements)
(only implemented in Chrome so far) and the
[`formdata` event](https://html.spec.whatwg.org/multipage/indices.html#event-formdata)
(implemented in Chrome and Firefox). Here we'll only be covering the latter,
since their results are equivalent.

One thing I skipped when I covered the "construct an entry list" algorithm above
is that, at the end of the algorithm, after all entries corresponding to
controls have been added to the entry list, a `formdata` event is fired on the
relevant <lang html> `<form>`</lang> element. This event has a `formData` field
which allows you not only to inspect the entry list at that point, but to modify
it.

```html
<form
  id="form"
  action="./post"
  method="post"
  enctype="application/x-www-form-urlencoded"
>
  <!-- Empty -->
</form>

<script>
  const form = document.getElementById("form");
  form.addEventListener("formdata", (evt) => {
    evt.formData.append("string a\rb", "a\rb");
    evt.formData.append("file a\rb", new File([], "a\rb"));
  });
  form.submit();
</script>
```

For both Chrome and Firefox (not Safari because it doesn't support the
`formdata` event), trying this with the `application/x-www-form-urlencoded`
enctype gets you a normalized result:

```
string+a%0D%0Ab=a%0D%0Ab&file+a%0D%0Ab=a%0D%0Ab
```

Firefox shows the same normalizations for the `text/plain` enctype; Chrome
instead normalizes only filenames, not names and values. And with
`multipart/form-data` we get the same result as with `fetch` and `FormData`
above: Chrome doesn't normalize anything, Firefox normalizes string values (with
names and filenames being replaced with spaces).

So in short:

- For `application/x-www-form-urlencoded`, all browsers perform an additional
  newline normalization at the moment of serializing the form payload, whether
  or not they normalize when constructing the entry list. Note that newline
  normalizations are idempotent, so normalizing an already normalized string
  doesn't change it.
- For `text/plain`, Firefox and Safari seem to act just like for
  `application/x-www-form-urlencoded`. Chrome instead only normalizes filenames,
  probably at the same time as files are being substituted with their filenames.
- For `multipart/form-data`, Chrome doesn't normalize anything. Safari instead
  normalizes names and string values, but not filenames. Firefox does the same
  as Safari for values, but replaces any newlines in names and filenames with a
  space.

Remember that these differences across browsers don't really affect the encoding
of normal forms, they only matter if you're using `FormData` with `fetch`, the
`formdata` event, or form-associated custom elements.

## Fixing the spec

So which behavior do we choose? Firefox replacing newlines in
`multipart/form-data` names and values with a space is illegal as per
[PR #6282](https://github.com/whatwg/html/pull/6282), but anything else is fair
game.

For `text/plain`, we have Firefox and Safari behaving in the same way, and
Chrome disagreeing. Since `text/plain` cannot represent inputs unambiguously, is
little used in any case, and you would need to use either form-associated custom
elements or the `formdata` event to see a difference, it seems extremely
unlikely that there is web content that depends on either case. So it makes more
sense to treat `text/plain` just like `application/x-www-form-urlencoded` and
normalize names, filenames and values.

For `multipart/form-data`, there is the added compatibility risk that you can
observe this case by using `FormData` and `fetch`, so it's more likely to cause
webcompat issues, no matter whether we went with Safari's or Chrome's behavior.
In the end we choose to go with Safari's, in order to be consistent at
normalizing all enctypes – although `multipart/form-data` has to be different in
not normalizing filenames, of course.

So in pull request [#6287](https://github.com/whatwg/html/pull/6287) we fixed
this by:

1. Adding
   [a new algorithm](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#converting-an-entry-list-to-a-list-of-name-value-pairs)
   that runs before the `application/x-www-form-urlencoded` and `text/plain`
   serializers. This algorithm first extracts a filename from the entry value,
   if it's a file, and then CRLF-normalizes both the name and value.
1. We changed the
   [`multipart/form-data` encoding algorithm](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#multipart-form-data)
   to have a first step that CRLF-normalizes names and string values, leaving
   file values intact.

## Do we need the early normalization though?

At the time that we decided the above changes to the spec, I still thought that
the spec's (and Chrome's) behavior of normalizing in "construct the entry list"
was correct. But later on I realized that, once we have the late normalizations
mentioned above, the early normalization in "construct the entry list" doesn't
matter for form submission, since the late normalizations do everything the
early one can do and more. The only way you could observe whether that early
normalization is present or not is through the `FormData` constructor or the
`formdata` event. So it would make sense to remove that early normalization and
standardize on Firefox and Safari's behavior here, as we did in pull request
[#6624](https://github.com/whatwg/html/pull/6624).

One kink remained, though: <lang html> `<textarea>`</lang> elements support the
[`wrap="hard"`](https://html.spec.whatwg.org/#attr-textarea-wrap) attribute,
which adds linebreaks into the submitted value corresponding to how the text is
linewrapped in the UI. In the spec, this is done through the
["textarea wrapping transformation"](https://html.spec.whatwg.org/commit-snapshots/4cfb2b76873e23e8a8ac762f5ddaa0a6630b3e6e/#textarea-wrapping-transformation),
which takes the textarea's
["raw value"](https://html.spec.whatwg.org/#concept-textarea-raw-value),
normalizes it to CRLF, and when `wrap="hard"`, adds CRLF newlines to wrap the
contents. But if you test this on Safari, all newlines (both normalized and
added) are LF – and Firefox currently doesn't implement `wrap="hard"`, but it
does normalize newlines to LF. So should this be changed?

I thought it was better to align on Firefox's and Safari's behavior, especially
since this could simplify the mess that is the difference between "raw value",
"API value" and "value" for <lang html> `<textarea>`</lang> in the spec. Chrome
disagreed at first –
[but as it turns out](https://github.com/whatwg/html/issues/6647#issuecomment-834168065),
Chrome's implementation of the textarea wrapping transformation already
normalizes to LF, and it's only the normalization in "construct an entry list"
that then changes those newlines to be CRLF. So removing the early normalization
would be enough for Chrome to align with Firefox and Safari, even in this case.

Pull request [#6697](https://github.com/whatwg/html/pull/6697) fixes this issue
with <lang html> `<textarea>`</lang> in the spec, and the follow-up issue
[#6662](https://github.com/whatwg/html/issues/6662) will take care of
simplifying the textarea wrapping transformation in the spec, as well as ensure
that it matches implementations.

## Implementation fixes

After those three pull requests, the current spec mandates that no normalization
happen in "construct the entry list", and that the entry lists to be encoded
with some enctype go through a transformation that depends on the enctype:

- For `application/x-www-form-urlencoded` and `text/plain`, this transformation
  first replaces file values with their filenames, and then CRLF-normalizes
  names and values.
- For `multipart/form-data`, this transformation CRLF-normalizes names and
  string values, but not filenames.

Safari implements the current spec behavior, and so doesn't need any fixes as a
result of these spec changes. However, when working on them I noticed that
Safari had a preexisting bug in that it wasn't converting entry names and string
values
[into scalar value strings](https://infra.spec.whatwg.org/#javascript-string-convert)
in the "construct an entry list" algorithm, which could lead to `FormData`
objects containing `DOMString` values despite the WebIDL declaration. What's
more, those lone surrogates would remain there until the time of serializing the
form, and might show up in the form payload as
[WTF-8](https://simonsapin.github.io/wtf-8) surrogate byte sequences. This is
[bug 225299](https://bugs.webkit.org/show_bug.cgi?id=225299).

Firefox acts much like Safari, except in that it escapes newlines in
`multipart/form-data` names and filenames as spaces rather than CRLF-normalizing
in the case of names and then percent-encoding. With the normalization now
defined in the spec, this could now be changed. This is
[bug 1686765](https://bugzilla.mozilla.org/show_bug.cgi?id=1686765). I
additionally also found the same bug as Safari with not converting strings into
scalar value strings, except in this case the normalization did take place when
encoding ([bug 1709066](https://bugzilla.mozilla.org/show_bug.cgi?id=1709066)).
Both issues are now fixed in Firefox Nightly and will ship on Firefox 90.

Finally, Chrome would need to remove the normalization it performs in "construct
an entry list", update the normalization it performs on the `text/plain` enctype
to cover not only filenames but also names and values, and add an additional
normalization for `multipart/form-data` names and values. This is covered in
[issue 1167095](https://bugs.chromium.org/p/chromium/issues/detail?id=1167095).
Since Chrome is the browser that needs the most changes as a result of these
spec updates, and they are understandably concerned with backwards
compatibility, these fixes are expected to ship behind a flag so they can be
quickly rolled back in case of trouble.

## Conclusion

Although form submission is not necessarily seen as an easy topic, newline
normalization in that context might not seem like such a big deal from the
outside. But in a platform like the web, where spec and implementation decisions
can easily snowball into compatibility concerns, even things that might look
simple might have a history that makes standardizing on one behavior hard.
