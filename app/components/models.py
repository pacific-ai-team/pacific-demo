from pydantic import BaseModel
from typing import Optional, Any

class Chunk(BaseModel):
    id: int
    text: str
    source: str
    embedding_similarity_score: Optional[float] = None
    reranking_score: Optional[float] = None
    trigram_similarity_score: Optional[float] = None 