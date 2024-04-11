// constants

// the maximum number of job IDs to be tracked in the local storage
const jobIdCountLimit = 1000;
// a custom class for "viewed" jobs
const css = ".mvx-viewed {background-color: #f2f2f2 !important;}";
// a custom attr with the job ID added to jobs
const jobIdAttrName = "data-mvx-jobid";
// a container with the list of jobs, different on different pages
const jobsContainerSelectors = ["div[data-test='job-tile-list']", "#main"];
// params of what is considered to be a visible (viewed) job
const visOptions = { root: null, rootMargin: "0px", threshold: 1.0 };

const mutationObserverOptions = { childList: true, subtree: true };

// console.debug("main started");

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
  // console.debug("trackJobVisibility called");
  if (!jobsContainer) jobsContainer = document.querySelector(jobsContainerSelectors[0]);
  if (!jobsContainer) jobsContainer = document.querySelector(jobsContainerSelectors[1]);
  if (!jobsContainer) {
    console.warn("Could not find element with " + JSON.stringify(jobsContainerSelectors))
    return
  };
  // Example HTML (find jobs)
  {/* 
<section class="air3-card-section air3-card-hover p-4 px-2x px-md-4x" data-ev-opening_uid="1765766588123095040" data-ev-position="8" data-ev-feed_name="My Feed" data-ev-sublocation="job_feed_tile" data-ev-label="visible_job_tile_impression" data-ev-label-prefix="" impression="" data-mvx-jobid="012759408f472276fc" eh-i="true">
  <div class="air3-grid-container mb-2x gap-0"><!---->
    <div class="span-11 pr-10x">
      <h3 class="my-0 p-sm-right job-tile-title h5"><a href="/jobs/Freelance-Copywriter-English-German_~012759408f472276fc/?referrer_url_path=find_work_home" data-ev-label="link" class="air3-link text-decoration-none mvx-tracked">Freelance - Copywriter English/German</a></h3>
    </div>
  </div>
</section>
*/}

  // Example HTML (search results)
  {/**
<section class="card-list-container mvx-viewed" data-v-43da1ed8="" data-test="JobsList" data-mvx-jobid="0125f8df8fb59342ad">
  <article data-ev-job-uid="1767851574598934528" data-ev-label="search_results_impression" data-ev-label-prefix="" data-ev-sublocation="search_results" data-ev-page_number="1" data-ev-position="1" impression="0.5" data-ev-job-is_sts_vector_search_result="false" class="job-tile cursor-pointer px-md-4 air3-card air3-card-list px-4x" data-v-4f6b910a="" data-test="JobTile" data-test-key="1767851574598934528" eh-i="true"><!---->
    <div class="d-flex job-tile-header" data-v-4f6b910a="">
      <div class="d-flex flex-column job-tile-header-line-height flex-1 mr-4 mb-3 flex-wrap" data-v-03a16554="" data-v-4f6b910a="" data-test="JobTileHeader"><small class="text-light mb-1" data-v-03a16554=""><span data-v-03a16554="">Posted</span> <span data-v-03a16554="">yesterday</span></small>
        <div data-ev-sublocation="!line_clamp" class="air3-line-clamp-wrapper" style="--lines: 2; --line-clamp-expanded-height: false; --line-clamp-line-height: undefinedpx;" data-v-03a16554="" data-test="UpCLineClamp"><!---->
          <div id="air3-line-clamp-14" tabindex="-1" class="air3-line-clamp is-clamped">
            <h2 class="h5 mb-0 mr-2 job-tile-title" data-v-03a16554="">
              <a data-v-03a16554="" href="/jobs/Freelance-Yocto-Linux-Developer-for-IoT-Device-Energy-Monitoring-Project_~01403b3280ce16796f/?referrer_url_path=/nx/search/jobs/" class="up-n-link mvx-tracked" data-test="UpLink">Freelance Yocto Linux Developer for IoT Device Energy Monitoring Project</a>
            </h2>
          </div> <!---->
        </div>
      </div>
    </div>
  </article> <!---->
</section>
*/}

  jobsContainer.querySelectorAll("a:not(.mvx-tracked)[href^='/jobs/'").forEach(element => {
    // console.debug("Found a:not(.mvx-tracked)[href^='/jobs/'");

    element.classList.add("mvx-tracked"); // mark the element as processed

    // get job id from the URL, e.g. https://www.upwork.com/jobs/Texting_~017cc209e2f459f3d6/?referrer_url_path=find_work_home
    const href = element.getAttribute("href").split("~");
    if (href.length < 2) return; // the URL has no id - no point watching it
    const jobId = href[href.length - 1].split("/")[0];
    // console.debug(`JobID: ${jobId}`);

    // viewed job - find parent SECTION element
    let aParent = element.parentElement;
    while (aParent && aParent.tagName != "SECTION" && aParent.tagName != "ARTICLE") aParent = aParent.parentElement;
    if (!aParent) {
      // console.debug("No SECTION or ARTICLE ancestor found");
      return
    }; // didn't find SECTION or ARTICLE parent

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
        // console.debug(`Storing job ${jobId}`);
        viewedIDs.push(jobId);
        // save in local storage when not too busy
        window.requestIdleCallback(storeViewedIDs, { timeout: 3000 });
      }
    }
  });
};

/** Watch for addition of job data to grab the job container node. */
const bodyObserver = new MutationObserver((mutations, observer) => {
  if (!jobsContainer) jobsContainer = document.querySelector(jobsContainerSelectors[0]);
  if (!jobsContainer) jobsContainer = document.querySelector(jobsContainerSelectors[1]);
  if (jobsContainer) {
    observer.disconnect(); // only has to run until the container appears
    trackJobVisibility(); // check for jobs that are already there
    // start watching for new jobs
    jobContainerObserver.observe(jobsContainer, mutationObserverOptions);
  }
  else {
    // console.debug("No jobsContainer found by body observer")
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
// console.debug("code started");

// Try to get the jobs container.
// It is usually empty on the first run - we'll try again later in the code
let jobsContainer = document.querySelector(jobsContainerSelectors[0]);
if (!jobsContainer) jobsContainer = document.querySelector(jobsContainerSelectors[1]);
// console.debug(`Jobs container: ${jobsContainer.tagName}`);

// start processing the page here
if (!jobsContainer) {
  // watch the entire document until there is a job container
  bodyObserver.observe(document.body, mutationObserverOptions);
  // console.debug("Jobs container not found. Observing BODY for content changes.")
}
else {
  // this call is preferred because of it's narrower scope
  trackJobVisibility(); // chrome does not always fire the observer, so forcing it here
  jobContainerObserver.observe(jobsContainer, mutationObserverOptions);
}
