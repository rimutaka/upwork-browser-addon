# Quicker UpWork Search

This extension greys out _upwork.com_ job posts you looked at earlier to help you scroll through the list of UpWork jobs faster:

- **new jobs** - keep their original white background
- **viewed jobs** - greyed-out
 
This feature works only on search pages starting with https://www.upwork.com/nx/find-work/. Only 1000 recent jobs are remembered.

![UpWork screen with viewed jobs](imgs/screen-with-viewed-jobs.png)

## Technical details

Every job URL has a unique ID appended at the end. E.g. `0101cefcf75c733d23` in `https://www.upwork.com/jobs/DBA_~0101cefcf75c733d23`. The code of the extension extracts those IDs as [jobs come into view](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) on the screen and [stores them in the browser storage](https://developer.mozilla.org/en-US/docs/Web/API/Storage). When a job with a known ID [is loaded again](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) the code changes the b/g color of the job post section.

![UpWork screen with viewed jobs](imgs/tech-details.png)

It is not necessary to open the job or click on anything to mark the job as viewed - the job is counted as "viewed" when it is scrolled into view.

Only 1,000 recent job IDs are saved to keep the list of IDs small.

## Privacy

The extension does not transmit any data anywhere. It may store some data in your local browser storage. Fully open source: https://github.com/rimutaka/upwork-browser-addon/