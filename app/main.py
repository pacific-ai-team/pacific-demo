import os
from typing import List, Optional

from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from dotenv import load_dotenv

from app.components.models import Chunk
from app.components.personal_search import PersonalSearch
from app.components.reranker import Reranker

# Load environment variables (for OPENAI_API_KEY)
load_dotenv()

# --- Pydantic Models ---
class SearchResponse(BaseModel):
    llm_summary: str
    reranked_chunks: List[Chunk]
    original_query: str

class Answer(BaseModel):
    """Represents the LLM's answer based on the provided context."""
    explanation: str = Field(..., description="A concise explanation answering the user's query based *only* on the provided text chunks.")
    confidence_score: float = Field(..., description="A score between 0.0 and 1.0 indicating the confidence in the answer based on the provided context.")

# --- FastAPI App Setup ---
app = FastAPI(title="Personal Search Demo")

# Mount static files directory
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# --- Template Engine Setup ---
templates = Jinja2Templates(directory="app/templates")

# --- Components Initialization ---
personal_searcher = PersonalSearch()
reranker = Reranker()

# --- Pydantic AI Agent --- 
# Ensure OPENAI_API_KEY is set in your environment or .env file
llm_agent = Agent(
    "openai:gpt-4o-mini",
    system_prompt=(
        "You are a helpful assistant. Based *only* on the provided text chunks, "
        "answer the user's query concisely. Indicate your confidence."
    ),
    result_type=Answer
)

# --- Routes ---
@app.get("/")
async def read_index():
    """Serves the main HTML page."""
    return FileResponse('app/static/index.html')

@app.get("/table")
async def table_page(request: Request):
    """Serves the table HTML page."""
    # Use Request for template context if needed, otherwise it can be omitted
    return templates.TemplateResponse("table.html", {"request": request})

# TODO: add search endpoint here (hint, you need a query: str param)
@app.get("/search")
async def search(query: str):
    """Searches the personal search index and returns a response."""
    initial_chunks = personal_searcher.search(query)
    reranked_chunks = reranker.rerank(query, initial_chunks)
    
    llm_summary = await llm_agent.run(context)
    return SearchResponse(
        llm_summary=llm_summary.output.explanation,
        reranked_chunks=reranked_chunks,
        original_query=query
    )


# --- Health Check (Optional) ---
@app.get("/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    # This is for running the app directly (e.g., for debugging)
    # For production, use a command like: uvicorn app.main:app --reload
    print("Running FastAPI app directly. Use 'uvicorn app.main:app --reload' for development.")
    uvicorn.run(app, host="0.0.0.0", port=8000) 
