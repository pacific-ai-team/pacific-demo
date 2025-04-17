// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('table-grid');
    const rows = 5;
    const cols = 5;
    let cachedSearchResults = []; // Cache for storing search result chunks
    // Add loading/error elements if they don't exist in table.html
    // For now, let's assume they exist or add them later
    const loadingDiv = document.getElementById('loading') || document.createElement('div'); // Get or create
    const errorDiv = document.getElementById('error-message') || document.createElement('div');
    loadingDiv.id = 'loading'; // Ensure IDs are set
    errorDiv.id = 'error-message';
    // You might want to add these divs to the table.html structure properly

    // Generate the 5x5 grid of input fields
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.classList.add('grid-cell');
            input.dataset.row = i;
            input.dataset.col = j;
            if (i === 0 && j === 0) {
                input.placeholder = "Enter search query here...";
            }
            // Add event listener for Enter key press
            input.addEventListener('keydown', handleEnterKey);
            grid.appendChild(input);
        }
    }

    // Function to update the grid cells with cached results
    function updateTableGrid() {
        console.log("Updating table grid with cached results:", cachedSearchResults);
        for (let i = 1; i < rows; i++) { // Start from row 1
            const cell = grid.querySelector(`input[data-row="${i}"][data-col="0"]`);
            if (cell) {
                const chunkIndex = i - 1; // cachedSearchResults[0] goes to row 1, etc.
                if (chunkIndex < cachedSearchResults.length) {
                    cell.value = cachedSearchResults[chunkIndex].text || ''; // Use chunk text
                } else {
                    cell.value = ''; // Clear cell if no corresponding chunk
                }
            }
        }
    }

    // Function to clear the results column
    function clearResultsColumn() {
        console.log("Clearing results column");
        cachedSearchResults = []; // Clear the cache
        for (let i = 1; i < rows; i++) { // Start from row 1
            const cell = grid.querySelector(`input[data-row="${i}"][data-col="0"]`);
            if (cell) {
                cell.value = '';
            }
        }
    }

    // Handle Enter Key Press
    function handleEnterKey(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default form submission/newline
            const row = parseInt(event.target.dataset.row);
            const col = parseInt(event.target.dataset.col);

            if (row === 0 && col === 0) {
                // Trigger search if Enter is pressed in the top-left cell
                const query = event.target.value;
                if (query) {
                    triggerSearch(query);
                }
            }
            // else {
            // If Enter is pressed in other cells, do nothing for now
            // console.log(`Enter pressed in cell [${row}, ${col}] - No action defined.`);
            // Optionally, trigger sendTableData() here if needed later
            // sendTableData();
            // }
        }
    }

    // Function to trigger a search via WebSocket
    function triggerSearch(query) {
        if (typeof socket !== 'undefined' && socket && socket.readyState === WebSocket.OPEN) {
            console.log(`Sending search query via WebSocket: ${query}`);
            clearResultsColumn(); // Clear previous results and cache
            if (loadingDiv) loadingDiv.style.display = 'block';
            if (errorDiv) errorDiv.style.display = 'none';

            try {
                const message = JSON.stringify({
                    action: "search", // Use the same search action as script.js
                    query: query
                });
                socket.send(message);
            } catch (e) {
                console.error("Failed to send search query:", e);
                if (errorDiv) {
                    errorDiv.textContent = 'Failed to send search query via WebSocket.';
                    errorDiv.style.display = 'block';
                }
                if (loadingDiv) loadingDiv.style.display = 'none';
            }
        } else {
            console.error("WebSocket is not connected. Cannot send search query.");
            if (errorDiv) {
                errorDiv.textContent = 'WebSocket is not connected. Please refresh the page.';
                errorDiv.style.display = 'block';
            }
            if (loadingDiv) loadingDiv.style.display = 'none';
        }
    }

    // --- WebSocket Message Handling specific to the table page ---
    // We need to ensure the socket is initialized by script.js first.
    // A simple check or a more robust event listener could be used.
    // For now, we assume socket will be available shortly after DOMContentLoaded.

    // Function to initialize WebSocket message handler for the table page
    function setupTableWebSocketListener() {
        if (typeof socket !== 'undefined' && socket) {
            console.log("Setting up table-specific WebSocket message listener.");
            socket.onmessage = function (event) {
                console.log("WebSocket message received (table handler):", event.data);
                if (loadingDiv) loadingDiv.style.display = 'none'; // Hide loading on any message

                try {
                    const message = JSON.parse(event.data);

                    if (message.action === 'results' && message.data) {
                        if (errorDiv) errorDiv.style.display = 'none';
                        const newChunks = Array.isArray(message.data) ? message.data : [message.data];
                        // Append new chunks to the cache
                        cachedSearchResults.push(...newChunks);
                        console.log("Updated cache:", cachedSearchResults);
                        // Update the grid display
                        updateTableGrid();

                    } else if (message.action === 'error' && message.data) {
                        console.error("Received error from server:", message.data.message);
                        if (errorDiv) {
                            errorDiv.textContent = `Server error: ${message.data.message}`;
                            errorDiv.style.display = 'block';
                        }
                        clearResultsColumn(); // Clear results on error
                    } else {
                        console.log("Received unhandled message action or format:", message.action, message);
                        // Handle other actions if needed (e.g., a final 'summary' or 'end_of_stream')
                    }

                } catch (e) {
                    console.error("Failed to parse WebSocket message or update table UI:", e);
                    if (errorDiv) {
                        errorDiv.textContent = 'Failed to process server response.';
                        errorDiv.style.display = 'block';
                    }
                    // Decide whether to clear cache/grid on parse error
                    // clearResultsColumn();
                }
            };

            // Optional: Re-assign other handlers if script.js versions need modification
            socket.onerror = socket.onerror || function (error) { /* default error handling */ console.error("WS Error (table):", error); };
            socket.onclose = socket.onclose || function (event) { /* default close handling */ console.log("WS Closed (table):", event); };


        } else {
            // Socket not ready yet, try again shortly
            console.warn("Socket not ready, retrying listener setup...");
            setTimeout(setupTableWebSocketListener, 500); // Retry after 500ms
        }
    }

    // Initial setup call
    setupTableWebSocketListener();

    // We are removing the generic sendTableData function for now
    /*
    function sendTableData() {
        // ... (previous code for sending all grid data) ...
    }
    */
}); 
}); 