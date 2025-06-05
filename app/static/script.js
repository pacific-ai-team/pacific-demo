let socket = null; // Declare socket in a higher scope
let currentChunks = []; // Store chunks for the current query

// --- Helper function to display results ---
function displayResults(summaryText, chunksArray) {
    const llmSummaryDiv = document.getElementById('llm-summary');
    const chunksListDiv = document.getElementById('chunks-list');
    const errorDiv = document.getElementById('error-message'); // Ensure errorDiv is accessible or passed

    // Clear previous results
    llmSummaryDiv.innerHTML = '';
    chunksListDiv.innerHTML = '';

    if (summaryText) {
        llmSummaryDiv.textContent = summaryText;
    }

    if (chunksArray && chunksArray.length > 0) {
        if (errorDiv) { // Clear error message if displaying results
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }
        chunksArray.forEach((chunk, index) => {
            const chunkElement = document.createElement('div');
            chunkElement.classList.add('chunk');

            const rankP = document.createElement('p');
            rankP.innerHTML = `<b>Rank:</b> ${index + 1}`;

            const textP = document.createElement('p');
            textP.innerHTML = `<b>Text:</b> ${chunk.text}`;

            const sourceP = document.createElement('p');
            sourceP.classList.add('source');
            sourceP.textContent = `Source: ${chunk.source}`;

            const scoresP = document.createElement('p');
            scoresP.classList.add('scores');
            const simScore = chunk.embedding_similarity_score !== null && chunk.embedding_similarity_score !== undefined ? chunk.embedding_similarity_score.toFixed(3) : 'N/A';
            const rerankScore = chunk.reranking_score !== null && chunk.reranking_score !== undefined ? chunk.reranking_score.toFixed(3) : 'N/A';
            const trigramScore = chunk.trigram_similarity_score !== null && chunk.trigram_similarity_score !== undefined ? chunk.trigram_similarity_score.toFixed(3) : 'N/A';
            scoresP.textContent = `(Similarity: ${simScore}, Rerank Score: ${rerankScore}, Trigram: ${trigramScore})`;

            chunkElement.appendChild(rankP);
            chunkElement.appendChild(textP);
            chunkElement.appendChild(sourceP);
            chunkElement.appendChild(scoresP);
            chunksListDiv.appendChild(chunkElement);
        });
    } else if (!summaryText && (!chunksArray || chunksArray.length === 0)) { // Only show "no results" if both are empty/null
        chunksListDiv.textContent = 'No results found.';
    }
}


