
# Consuming Plupload Data URIs In An AngularJS Application

by [Ben Nadel][bennadel] (on [Google+][googleplus])

I've been using (and loving) [Plupload][plupload] for a long time. One of the 
features that I've played with, but never really used, was the ability to 
extract data URIs from an image file prior to upload. I mean, I've looked at 
the actual mechanics of creating a mOxie Image object and then extracting the 
data URI; but, I've never really thought about how to consume that in the 
context of an application.

This project is an exploration of how one might leverage data URIs in the 
context of an [AngularJS][angularjs] application in which data URIs need to be
used alongside actual image URLs that point to remote binary files. 


[bennadel]: http://www.bennadel.com
[googleplus]: https://plus.google.com/108976367067760160494?rel=author
[plupload]: http://plupload.com
[angularjs]: http://angularjs.org
