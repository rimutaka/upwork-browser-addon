# UpWork Search Enhancer
#### This browser extension is a tool for freelancers searching for jobs on www.upwork.com

*UpWork has a pretty good user interface, but it doesn't always work the way I want it to. This addon is a patch on top of their UI to make my life easier.*

## Viewed jobs highlight

Identify jobs you already looked at by the listing's background colour:
* new jobs - white
* viewed jobs - grey
 
This feature only works on search pages starting with https://www.upwork.com/ab/jobs/search/.

It comes handy when the same jobs appear in different searches or if you come back to the same search some time later. Only 1000 recent jobs are remembered.

![upwork screen with viewed jobs](imgs/screen-with-viewed-jobs.png)

### Technical details

Every job URL has a unique ID appended at the end. E.g. `0101cefcf75c733d23` in `https://www.upwork.com/jobs/DBA_~0101cefcf75c733d23`. The code of the extension extracts those IDs as [jobs come into view](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) on the screen and [stores them in the browser storage](https://developer.mozilla.org/en-US/docs/Web/API/Storage). When a job with a known ID [is loaded again](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) the code changes the b/g colour.

It is not necessary to open the job or click on anything - a job is considered "viewed" as soon as it was scrolled into view.

Only 1000 recent jobs are remembered to keep the list of IDs small. You can adjust that number in the source code of the extension. The type of highlight for viewed jobs can also be easily changed in the source. See `main.js` for details.

## Privacy

The extension does not transmit any data anywhere. It may store some data in your local browser storage. Check the source code if in doubt.