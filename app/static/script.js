let socket = null; // Declare socket in a higher scope

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
        const llmSummaryDiv = document.getElementById('llm-summary');
        const chunksListDiv = document.getElementById('chunks-list');

        loadingDiv.style.display = 'none'; // Hide loading when response arrives

        try {
            const message = JSON.parse(event.data);

            // --- Handle incoming messages ---
            if (message.action === 'results' && Array.isArray(message.data)) { // Check if data is an array
                errorDiv.style.display = 'none';
                errorDiv.textContent = '';

                const chunks = message.data; // Data is the list of chunks
                // Clear LLM Summary display as it's no longer expected in this format
                llmSummaryDiv.innerHTML = '';

                // Display Reranked Chunks
                chunksListDiv.innerHTML = ''; // Clear previous chunks
                if (chunks && chunks.length > 0) {
                    chunks.forEach((chunk, index) => {
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
                        const simScore = chunk.embedding_similarity_score !== null ? chunk.embedding_similarity_score.toFixed(3) : 'N/A';
                        const rerankScore = chunk.reranking_score !== null ? chunk.reranking_score.toFixed(3) : 'N/A';
                        const trigramScore = chunk.trigram_similarity_score !== null ? chunk.trigram_similarity_score.toFixed(3) : 'N/A';
                        scoresP.textContent = `(Similarity: ${simScore}, Rerank Score: ${rerankScore}, Trigram: ${trigramScore})`;

                        chunkElement.appendChild(rankP);
                        chunkElement.appendChild(textP);
                        chunkElement.appendChild(sourceP);
                        chunkElement.appendChild(scoresP);
                        chunksListDiv.appendChild(chunkElement);
                    });
                } else {
                    chunksListDiv.textContent = 'No chunks returned.';
                }

            } else if (message.action === 'error' && message.data) {
                console.error("Received error from server:", message.data.message);
                errorDiv.textContent = `Server error: ${message.data.message}`;
                errorDiv.style.display = 'block';
                llmSummaryDiv.innerHTML = '';
                chunksListDiv.innerHTML = '';
            } else {
                console.warn("Received unknown message format or data is not an array:", message);
            }

        } catch (e) {
            console.error("Failed to parse WebSocket message or update UI:", e);
            errorDiv.textContent = 'Failed to process server response.';
            errorDiv.style.display = 'block';
        }
    };

    socket.onerror = function (error) {
        console.error("WebSocket Error:", error);
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = `WebSocket connection error. Check console. Is the server running and WS endpoint available?`;
            errorDiv.style.display = 'block';
        }
    };

    socket.onclose = function (event) {
        const errorDiv = document.getElementById('error-message');
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

    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log(`Sending query via WebSocket: ${query}`);
        try {
            // Send query as a JSON message
            const message = JSON.stringify({
                action: "search", // Define an action type
                query: query
            });
            socket.send(message);
        } catch (e) {
            console.error("Failed to send message:", e);
            errorDiv.textContent = 'Failed to send search query via WebSocket.';
            errorDiv.style.display = 'block';
            loadingDiv.style.display = 'none';
        }
    } else {
        console.error("WebSocket is not connected.");
        errorDiv.textContent = 'WebSocket is not connected. Please refresh the page.';
        errorDiv.style.display = 'block';
        loadingDiv.style.display = 'none';
    }

    // NOTE: The old fetch logic is removed. Results are now handled by socket.onmessage
}); 