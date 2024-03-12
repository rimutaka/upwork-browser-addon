## create chrome package and exclude manifest for firefox
## subshell call with cd is required to avoid placing /extension/ folder as the root
rm -f chrome.zip && \
(cd extension && zip -rq ../chrome.zip . -x manifest_ff.json -x manifest.json) && \
printf "@ manifest_cr.json\n@=manifest.json\n" | zipnote -w chrome.zip && \
echo Chrome package: chrome.zip

## create firefox package, exclude chrome manifest and rename FF manifest to its default file name
rm -f firefox.zip && \
(cd extension && zip -rq ../firefox.zip . -x manifest_cr.json -x manifest.json) && \
printf "@ manifest_ff.json\n@=manifest.json\n" | zipnote -w firefox.zip && \
echo Firefox package: firefox.zip