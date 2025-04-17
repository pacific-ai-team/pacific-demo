import os
from typing import List, Optional

from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from dotenv import load_dotenv

from .components.models import Chunk
from .components.personal_search import PersonalSearch
from .components.reranker import Reranker

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

@app.get("/search", response_model=SearchResponse)
async def search_endpoint(query: str = Query(..., min_length=1)):
    """Performs personal search, reranks, and generates an LLM summary."""
    print(f"Received query: {query}")

    try:
        # 1. Personal Search
        retrieved_chunks = personal_searcher.search(query)
        if not retrieved_chunks:
            raise HTTPException(status_code=404, detail="No chunks found by personal search.")

        # 2. Rerank
        reranked_chunks = reranker.rerank(query, retrieved_chunks)
        if not reranked_chunks:
             # Should not happen with current reranker, but good practice
            raise HTTPException(status_code=404, detail="Reranking resulted in no chunks.")

        # Limit chunks for LLM context to avoid large prompts (e.g., top 5)
        top_k_chunks = reranked_chunks[:5]

        # Prepare context for LLM
        context = "\n\n---\n\n".join([f"Source: {c.source}\nText: {c.text}" for c in top_k_chunks])
        llm_input = f"User Query: {query}\n\nContext Chunks:\n{context}"

        print("\n--- Sending to LLM Agent ---")
        print(llm_input)
        print("---------------------------\n")

        # 3. LLM Processing using Pydantic AI Agent
        try:
            # Get the result object first
            llm_run_result = await llm_agent.run(llm_input)
            # Access the parsed Answer model via the .data attribute
            llm_answer: Answer = llm_run_result.data 
            llm_summary = f"Explanation: {llm_answer.explanation} (Confidence: {llm_answer.confidence_score:.2f})"
        except AttributeError as attr_err:
            print(f"LLM Agent result structure error: {attr_err}. Result object: {llm_run_result}")
            llm_summary = "Could not parse LLM summary."
        except Exception as llm_err:
            print(f"LLM Agent error: {llm_err}")
            # Fallback if LLM fails
            llm_summary = "Could not generate LLM summary."

        print(f"LLM Summary: {llm_summary}")

        return SearchResponse(
            llm_summary=llm_summary,
            reranked_chunks=reranked_chunks, # Return all reranked chunks
            original_query=query
        )

    except HTTPException as http_exc:
        # Re-raise HTTPExceptions
        raise http_exc
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during search.")

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