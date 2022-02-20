// constants

// the maximum number of job IDs to be tracked in the local storage
const jobIdCountLimit = 1000;
// a custom class for "viewed" jobs
const css = ".mvx-viewed {background-color: #f2f2f2;}";
// a custom attr with the job ID added to jobs
const jobIdAttrName = "data-mvx-jobid";
// a container with the list of jobs
const jobsContainerSelector = "div[data-v2-job-list]";
// params of what is considered to be a visible (viewed) job
const visOptions = { root: null, rootMargin: "0px", threshold: 1.0 };

const mutationObserverOptions = { childList: true, subtree: true };

// add custom CSS to the page
var style = document.createElement('style');
style.appendChild(document.createTextNode(css));
document.head.appendChild(style);

// restore the list of viewed job IDs
let viewedIDs = [];
let storedViewedIDs = window.localStorage.getItem("viewedIDs", viewedIDs);
if (storedViewedIDs) viewedIDs = JSON.parse(storedViewedIDs);

/** Trims and saves the list of the latest jobs in local storage */
function storeViewedIDs() {
  while (viewedIDs.length > jobIdCountLimit) { viewedIDs.shift(); }
  window.localStorage.setItem("viewedIDs", JSON.stringify(viewedIDs));
}

/** Check for addition of new jobs to the page and start monitoring their visibility. */
function trackJobVisibility() {
  if (!jobsContainer) jobsContainer = document.querySelector(jobsContainerSelector);
  if (!jobsContainer) {
    console.log("Could not find element with " + jobsContainerSelector)
    return
  };
  jobsContainer.querySelectorAll("a.job-title-link:not(.mvx-tracked)").forEach(element => {

    element.classList.add("mvx-tracked"); // mark the element as processed

    // get job id
    const href = element.getAttribute("href").split("~");
    if (href.length < 2) return; // the URL has no id - no point watching it
    const jobId = href[href.length - 1].replace("/", "");

    // viewed job - find parent SECTION
    let aParent = element.parentElement;
    while (aParent && aParent.tagName != "SECTION") aParent = aParent.parentElement;
    if (!aParent) return; // didn't find SECTION parent

    // mark the entire section if it was before viewed
    if (viewedIDs.includes(jobId)) {
      aParent.classList.add("mvx-viewed");
      return;
    }

    // start watching the job coming into view 
    aParent.setAttribute(jobIdAttrName, jobId); // store it there for later
    let observer = new IntersectionObserver(jobViewedCallback, visOptions);
    observer.observe(aParent);
  });
}

/** Add job id to the list fo viewed jobs when it was scrolled into view. */
const jobViewedCallback = (entries, observer) => {
  entries.forEach(entry => {
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

// Try to get the jobs container.
// It is usually empty on the first run - we'll try again later in the code
let jobsContainer = document.querySelector(jobsContainerSelector);

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
