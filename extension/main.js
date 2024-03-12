// constants

// the maximum number of job IDs to be tracked in the local storage
const jobIdCountLimit = 1000;
// a custom class for "viewed" jobs
const css = ".mvx-viewed {background-color: #f2f2f2;}";
// a custom attr with the job ID added to jobs
const jobIdAttrName = "data-mvx-jobid";
// a container with the list of jobs
const jobsContainerSelector = "div[data-test='job-tile-list']";
// params of what is considered to be a visible (viewed) job
const visOptions = { root: null, rootMargin: "0px", threshold: 1.0 };

const mutationObserverOptions = { childList: true, subtree: true };

// console.log("main started");

// add custom CSS to the page to grey-out viewed posts
var style = document.createElement('style');
style.appendChild(document.createTextNode(css));
document.head.appendChild(style);

// restore the list of viewed job IDs from local storage
let viewedIDs = [];
let storedViewedIDs = window.localStorage.getItem("viewedIDs", viewedIDs);
if (storedViewedIDs) viewedIDs = JSON.parse(storedViewedIDs);

/** Trims and saves the list of the latest jobs in local storage */
function storeViewedIDs() {
  while (viewedIDs.length > jobIdCountLimit) { viewedIDs.shift(); }
  window.localStorage.setItem("viewedIDs", JSON.stringify(viewedIDs));
}

/** Checks for addition of new jobs to the page and starts monitoring their visibility
 * by adding an observer that calls jobViewedCallback when the post becomes visible.
 */
function trackJobVisibility() {
  // get the list of job posts containers using their signature selector
  // the UI is constantly changing and so is the selector
  // console.log("trackJobVisibility called");
  if (!jobsContainer) jobsContainer = document.querySelector(jobsContainerSelector);
  if (!jobsContainer) {
    console.log("Could not find element with " + jobsContainerSelector)
    return
  };
  // Example HTML
  {/* 
<section class="air3-card-section air3-card-hover p-4 px-2x px-md-4x" data-ev-opening_uid="1765766588123095040" data-ev-position="8" data-ev-feed_name="My Feed" data-ev-sublocation="job_feed_tile" data-ev-label="visible_job_tile_impression" data-ev-label-prefix="" impression="" data-mvx-jobid="012759408f472276fc" eh-i="true">
  <div class="air3-grid-container mb-2x gap-0"><!---->
    <div class="span-11 pr-10x">
      <h3 class="my-0 p-sm-right job-tile-title h5"><a href="/jobs/Freelance-Copywriter-English-German_~012759408f472276fc/?referrer_url_path=find_work_home" data-ev-label="link" class="air3-link text-decoration-none mvx-tracked">Freelance - Copywriter English/German</a></h3>
    </div>
  </div>
</section>
*/}

  jobsContainer.querySelectorAll("h3.job-tile-title > a:not(.mvx-tracked)").forEach(element => {
    console.log("Found a:not(.mvx-tracked)");

    element.classList.add("mvx-tracked"); // mark the element as processed

    // get job id from the URL, e.g. https://www.upwork.com/jobs/Texting_~017cc209e2f459f3d6/?referrer_url_path=find_work_home
    const href = element.getAttribute("href").split("~");
    if (href.length < 2) return; // the URL has no id - no point watching it
    const jobId = href[href.length - 1].split("/")[0];
    // console.log(`JobID: ${jobId}`);

    // viewed job - find parent SECTION element
    let aParent = element.parentElement;
    while (aParent && aParent.tagName != "SECTION") aParent = aParent.parentElement;
    if (!aParent) return; // didn't find SECTION parent

    // grey-out the entire section element if it's in the list of viewed jobs
    if (viewedIDs.includes(jobId)) {
      aParent.classList.add("mvx-viewed");
      return;
    }

    // the job section hasn't been viewed yet - start watching it coming into view 
    aParent.setAttribute(jobIdAttrName, jobId); // store it there for later
    let observer = new IntersectionObserver(jobViewedCallback, visOptions);
    observer.observe(aParent);
  });
}

/** A callback for IntersectionObserver to add the job id from the section that came into view
 * to the list of viewed jobs. */
const jobViewedCallback = (entries, observer) => {
  entries.forEach(entry => {
    // only process posts that are almost fully in the view
    if (entry.intersectionRatio > 0.95) {
      observer.disconnect(); // no need to watch it any longer
      // add the job ID to the list of viewed jobs
      const jobId = entry.target.getAttribute(jobIdAttrName);
      if (!viewedIDs.includes(jobId)) {
        viewedIDs.push(jobId);
        // save in local storage when not too busy
        window.requestIdleCallback(storeViewedIDs, { timeout: 3000 });
      }
    }
  });
};

/** Watch for addition of job data to grab the job container node. */
const bodyObserver = new MutationObserver((mutations, observer) => {
  if (!jobsContainer) jobsContainer = document.querySelector(jobsContainerSelector);
  if (jobsContainer) {
    observer.disconnect(); // only has to run until the container appears
    trackJobVisibility(); // check for jobs that are already there
    // start watching for new jobs
    jobContainerObserver.observe(jobsContainer, mutationObserverOptions);
  }
});

/** Watch for addition of job data. */
const jobContainerObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
      trackJobVisibility();
      return;
    }
  });
});

// Code execution starts here ============================================
// console.log("code started");

// Try to get the jobs container.
// It is usually empty on the first run - we'll try again later in the code
let jobsContainer = document.querySelector(jobsContainerSelector);
// console.log(`Jobs container: ${jobsContainer}`);

// start processing the page here
if (!jobsContainer) {
  // watch the entire document until there is a job container
  bodyObserver.observe(document.body, mutationObserverOptions);
  console.log("Jobs container not found. Observing BODY for content changes.")
}
else {
  // this call is preferred because of it's narrower scope
  jobContainerObserver.observe(jobsContainer, mutationObserverOptions);
}
