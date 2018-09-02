window.onload = function(e) {
    //////////////////////////////////////////////////////////////////////////////////////////
    // 1. First create a settings object that is sent to the search-engine.
    //    This test uses the publicly exposed demo SearchManager endpoint.
    //////////////////////////////////////////////////////////////////////////////////////////

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
            clientId: "plain-sample",
            matchGenerateContent: true,
            matchGrouping: true
            //categorizationType: IntelliSearch.CategorizationType.DocumentHitsOnly
        }
    });

    //////////////////////////////////////////////////////////////////////////////////////////
    // 2. Set up the ui settings.
    //    These provide a simple means to controlling the rendering.
    //////////////////////////////////////////////////////////////////////////////////////////

    const uiSettings = {
        match: {
            categories: {
                show: true,
                exclude: [
                    /^System.*/,
                    /^ModifiedDate.*/,
                    /^Projects \(JIRA\)$/,
                    /^Author$/,
                    /^GDPR$/
                ]
            }
        },
        details: {
            content: {
                show: clientSettings.query.matchGenerateContent
            },
            properties: {
                show: true,
                exclude: [
                    /\$id$/,
                    /^abstract$/,
                    /^extracts$/,
                    /^categories$/,
                    /^content$/,
                    /^metaList$/,
                    /^title$/,
                    /^url$/,
                    /^$/
                ]
            },
            metadata: {
                show: true,
                exclude: [
                    /^_?IntelliSearch\./i,
                    /^ItemId(Hash|Uri)$/,
                    /^CrawlerName/,
                    /^CrawledDate/,
                    /^System$/,
                    /^Exists$/ // TODO: Where does this come from?
                ]
            },
            categories: {
                show: true,
                exclude: [
                    /^System.*/,
                    /^ModifiedDate.*/,
                    /^Projects \(JIRA\)$/,
                    /^Author$/,
                    /^GDPR$/
                ]
            }
        }
    };

    //////////////////////////////////////////////////////////////////////////////////////////
    // 3. If needed, tune the rendering templates to adjust the output according to your wishes.
    //    These provide a simple means to controlling the rendering.
    //////////////////////////////////////////////////////////////////////////////////////////

    // prettier-ignore
    const render = {
        match: {
            // Required
            stats: (matches) => `
                <span>About ${matches.estimatedMatchCount} matches</span>
            `,
            // Required
            item: (match) => `
                <div class="item">
                    <div class="headline">
                        ${render.match.title(match.title, match.url)}
                    </div>
                    ${render.match.modDate(match.date)}
                    ${render.match.abstracts(match.abstracts)}
                    ${render.match.extracts(match.extracts)}
                    ${render.match.categories(match.categories)}
                </div>
            `,
            // The rest are optional and depends on references in the above
            categories: (categories) => uiSettings.match.categories.show && categories && categories.length > 0
                ? `
                    <div class="categories" title="Categories associated with the match">
                        ${collect(
                            categories,
                            (category) => {
                                if (excluded(category, uiSettings.match.categories.exclude)) {
                                    return "";
                                } else {
                                    const catName = getLocalizedCategoryName(category);
                                    const shortCatName = truncateMiddleEllipsis(catName, 20);
                                    return `<span class="category" title="${catName}">${shortCatName}</span>`;
                                }
                            })}
                    </div>
                    `
                : ``
            ,
            abstracts: (abstracts) => abstracts && abstracts.length > 0
                ? `
                    <div class="abstracts" title="Match abstract, ingress or similar">
                        ${collect(abstracts, (abstract) => `<span class="abstract">${abstract}</span>`)}
                    </div>
                  `
                : ``
            ,
            extracts: (extracts) => extracts && extracts.length > 0
                ? `
                    <div class="extracts" title="Extract of where the item has matches">
                        ${collect(extracts, (extract) => `<span class="extract">${extract}</span>`)}
                    </div>
                  `
                : ``
            ,
            modDate: (date) => `
                <span class="date" title="Modification date">${new Date(date).toLocaleDateString()}</span>
            `,
            title: (title, url) => `
                <a class="title" href="${url}" title="${title}">${title}</a>
            `,
        },
        details: {
            // Required
            content: (content) => `
                <p>${content.join("</p><p>")}</p>
            `,
            // Required
            properties: (match) => `
                ${render.details.itemProperties(match)}
                ${render.details.itemMetadata(match.metaList)}
                ${render.details.itemCategories(match.categories)}
            `,
            itemProperties: (match) => {
                if (!uiSettings.details.properties.show) return "";
                let items = [];
                for (var property in match) {
                    if (match.hasOwnProperty(property)) {
                        if (!excluded(property, uiSettings.details.properties.exclude)) {
                            items.push(property);
                        }
                    }
                }
                return `
                    <h2>Properties</h2>
                    <dl class="properties">
                        ${collect(items, (prop) => `
                            <dt title="${prop}">${prop}</dt>
                            <dd title="${match[prop]}">${match[prop]}</dd>
                        `)}
                    </dl>
                `;
            },
            itemMetadata: (metadata) => {
                if (!uiSettings.details.metadata.show) return "";
                let items = [];
                for (var meta of metadata) {
                    if (!excluded(meta.key, uiSettings.details.metadata.exclude)) {
                        items.push(meta);
                    }
                }
                return `
                    <h2>Metadata</h2>
                    <dl class="metadata">
                        ${collect(items, (meta) => `
                            <dt title="${meta.key}">${meta.key}</dt>
                            <dd title="${meta.value}">${meta.value}</dd>
                        `)}
                    </dl>
                `;
            },
            itemCategories: (categories) => {
                if (!uiSettings.details.categories.show) return "";
                let items = [];
                for (var category of categories) {
                    if (!excluded(category, uiSettings.details.categories.exclude)) {
                            items.push(category);
                    }
                }
                return `
                    <h2>Categories</h2>
                    <ul class="categories">
                        ${collect(items, (cat) => {
                            const catName = getLocalizedCategoryName(cat);
                            return `
                                <li title="${catName}">${catName}</li>
                            `;
                        })}
                    </ul>
                `;
            },
        }
    };

    //////////////////////////////////////////////////////////////////////////////////////////
    // 4. Initialize the client engine
    //    Wrapping the creation as it is used also when the reset-button is clicked.
    //////////////////////////////////////////////////////////////////////////////////////////

    // For debugging
    console.log("Client settings", clientSettings);
    console.log("User interface settings", uiSettings);
    console.log("Render templates", render);

    // prettier-ignore
    function setupClient() {
        // Sets up the client that connects to the intellisearch backend using the aforementioned settings
        return new IntelliSearch.SearchClient("http://searchmanager.demo.intellisearch.no",clientSettings);
    }

    let client = setupClient();

    //////////////////////////////////////////////////////////////////////////////////////////
    // 5. Wire up the queryText field, reset and search-button.
    //    Using input type="input", with separate reset and search button.
    //    Detecting changes, enter, reset-click and search-click.
    //////////////////////////////////////////////////////////////////////////////////////////

    var queryTextElm = document.getElementById("query-text");

    // This reports changes in the query, but does not detect enter
    queryTextElm.addEventListener("input", function() {
        console.log("queryText changed: " + queryTextElm.value);
        if (queryTextElm.value.length > 0) {
            resetBtn.classList.remove("hidden");
        } else {
            resetBtn.classList.add("hidden");
        }
        client.queryText = queryTextElm.value;

        // TODO: Figure out how to detect this properly.
        // There are queries for both match and categorize to consider.
        // if the current state has changed from any of the two, then the results are not
        // representative anymore. So, the client-check should consider both.
        // The client must then remember the last query that ended up yielding results (not failure).
        // if (client.lastQuery !== client.query) {
        //     containerElm.classList.add("query-changed");
        // } else {
        //     containerElm.classList.remove("query-changed");
        // }
    });

    // Only added to reliably detect enter across browsers
    queryTextElm.addEventListener("keyup", function(event) {
        if (event.key === "Enter") {
            console.log("queryText Enter detected: " + queryTextElm.value);
            client.update();
        }
    });

    // We use input type="input", instead of type="search". This is because the reset X that appears on the latter field
    // for type="search" is not reliably firing events across browsers. With type="input" we make our own reset button.
    var resetBtn = document.getElementById("reset");
    var containerElm = document.getElementById("container");
    resetBtn.addEventListener("click", () => {
        console.log("UI reset");
        client = setupClient();
        containerElm.className = "introduction";
        queryTextElm.value = "";
    });

    // We also want the search button to force a
    var searchButtonElm = document.getElementById("go");
    searchButtonElm.addEventListener("click", function() {
        console.log("Search-button clicked");
        client.update();
    });

    //////////////////////////////////////////////////////////////////////////////////////////
    // 6. Wire up other buttons, options and areas on the page:
    //    - Search-type
    //    - Date-range
    //    - Pager
    //    - Match ordering
    //    - ...
    //////////////////////////////////////////////////////////////////////////////////////////
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
    var didYouMeanContainerElm = document.getElementById(
        "did-you-mean-container"
    );
    var didYouMeanOptionsElm = document.getElementById("did-you-mean");

    var categoriesElm = document.getElementById("categories");
    var categoriesStatsElm = document.getElementById("categories-stats");

    var matchesElm = document.getElementById("matches");
    var matchesStatsElm = document.getElementById("matches-stats");

    // Details
    var titleElm = document.getElementById("title");
    var detailsTypesElm = document.getElementById("detail-types");

    var contentElm = document.getElementById("content");
    var propertiesElm = document.getElementById("properties");

    var detailsContent = document.getElementById("option-content");
    detailsContent.addEventListener("click", function() {
        contentElm.style.display = "initial";
        propertiesElm.style.display = "none";
    });
    var detailsProperties = document.getElementById("option-properties");
    detailsProperties.addEventListener("click", function() {
        contentElm.style.display = "none";
        propertiesElm.style.display = "initial";
    });

    var matchesErrorElm = document.getElementById("matches-error");
    var categoriesErrorElm = document.getElementById("categories-error");

    var loadingSuggestions = document.getElementById("spinner");
    //////////////////////////////////////////////////////////////////////////////////////////
    // 7. Implement callbacks, that in turn render the ui
    //////////////////////////////////////////////////////////////////////////////////////////

    /*** Autocomplete callbacks *************************************************************/

    /**
     * Often used to track "loading" spinners. Stop the spinner on success or error.
     * Return false to stop autocomplete queries from being executed.
     */
    function handleAutocompleteRequest(url, reqInit) {
        console.log("handleAutocompleteRequest", url, reqInit);
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
        loadingSuggestions.style.visibility = "hidden";

        stacktrace(stack => {
            console.error("handleAutocompleteError", error.message, stack);
        });
    }

    /*** Find callbacks *********************************************************************/

    /**
     * Often used to track "loading" spinners. Stop the spinner on success or error.
     * Return false to stop autocomplete queries from being executed.
     */
    function handleFindRequest(url, reqInit) {
        console.log("handleFindRequest", "Url: ", url, "ReqInit:", reqInit);
        containerElm.classList.add("matches-loading");
    }

    /**
     * Receive and render find matches and to stop load-spinners.
     */
    function handleFindSuccess(matches) {
        console.log("handleFindSuccess", "Matches:", matches);
        containerElm.classList.remove("matches-loading", "error");
        titleElm.innerHTML = "";
        contentElm.innerHTML = "";
        propertiesElm.innerHTML = "";
        didYouMeanContainerElm.style.display = "none";
        didYouMeanOptionsElm.innerHTML = "";

        matchesStatsElm.innerHTML = render.match.stats(matches);

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
            var li = document.createElement("li");
            li.innerHTML = render.match.item(match);

            // Bind up hover action to write content (properties and metadata) into the details pane
            li.addEventListener("mouseover", function() {
                titleElm.innerHTML = `<span class="title">${
                    match.title
                }</span>`;
                detailsTypesElm.style.display = "initial";
                contentElm.innerHTML = render.details.content(match.content);
                propertiesElm.innerHTML = render.details.properties(match);
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
            contentElm.innerHTML = "";
            propertiesElm.innerHTML = "";
        }
    }

    /**
     * Use this to handle errors and to stop load-spinners.
     */
    function handleFindError(error) {
        containerElm.classList.remove("matches-loading");
        containerElm.classList.add("error");

        stacktrace(stack => {
            console.error("handleFindError", error.message, stack);
            matchesErrorElm.innerHTML = `
            <h4>Find:</h4>
            <ul>
                <li>
                    <span class="key">Message:</span>
                    <span class="message">${error.message}</span>
                </li>
                <li>
                    <span class="key">Stacktrace:</span><br/>
                    <span class="stacktrace">${stack.join("<br/>")}</span>
                </li>
            </ul>
            `;
        });

        matchesStatsElm.innerHTML = "";
        matchesElm.innerHTML = "No matches.";
        detailsTypesElm.style.display = "none";
        titleElm.innerHTML = "";
        contentElm.innerHTML = "";
        propertiesElm.innerHTML = "";
        matchesHeader.classList.remove("has-data");
    }

    /*** Categorize callbacks ***************************************************************/

    /**
     * Often used to track "loading" spinners. Stop the spinner on success or error.
     * Return false to stop autocomplete queries from being executed.
     */
    function handleCategorizeRequest(url, reqInit) {
        console.log(
            "handleCategorizeRequest",
            "Url: ",
            url,
            "ReqInit:",
            reqInit
        );
        containerElm.classList.add("categories-loading");
    }

    /**
     * Receive and render autocomplete suggestions and to stop load-spinners.
     */
    function handleCategorizeSuccess(categories) {
        console.log("handleCategorizeSuccess", "Categories:", categories);
        containerElm.classList.remove("categories-loading", "error");

        categoriesStatsElm.innerHTML = `
            <span>Hits: ${categories.isEstimatedCount ? "~" : ""}${
            categories.matchCount
        }</span>
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
            categoryLiElm.classList.add(
                category.expanded ? "expanded" : "collapsed"
            );
            categoryLiElm.classList.add(
                category.children.length > 0 ? "has-children" : "is-leaf"
            );

            var toggle = `<span class="toggle"></span>`;
            var title = `<span class="title">${category.displayName}</span>`;
            var count =
                category.count > 0
                    ? `<span class="count">${category.count}</span>`
                    : "";
            categoryLiElm.innerHTML = `<div class="entry">${toggle}<span class="link">${title}${count}<span></div>`;

            var toggleElm = categoryLiElm.getElementsByClassName("toggle")[0];
            toggleElm.addEventListener("click", function(e) {
                var result = client.toggleCategoryExpansion(category);
                console.log(
                    `Toggled expansion for category '${
                        category.displayName
                    }'. Expanded = ${result}`,
                    client.clientCategoryExpansion
                );
            });

            var linkElm = categoryLiElm.getElementsByClassName("link")[0];
            linkElm.addEventListener("click", function(e) {
                var closestLi = e.target.closest("li");
                if (closestLi === categoryLiElm) {
                    var added = client.filterToggle(category);
                    closestLi.classList.toggle("is-filter");
                    console.log(
                        `Filter ${category.displayName} was ${
                            added ? "added" : "removed"
                        }. Current filters:`,
                        client.filters
                    );
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
                groupLiElm.classList.add(
                    group.expanded ? "expanded" : "collapsed"
                );
                groupLiElm.classList.add(
                    group.categories.length > 0 ? "has-children" : "is-leaf"
                );

                var toggleElm = groupLiElm.getElementsByClassName("toggle")[0];
                toggleElm.addEventListener("click", function(e) {
                    var result = client.toggleCategoryExpansion(group);
                    console.log(
                        `Toggled expansion for group '${
                            group.displayName
                        }'. Expanded = ${result}`,
                        client.clientCategoryExpansion
                    );
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
        containerElm.classList.remove("categories-loading");
        containerElm.classList.add("error");

        stacktrace(stack => {
            console.error("handleCategorizeError", error.message, stack);
            categoriesErrorElm.innerHTML = `
            <h4>Categorize:</h4>
            <ul>
                <li>
                    <span class="key">Message:</span>
                    <span class="message">${error.message}</span>
                </li>
                <li>
                    <span class="key">Stacktrace:</span><br/>
                    <span class="stacktrace">${stack.join("<br/>")}</span>
                </li>
            </ul>
            `;
        });

        categoriesStatsElm.innerHTML = "";
        categoriesElm.innerHTML = "";
    }

    // Utility template-helper to collect output from a map iterator.
    function collect(collection, action) {
        return collection.map(action).join("");
    }

    // Utility helper to exclude items
    function excluded(item, regexExclusionPatterns) {
        for (const exclude of regexExclusionPatterns) {
            const regex = new RegExp(exclude);
            const match = regex.test(item);
            if (match) return true;
        }
        return false;
    }

    // Lookup the actual categoryName in the category-tree. Used to get the real category-names in the match and in the details.
    function getLocalizedCategoryName(category) {
        // TODO: Add a SearchClient method to show the full path DisplayName for a category.
        const catId = category.split("|");
        const cat = client.findCategory(catId);
        let name = cat ? cat.displayName : category;
        return name.split("|").join("/");
    }

    // Truncate the rendering of category-titles in the matches.
    // TODO: Render first and last part in full, then just split the middle part, if longer than i.e. 5 chars.
    function truncateMiddleEllipsis(fullStr, strLen, separator) {
        if (fullStr.length <= strLen) return fullStr;

        separator = separator || "...";

        var sepLen = separator.length,
            charsToShow = strLen - sepLen,
            frontChars = Math.ceil(charsToShow / 2),
            backChars = Math.floor(charsToShow / 2);

        return (
            fullStr.substr(0, frontChars) +
            separator +
            fullStr.substr(fullStr.length - backChars)
        );
    }

    function stacktrace(action) {
        StackTrace.get(error, { offline: true })
            .then(stackframes => {
                // Remove the topmost three frames, as they are artificial.
                stackframes = stackframes.slice(3);
                return stackframes.map(function(sf) {
                    return sf.toString();
                });
            })
            .then(action)
            .catch(err =>
                console.error("Unable to create stacktrace", err.message)
            );
    }
};