// --- WebSocket Connection Logic ---
(function setupWebSocket() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

    console.log(`Attempting to connect WebSocket: ${wsUrl}`);
    socket = new WebSocket(wsUrl); // Assign to the higher scope variable

    socket.onopen = function (event) {
        console.log("WebSocket connection established.");
        // Enable the search button maybe? Or indicate connection status.
    };

    socket.onmessage = function (event) {
        console.log("WebSocket message received:", event.data);
        const loadingDiv = document.getElementById('loading');
        const errorDiv = document.getElementById('error-message');
        // const llmSummaryDiv = document.getElementById('llm-summary'); // Handled by displayResults
        // const chunksListDiv = document.getElementById('chunks-list'); // Handled by displayResults

        loadingDiv.style.display = 'none'; // Hide loading when first response arrives

        try {
            const message = JSON.parse(event.data);

            // --- Handle incoming messages ---
            if (message.action === 'results' && message.data) { // Check if data exists
                // errorDiv.style.display = 'none'; // Handled by displayResults
                // errorDiv.textContent = ''; // Handled by displayResults

                const newChunks = Array.isArray(message.data) ? message.data : [message.data]; // Handle single or array

                // Append new chunks to the persistent list for this query
                currentChunks.push(...newChunks);

                // Re-render the entire list of chunks
                // llmSummaryDiv.innerHTML = ''; // Handled by displayResults
                // chunksListDiv.innerHTML = ''; // Handled by displayResults
                displayResults(null, currentChunks); // WebSocket sends chunks, summary might come separately

            } else if (message.action === 'error' && message.data) {
                console.error("Received error from server:", message.data.message);
                errorDiv.textContent = `Server error: ${message.data.message}`;
                errorDiv.style.display = 'block';
                // llmSummaryDiv.innerHTML = ''; // Clear with displayResults or directly
                // chunksListDiv.innerHTML = '';
                displayResults(null, []); // Clear results on error
                currentChunks = []; // Clear stored chunks on error
            } else {
                // Handle potential summary message or other actions if needed in the future
                if (message.action !== 'results' && message.action !== 'error') {
                    console.log("Received message with action:", message.action, message);
                    // Example: Handle a final summary message
                    // if (message.action === 'summary' && message.data) {
                    //     llmSummaryDiv.textContent = message.data.summary || 'Summary received.';
                    // }
                } else {
                    console.warn("Received results message with no data or unknown message format:", message);
                }
            }

        } catch (e) {
            console.error("Failed to parse WebSocket message or update UI:", e);
            errorDiv.textContent = 'Failed to process server response.';
            errorDiv.style.display = 'block';
            // Decide if we should clear chunks here - maybe keep existing ones?
            // currentChunks = [];
            // chunksListDiv.innerHTML = '';
        }
    };

    socket.onerror = function (error) {
        console.error("WebSocket Error:", error);
        const errorDiv = document.getElementById('error-message');
        const loadingDiv = document.getElementById('loading'); // Get loading div
        if (loadingDiv) loadingDiv.style.display = 'none'; // Hide loading on WS error

        if (errorDiv) {
            errorDiv.textContent = `WebSocket connection error. Check console. Is the server running and WS endpoint available?`;
            errorDiv.style.display = 'block';
        }
        // Clear results on WebSocket error
        displayResults(null, []);
        currentChunks = [];
        // if(document.getElementById('chunks-list')) document.getElementById('chunks-list').innerHTML = '';
    };

    socket.onclose = function (event) {
        const errorDiv = document.getElementById('error-message');
        const loadingDiv = document.getElementById('loading'); // Get loading div
        if (loadingDiv) loadingDiv.style.display = 'none'; // Hide loading on WS close if it was visible

        if (event.wasClean) {
            console.log(`WebSocket connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            console.error('WebSocket connection died');
            if (errorDiv && errorDiv.style.display === 'none') { // Avoid overwriting specific errors
                errorDiv.textContent = `WebSocket connection closed unexpectedly. Refresh page to retry.`;
                errorDiv.style.display = 'block';
            }
        }
        socket = null; // Clear socket variable
        // Optionally clear results when connection closes unexpectedly
        // displayResults(null, []); // Clearing here might be too aggressive if user expects to see old results
        // currentChunks = [];
        // if(document.getElementById('chunks-list')) document.getElementById('chunks-list').innerHTML = '';
    };

})(); // Immediately invoke the function to set up WebSocket on load


// --- Updated Search Form Logic ---
document.getElementById('search-form').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent default form submission

    const query = document.getElementById('search-query').value;
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error-message');
    const llmSummaryDiv = document.getElementById('llm-summary');
    const chunksListDiv = document.getElementById('chunks-list');

    // Clear previous results and errors, show loading
    llmSummaryDiv.innerHTML = '';
    chunksListDiv.innerHTML = '';
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    loadingDiv.style.display = 'block'; // Show loading indicator
    currentChunks = []; // Reset chunks for new query

    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log(`Sending query via WebSocket: ${query}`);
        try {
            // Send query as a JSON message
            const message = JSON.stringify({
                action: "search", // Define an action type
                query: query
            });
            socket.send(message);
            // Note: loadingDiv is hidden by socket.onmessage or socket.onerror
        } catch (e) {
            console.error("Failed to send message:", e);
            errorDiv.textContent = 'Failed to send search query via WebSocket.';
            errorDiv.style.display = 'block';
            loadingDiv.style.display = 'none';
            displayResults(null, []); // Clear results area
        }
    } else {
        console.warn("WebSocket is not connected or not open. Falling back to HTTP GET.");
        // Fallback to HTTP GET request
        fetch(`/search?query=${encodeURIComponent(query)}`)
            .then(response => {
                if (!response.ok) {
                    // Try to parse error response body, then throw
                    return response.json().then(errData => {
                        throw { status: response.status, message: (errData.error && errData.error.message) || errData.detail || response.statusText };
                    }).catch(() => { // If parsing error body fails
                        throw { status: response.status, message: response.statusText };
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log("Received data from HTTP GET:", data);
                currentChunks = data.reranked_chunks || []; // Store for consistency if needed elsewhere
                displayResults(data.llm_summary, currentChunks);
                loadingDiv.style.display = 'none';
            })
            .catch(error => {
                console.error("Error fetching search results via HTTP GET:", error);
                errorDiv.textContent = `HTTP Error: ${error.message || 'Failed to fetch results.'}`;
                if (error.status) {
                    errorDiv.textContent = `HTTP Error ${error.status}: ${error.message || 'Failed to fetch results.'}`;
                }
                errorDiv.style.display = 'block';
                displayResults(null, []); // Clear results area
                loadingDiv.style.display = 'none';
            });
    }

    // NOTE: The old fetch logic is removed. Results are now handled by socket.onmessage or the fetch fallback.
}); 