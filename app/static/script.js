document.getElementById('search-form').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent default form submission

    const query = document.getElementById('search-query').value;
    const resultsArea = document.getElementById('results-area');
    const llmSummaryDiv = document.getElementById('llm-summary');
    const chunksListDiv = document.getElementById('chunks-list');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error-message');

    // Clear previous results and errors, show loading
    llmSummaryDiv.innerHTML = '';
    chunksListDiv.innerHTML = '';
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    loadingDiv.style.display = 'block';

    try {
        const response = await fetch(`/search?query=${encodeURIComponent(query)}`);

        if (!response.ok) {
            let errorMsg = `Error: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMsg = `Error: ${errorData.detail || errorMsg}`;
            } catch (jsonError) {
                // If parsing error JSON fails, stick with the status text
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();

        // Display LLM Summary
        llmSummaryDiv.textContent = data.llm_summary || 'No LLM summary available.';

        // Display Reranked Chunks
        if (data.reranked_chunks && data.reranked_chunks.length > 0) {
            data.reranked_chunks.forEach((chunk, index) => {
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

    } catch (error) {
        console.error('Search failed:', error);
        errorDiv.textContent = `Search failed: ${error.message}`;
        errorDiv.style.display = 'block';
    } finally {
        // Hide loading indicator
        loadingDiv.style.display = 'none';
    }
});

// --- WebSocket Connection Logic ---
(function setupWebSocket() {
    // Determine ws protocol based on http protocol
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Construct WebSocket URL using current host and port
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

    console.log(`Attempting to connect WebSocket: ${wsUrl}`);

    const socket = new WebSocket(wsUrl);

    socket.onopen = function (event) {
        console.log("WebSocket connection established.");
        // Optional: Send a message upon connection
        // socket.send(JSON.stringify({ type: "greeting", message: "Hello Server!" }));
    };

    socket.onmessage = function (event) {
        console.log("WebSocket message received:", event.data);
        // Handle incoming messages here
        // const message = JSON.parse(event.data);
        // switch(message.type) { ... }
    };

    socket.onerror = function (error) {
        console.error("WebSocket Error:", error);
        // Display error to user?
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = `WebSocket connection error. Check console.`;
            errorDiv.style.display = 'block';
        }
    };

    socket.onclose = function (event) {
        if (event.wasClean) {
            console.log(`WebSocket connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            // e.g. server process killed or network down
            console.error('WebSocket connection died');
            const errorDiv = document.getElementById('error-message');
            if (errorDiv) {
                errorDiv.textContent = `WebSocket connection closed unexpectedly.`;
                errorDiv.style.display = 'block';
            }
        }
    };

    // You might want to store the socket object if you need to send messages later
    // window.myWebSocket = socket;

})(); // Immediately invoke the function to set up WebSocket on load 