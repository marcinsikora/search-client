window.onload = function(e) {


    /**
     * 1. First create a settings object that is sent to the search-engine.
     * This test uses the publicly exposed demo SearchManager endpoint.
     */
    const clientSettings = new IntelliSearch.Settings({
        autocomplete: {
            //enabled: false, //TODO: Enable when the backend has been updated.
            cbRequest: handleAutocompleteRequest,
            cbSuccess: handleAutocompleteSuccess,
            cbError: handleAutocompleteError
        },
        find: {
            cbRequest: handleFindRequest,
            cbSuccess: handleFindSuccess,
            cbError: handleFindError
        },
        categorize: {
            cbRequest: handleCategorizeRequest,
            cbSuccess: handleCategorizeSuccess,
            cbError: handleCategorizeError
        },
        query: {
            clientId: 'plain-sample',
            matchGenerateContent: true,
            matchGrouping: true,
            //categorizationType: IntelliSearch.CategorizationType.DocumentHitsOnly
        }
    });

    const guiSettings = {
        content: {
            show: clientSettings.query.matchGenerateContent,
        },
        metadata: {
            show: true,
            exclude: [

            ],
        },
        properties: {
            show: true,
            exclude: [

            ],
        },
    }

    console.log("Client-settings", clientSettings);
    console.log("GUI-settings", guiSettings);

    function setupClient() {
        return new IntelliSearch.SearchClient("http://searchmanager.demo.intellisearch.no", clientSettings);
    }

    let client = setupClient();

    /**
     * 2. Wire up the queryText field and the search-button.
     */
    var queryTextElm = document.getElementById("query-text");
    queryTextElm.addEventListener("input", function() {
        console.log("queryText changed: " + queryTextElm.value);
        if (queryTextElm.value.length > 0)
            resetBtn.classList.remove("hidden");
        else {
            resetBtn.classList.add("hidden");
        }
        client.queryText = queryTextElm.value;
    });

    queryTextElm.addEventListener("keyup", function(event) {
        if (event.key === "Enter") {
            console.log("queryText Enter detected: " + queryTextElm.value);
            client.queryText = queryTextElm.value + "\n";
        }
    });

    var resetBtn = document.getElementById("reset");
    var containerElm = document.getElementById("container");
    resetBtn.addEventListener("click", () => {
        console.log("Resets the client (TODO: Reset html");
        client = setupClient();
        containerElm.className = "introduction";
        queryTextElm.value = "";
    })


    var searchButtonElm = document.getElementById("go");
    searchButtonElm.addEventListener("click", function() {
        console.log("Search-button clicked");
        client.update();
    });

    /**
     * 3. Wire up other buttons, options and areas on the page:
     * - Search-type
     * - Date-range
     * - Pager
     * - Match ordering
     * - ...
     */
    var matchesHeader = document.getElementById("matches-header");

    var orderByRelevance = document.getElementById("option-relevance");
    orderByRelevance.addEventListener("click", function() {
        client.matchOrderBy = IntelliSearch.OrderBy.Relevance;
    });

    var orderByDate = document.getElementById("option-date");
    orderByDate.addEventListener("click", function() {
        client.matchOrderBy = IntelliSearch.OrderBy.Date;
    });

    var suggestionsElm = document.getElementById("suggestions");
    var didYouMeanContainerElm = document.getElementById("did-you-mean-container");
    var didYouMeanOptionsElm = document.getElementById("did-you-mean");

    var categoriesElm = document.getElementById("categories");
    var categoriesStatsElm = document.getElementById("categories-stats");

    var matchesElm = document.getElementById("matches");
    var matchesStatsElm = document.getElementById("matches-stats");

    // Details
    var titleElm = document.getElementById("title");
    var detailsTypesElm = document.getElementById("detail-types");

    var contentElm = document.getElementById("content");
    var metadataElm = document.getElementById("metadata");
    var propertiesElm = document.getElementById("properties");

    var detailsContent = document.getElementById("option-content");
    detailsContent.addEventListener("click", function() {
        contentElm.style.display = "initial";
        metadataElm.style.display = "none";
        propertiesElm.style.display = "none";
    });
    var detailsMetadata = document.getElementById("option-metadata");
    detailsMetadata.addEventListener("click", function() {
        contentElm.style.display = "none";
        metadataElm.style.display = "initial";
        propertiesElm.style.display = "none";
    });
    var detailsProperties = document.getElementById("option-properties");
    detailsProperties.addEventListener("click", function() {
        contentElm.style.display = "none";
        metadataElm.style.display = "none";
        propertiesElm.style.display = "initial";
    });


    var loadingSuggestions = document.getElementById("loading-suggestions");
    var loadingCategories = document.getElementById("loading-categories");
    var loadingMatches = document.getElementById("loading-matches");

    /////////////////////////////////////////////
    // 4. Implement callbacks
    /////////////////////////////////////////////

    // Autocomplete callbacks ///////////////////

    /**
     * Often used to track "loading" spinners. Stop the spinner on success or error.
     * Return false to stop autocomplete queries from being executed.
     */
    function handleAutocompleteRequest(url, reqInit) {
        console.log("handleAutocompleteRequest", "Url: ", url, "ReqInit:", reqInit);
        loadingSuggestions.style.visibility = "visible";
    }

    /**
     * Receive and render autocomplete suggestions and to stop load-spinners.
     */
    function handleAutocompleteSuccess(suggestions) {
        console.log("handleAutocompleteSuccess", "Suggestions:", suggestions);
        loadingSuggestions.style.visibility = "hidden";
        suggestionsElm.innerHTML = "";
        suggestions.forEach((suggestion, i, a) => {
            var option = document.createElement("option");
            option.value = suggestion;
            suggestionsElm.appendChild(option);
        });
    }

    /**
     * Use this to handle errors and to stop load-spinners.
     */
    function handleAutocompleteError(error) {
        console.error("handleAutocompleteError", error);
        loadingSuggestions.style.visibility = "hidden";
    }

    // Find callbacks ///////////////////////////

    /**
     * Often used to track "loading" spinners. Stop the spinner on success or error.
     * Return false to stop autocomplete queries from being executed.
     */
    function handleFindRequest(url, reqInit) {
        console.log("handleFindRequest", "Url: ", url, "ReqInit:", reqInit);
        loadingMatches.style.visibility = "visible";
    }

    /**
     * Receive and render find matches and to stop load-spinners.
     */
    function handleFindSuccess(matches) {
        console.log("handleFindSuccess", "Matches:", matches);
        loadingMatches.style.visibility = "hidden";

        matchesStatsElm.innerHTML = `<span>Omtrent ${matches.estimatedMatchCount} resultater</span>`;

        didYouMeanContainerElm.style.display = "none";
        didYouMeanOptionsElm.innerHTML = "";
        if (matches.didYouMeanList.length > 0) {
            matches.didYouMeanList.forEach((didYouMean, i, a) => {
                var li = document.createElement("li");
                li.innerHTML = didYouMean;
                li.addEventListener("click", function() {
                    queryTextElm.value = didYouMean; // Update the user interface
                    client.queryText = didYouMean; // Update the client (since the UI does not fire an event for the previous change)
                    queryTextElm.focus(); // Set the focus to the query-field.
                });
                didYouMeanOptionsElm.appendChild(li);
            });
            didYouMeanContainerElm.style.display = "block";
        }

        // Clear out old matches
        matchesElm.innerHTML = "";

        function createMatch(match, index, arr) {
            var li = document.createElement('li');

            // Build title
            var title = `<a class="title" href="${match.url}" title="${match.title}">${match.title}</a>`;

            // Build showButton (if contents are delivered)
            var showContentButton = match.content.length > 0 ? `<button title="Show content...">&telrec;</button>` : "";

            // Build relevance
            var relevance = `<span class="relevance" title="Relevance (${match.relevance})">${parseInt(match.relevance)}</span>`;

            // Build modification date
            var modificationDate = `<span class="date" title="Modification date">${new Date(match.date).toLocaleDateString()}</span>`;

            // Build extracts
            var extracts = "";
            match.extracts.forEach(function(extract, meIndex, meArr) {
                //extracts += `<div class="extract">${extract}</div>`;
                extracts += `<span class="extract">${extract}</span><br/>`;
            });
            extracts = extracts.length > 0 ? `<div class="extracts"><span class="date">${new Date(match.date).toLocaleDateString()} - </span>${extracts}</div>` : "";

            // Build abstract
            var abstract = match.abstract.length > 0 ? `<div class="abstract">${match.abstract}</div>` : "";

            // Build match-item
            li.innerHTML = `
                <div class="headline">
                    ${title}
                    <div class="rel-date-wrapper">
                        ${showContentButton}
                        ${relevance}
                        ${modificationDate}
                    </div>
                </div>
                ${extracts}
                ${abstract}
            `;

            // Build the content that is to be displayed in the details pane.

            // Build title
            var detailTitle = `<span title="${match.title}">Title: ${match.title}</span>`;

            // Build metadata
            var metadata = "";
            match.metaList.forEach(function(meta, metaIndex, metaArr) {
                // Iterate all metadatas to create a list
                metadata += `<li title="${meta.value}"><b>${meta.key}</b>: ${meta.value}</li>`;
            });

            // Build properties
            var categories = "</br>";
            match.categories.forEach(function(cat, catIndex, catArr) {
                // Iterate all categories to create a list
                categories += `&nbsp;-&nbsp;${cat}<br/>`;
            });

            var properties = `
                <li><b>InternalId</b>: ${match.internalId}</li>
                <li><b>ItemId</b>: ${match.itemId}</li>
                <li><b>SourceName</b>: ${match.sourceName}</li>
                <li><b>InstanceId</b>: ${match.instanceId}</li>
                <li><b>ParentInternalId</b>: ${match.parentInternalId}</li>
                <li><b>ParentLevel</b>: ${match.parentLevel}</li>
                <li><b>IndexManagerNode</b>: ${match.indexManagerNode}</li>
                <li><b>IsTrueMatch</b>: ${match.isTrueMatch}</li>
                <li><b>Categories</b>: ${categories}</li>
                `;

            // Bind up hover action to write content (properties and metadata) into the details pane
            li.addEventListener("mouseover", function() {
                titleElm.innerHTML = detailTitle;
                detailsTypesElm.style.display = "initial";
                contentElm.innerHTML = `<p>${match.content.join('</p><p>')}</p>`;
                metadataElm.innerHTML = `<ul>${metadata}</ul>`;
                propertiesElm.innerHTML = `<ul>${properties}</ul>`;
            });

            return li;
        }

        if (matches.searchMatches.length > 0) {
            containerElm.classList.remove("introduction");
            matchesHeader.classList.add("has-data");
            var ul = document.createElement("ul");
            matchesElm.appendChild(ul);

            matches.searchMatches.forEach(function(match, index, arr) {
                var li = createMatch(match, index, arr);
                ul.appendChild(li);
            });
        } else {
            matchesStatsElm.innerHTML = "";
            matchesElm.innerHTML = "No matches.";
            detailsTypesElm.style.display = "none";
            titleElm.innerHTML = "";
            propertiesElm.innerHTML = "";
            metadataElm.innerHTML = "";
        }
    }

    /**
     * Use this to handle errors and to stop load-spinners.
     */
    function handleFindError(error) {
        console.error("handleFindError", error);
        loadingMatches.style.visibility = "hidden";
        matchesStatsElm.innerHTML = "";
        matchesElm.innerHTML = "No matches.";
        detailsTypesElm.style.display = "none";
        titleElm.innerHTML = "";
        propertiesElm.innerHTML = "";
        metadataElm.innerHTML = "";
        matchesHeader.classList.remove("has-data");
    }

    // Categorize callbacks ///////////////////////////

    /**
     * Often used to track "loading" spinners. Stop the spinner on success or error.
     * Return false to stop autocomplete queries from being executed.
     */
    function handleCategorizeRequest(url, reqInit) {
        console.log("handleCategorizeRequest", "Url: ", url, "ReqInit:", reqInit);
        loadingCategories.style.visibility = "visible";
    }

    /**
     * Receive and render autocomplete suggestions and to stop load-spinners.
     */
    function handleCategorizeSuccess(categories) {
        console.log("handleCategorizeSuccess", "Categories:", categories);
        loadingCategories.style.visibility = "hidden";
        categoriesStatsElm.innerHTML = `
            <span>Hits: ${categories.isEstimatedCount ? '~' : ''}${categories.matchCount}</span>
        `;

        categoriesElm.innerHTML = "";

        function createCategoryNode(category, index, arr) {
            var categoryLiElm = document.createElement("li");
            if (client.isFilter(category)) {
                categoryLiElm.classList.add("is-filter");
            } else if (client.hasChildFilter(category)) {
                categoryLiElm.classList.add("has-filter");
            }
            if (category.count > 0) {
                categoryLiElm.classList.add("has-matches");
            }
            categoryLiElm.classList.add(category.expanded ? "expanded" : "collapsed");
            categoryLiElm.classList.add(category.children.length > 0 ? "has-children" : "is-leaf");

            var toggle = `<span class="toggle"></span>`;
            var title = `<span class="title">${category.displayName}</span>`;
            var count = category.count > 0 ? `<span class="count">${category.count}</span>` : '';
            categoryLiElm.innerHTML = `<div class="entry">${toggle}<span class="link">${title}${count}<span></div>`;

            var toggleElm = categoryLiElm.getElementsByClassName("toggle")[0];
            toggleElm.addEventListener("click", function(e) {
                var result = client.toggleCategoryExpansion(category);
                console.log(`Toggled expansion for category '${category.displayName}'. Expanded = ${result}`, client.clientCategoryExpansion);
            });

            var linkElm = categoryLiElm.getElementsByClassName("link")[0];
            linkElm.addEventListener("click", function(e) {
                var closestLi = e.target.closest("li");
                if (closestLi === categoryLiElm) {
                    var added = client.filterToggle(category);
                    closestLi.classList.toggle("is-filter");
                    console.log(`Filter ${category.displayName} was ${added ? "added" : "removed"}. Current filters:`, client.filters);
                }
            });
            if (category.children.length > 0) {
                var catUlElm = document.createElement("ul");
                categoryLiElm.appendChild(catUlElm);
                category.children.forEach(function(childCat, cIndex, cArr) {
                    var li = createCategoryNode(childCat, cIndex, cArr);
                    catUlElm.appendChild(li);
                });
            }
            return categoryLiElm;
        }

        if (categories.groups.length > 0) {
            var ul = document.createElement("ul");
            categoriesElm.appendChild(ul);

            categories.groups.forEach(function(group, index, arr) {
                // Create the group-node
                var groupLiElm = document.createElement("li");
                var title = `<span class="title">${group.displayName}</span>`;
                var toggle = `<span class="toggle"></span>`;
                groupLiElm.innerHTML = `<div class="entry">${toggle}${title}</div>`;
                groupLiElm.classList.add(group.expanded ? "expanded" : "collapsed");
                groupLiElm.classList.add(group.categories.length > 0 ? "has-children" : "is-leaf");

                var toggleElm = groupLiElm.getElementsByClassName("toggle")[0];
                toggleElm.addEventListener("click", function(e) {
                    var result = client.toggleCategoryExpansion(group);
                    console.log(`Toggled expansion for group '${group.displayName}'. Expanded = ${result}`, client.clientCategoryExpansion);
                });
                if (group.categories.length > 0) {
                    var catUlElm = document.createElement("ul");
                    groupLiElm.appendChild(catUlElm);
                    group.categories.forEach(function(category, cIndex, cArr) {
                        var li = createCategoryNode(category, cIndex, cArr);
                        catUlElm.appendChild(li);
                    });
                }
                ul.appendChild(groupLiElm);
            });
        } else {
            categoriesStatsElm.innerHTML = "";
            categoriesElm.innerHTML = "No categories.";
        }
    }

    /**
     * Use this to handle errors and to stop load-spinners.
     */
    function handleCategorizeError(error) {
        console.error("handleCategorizeError", error);
        loadingCategories.style.visibility = "hidden";
        categoriesStatsElm.innerHTML = "";
        categoriesElm.innerHTML = "No categories.";
    }

}
