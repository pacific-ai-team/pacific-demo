# FastAPI Personal Search Demo

This is a skeleton FastAPI application demonstrating a simple personal search workflow including retrieval, reranking, and LLM summarization using `pydantic-ai`.

## Features

*   **FastAPI Backend:** Serves a static frontend and a search API endpoint.
*   **Personal Search:** Simulates retrieving chunks (currently hardcoded).
*   **Reranker:** Simulates reranking retrieved chunks (currently sorts by score).
*   **LLM Summarization:** Uses `pydantic-ai` and OpenAI (GPT-4o-mini by default) to generate a summary based on the top reranked chunks.
*   **Simple Frontend:** Basic HTML page with a search box to interact with the API.

## Project Structure

```
/
├── app/
│   ├── components/
│   │   ├── __init__.py
│   │   ├── models.py         # Pydantic models (Chunk)
│   │   ├── personal_search.py # PersonalSearch component
│   │   └── reranker.py        # Reranker component
│   ├── static/
│   │   ├── index.html        # Frontend HTML
│   │   ├── script.js         # Frontend JavaScript
│   │   └── style.css         # Frontend CSS
│   ├── __init__.py
│   └── main.py             # FastAPI app definition and routes
├── .env                    # Environment variables (needs OPENAI_API_KEY)
├── requirements.txt        # Python dependencies
├── pyproject.toml          # Poetry configuration and dependencies
└── README.md               # This file
```

## Setup

1.  **Clone the repository (or create the files as generated).**

2.  **Ensure you have Poetry installed.** If not, follow the instructions on the [official Poetry website](https://python-poetry.org/docs/#installation).

3.  **Navigate to the project directory.**

4.  **Install dependencies using Poetry:**
    ```bash
    poetry install
    ```
    This will create a virtual environment (if one doesn't exist) and install all the dependencies specified in `pyproject.toml`.

5.  **Create a `.env` file** in the project root directory.

6.  **Add your OpenAI API key** to the `.env` file:
    ```
    OPENAI_API_KEY="YOUR_ACTUAL_OPENAI_API_KEY"
    ```
    *Note: The application will run without this, but the LLM summarization step will fail.*

## Running the Application

Use Uvicorn to run the FastAPI server:

```bash
uvicorn app.main:app --reload --port 8000
```

Alternatively, you can run the app using Poetry:

`kill -9 $(lsof -ti :8000)`

```bash
poetry run uvicorn app.main:app --reload --port 8000
```

*   `app.main:app`: Tells Uvicorn where the FastAPI application instance (`app`) is located.
*   `--reload`: Enables auto-reloading when code changes (useful for development).
*   `--port 8000`: Specifies the port to run on.

Open your web browser and navigate to `http://localhost:8000`.

You can now enter queries into the search box and see the simulated results, reranking, and LLM summary.

## How it Works

1.  The user enters a query in the frontend (`index.html`).
2.  JavaScript (`script.js`) sends the query to the `/search` endpoint on the FastAPI backend.
3.  The `search_endpoint` in `main.py` receives the query.
4.  It calls the `PersonalSearch` component (`personal_search.py`) to get initial chunks (hardcoded).
5.  It calls the `Reranker` component (`reranker.py`) to reorder the chunks (simple sort).
6.  It takes the top N reranked chunks and formats them as context.
7.  It uses the `pydantic-ai` `Agent` to call the configured OpenAI model, providing the query and context.
8.  The LLM generates an explanation and confidence score based *only* on the provided context.
9.  The backend sends the LLM summary and the list of reranked chunks back to the frontend.
10. JavaScript updates the HTML to display the results. 