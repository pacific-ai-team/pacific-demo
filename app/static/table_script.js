// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('table-grid');
    const rows = 5;
    const cols = 5;
    // Cache results per column
    let columnCaches = {}; // { 0: [chunk1, chunk2], 1: [chunkA, chunkB], ... }
    let lastSearchedCol = null; // Track which column's results are expected

    const loadingDiv = document.getElementById('loading') || document.createElement('div');
    const errorDiv = document.getElementById('error-message') || document.createElement('div');
    loadingDiv.id = 'loading';
    errorDiv.id = 'error-message';
    // Make sure loading/error divs are added to table.html if not present

    // Initialize column caches
    for (let j = 0; j < cols; j++) {
        columnCaches[j] = [];
    }

    // Generate the 5x5 grid of input fields
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.classList.add('grid-cell');
            input.dataset.row = i;
            input.dataset.col = j;
            if (i === 0) {
                input.placeholder = `Query Col ${j}...`;
            } else {
                input.readOnly = true; // Make result cells read-only initially
                input.classList.add('result-cell');
            }
            input.addEventListener('keydown', handleEnterKey);
            grid.appendChild(input);
        }
    }

    // Function to update the grid cells for a specific column based on its cache
    function updateTableColumn(targetCol) {
        if (typeof targetCol !== 'number') return; // Ensure targetCol is valid

        console.log(`Updating table column ${targetCol} with cached results:`, columnCaches[targetCol]);
        for (let i = 1; i < rows; i++) { // Start from row 1
            const cell = grid.querySelector(`input[data-row="${i}"][data-col="${targetCol}"]`);
            if (cell) {
                const chunkIndex = i - 1; // cache[0] goes to row 1, etc.
                if (chunkIndex < columnCaches[targetCol].length) {
                    cell.value = columnCaches[targetCol][chunkIndex].text || ''; // Use chunk text
                } else {
                    cell.value = ''; // Clear cell if no corresponding chunk
                }
            }
        }
    }

    // Function to clear the results cache and cells for a specific column
    function clearResultsColumn(targetCol) {
        if (typeof targetCol !== 'number') return; // Ensure targetCol is valid

        console.log(`Clearing results column ${targetCol}`);
        columnCaches[targetCol] = []; // Clear the cache for the specific column
        for (let i = 1; i < rows; i++) { // Start from row 1
            const cell = grid.querySelector(`input[data-row="${i}"][data-col="${targetCol}"]`);
            if (cell) {
                cell.value = '';
            }
        }
    }

    // Handle Enter Key Press
    function handleEnterKey(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const row = parseInt(event.target.dataset.row);
            const col = parseInt(event.target.dataset.col);

            // Trigger search only if Enter is pressed in the first row (row 0)
            if (row === 0) {
                const query = event.target.value;
                if (query) {
                    triggerSearch(query, col); // Pass the column index
                }
            }
        }
    }

    // Function to trigger a search via WebSocket for a specific column
    function triggerSearch(query, targetCol) {
        if (typeof socket !== 'undefined' && socket && socket.readyState === WebSocket.OPEN) {
            console.log(`Sending search query "${query}" for column ${targetCol} via WebSocket`);
            clearResultsColumn(targetCol); // Clear previous results for this column
            lastSearchedCol = targetCol; // Remember which column we expect results for

            if (loadingDiv) loadingDiv.style.display = 'block'; // Consider per-column loading indicators later
            if (errorDiv) errorDiv.style.display = 'none';

            try {
                const message = JSON.stringify({
                    action: "search", // Use the same search action
                    query: query
                    // Optionally include targetCol if server needs it:
                    // targetCol: targetCol
                });
                socket.send(message);
            } catch (e) {
                console.error(`Failed to send search query for column ${targetCol}:`, e);
                if (errorDiv) {
                    errorDiv.textContent = `Failed to send search query for column ${targetCol}.`;
                    errorDiv.style.display = 'block';
                }
                if (loadingDiv) loadingDiv.style.display = 'none';
                lastSearchedCol = null; // Reset expected column on send error
            }
        } else {
            console.error("WebSocket is not connected. Cannot send search query.");
            if (errorDiv) {
                errorDiv.textContent = 'WebSocket is not connected. Please refresh the page.';
                errorDiv.style.display = 'block';
            }
            if (loadingDiv) loadingDiv.style.display = 'none';
            lastSearchedCol = null; // Reset expected column
        }
    }

    // --- WebSocket Message Handling specific to the table page ---
    function setupTableWebSocketListener() {
        if (typeof socket !== 'undefined' && socket) {
            console.log("Setting up table-specific WebSocket message listener.");
            socket.onmessage = function (event) {
                console.log("WebSocket message received (table handler):", event.data);
                if (loadingDiv) loadingDiv.style.display = 'none'; // Hide global loading on any message

                try {
                    const message = JSON.parse(event.data);

                    // --- Handle incoming messages ---

                    // Assumes 'results' correspond to the 'lastSearchedCol'
                    if (message.action === 'results' && message.data) {
                        if (typeof lastSearchedCol === 'number') {
                            if (errorDiv) errorDiv.style.display = 'none';
                            const newChunks = Array.isArray(message.data) ? message.data : [message.data];

                            // Append new chunks to the correct column's cache
                            columnCaches[lastSearchedCol].push(...newChunks);
                            console.log(`Updated cache for column ${lastSearchedCol}:`, columnCaches[lastSearchedCol]);

                            // Update the grid display for that column
                            updateTableColumn(lastSearchedCol);
                            // Consider setting lastSearchedCol = null if stream ends
                        } else {
                            console.warn("Received results, but no column was expecting them (lastSearchedCol is null).");
                        }

                        // Handle errors - maybe display globally or per column?
                    } else if (message.action === 'error' && message.data) {
                        console.error("Received error from server:", message.data.message);
                        if (errorDiv) {
                            errorDiv.textContent = `Server error: ${message.data.message}`;
                            errorDiv.style.display = 'block';
                        }
                        // Optionally clear the column that triggered the error:
                        // if (typeof lastSearchedCol === 'number') {
                        //     clearResultsColumn(lastSearchedCol);
                        // }
                        lastSearchedCol = null; // Reset expected column on error

                    } else {
                        console.log("Received unhandled message action or format:", message.action, message);
                        // Handle other actions if needed (e.g., 'end_of_stream' to reset lastSearchedCol)
                    }

                } catch (e) {
                    console.error("Failed to parse WebSocket message or update table UI:", e);
                    if (errorDiv) {
                        errorDiv.textContent = 'Failed to process server response.';
                        errorDiv.style.display = 'block';
                    }
                    lastSearchedCol = null; // Reset on parse error
                }
            };

            socket.onerror = socket.onerror || function (error) { console.error("WS Error (table):", error); lastSearchedCol = null; };
            socket.onclose = socket.onclose || function (event) { console.log("WS Closed (table):", event); lastSearchedCol = null; };

        } else {
            console.warn("Socket not ready, retrying listener setup...");
            setTimeout(setupTableWebSocketListener, 500);
        }
    }

    // Initial setup call
    setupTableWebSocketListener();

}); 