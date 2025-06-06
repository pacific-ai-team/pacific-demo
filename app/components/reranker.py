from typing import List
from app.components.models import Chunk

class Reranker:
    def rerank(self, query: str, chunks: List[Chunk]) -> List[Chunk]:
        """Simulates reranking chunks based on the query."""
        print(f"Reranker: Reranking {len(chunks)} chunks for query '{query}'...")

        # Simple simulation: Sort by predefined similarity score (descending)
        # In a real app, this would involve a more sophisticated model (e.g., Cohere Rerank)
        self.get_chunk_length_percentiles(chunks)

        reranked_chunks = sorted(
            chunks,
            # key=lambda c: c.embedding_similarity_score if c.embedding_similarity_score is not None else 0,
            key=lambda c: c.reranking_score if c.reranking_score is not None else 0,
            reverse=True
        )
        

        # Assign a simple reranking score (e.g., based on new position)
        for i, chunk in enumerate(reranked_chunks):
            chunk.reranking_score = 1.0 - (i / len(reranked_chunks)) # Higher rank = higher score

        print(f"Reranker: Reranking complete.")
        return reranked_chunks

    def get_chunk_length_percentiles(self, chunks: List[Chunk]) -> dict[int, float]:
        """
        Calculate the length percentile for each chunk relative to all chunks.
        Returns a dictionary mapping chunk ID to its length percentile (0-1).
        """
        # Get lengths of all chunks
        chunk_lengths = [(chunk.id, len(chunk.text)) for chunk in chunks]
        
        # Sort chunks by length
        sorted_lengths = sorted([length for _, length in chunk_lengths])
        total_chunks = len(sorted_lengths)
        
        # Calculate percentile for each chunk
        # percentiles = {}
        for chunk in chunks:
            # Find position of this length in sorted list
            position = sorted_lengths.index(len(chunk.text))
            # print(chunk.text, position)
            # Calculate percentile (0-1 scale)
            percentile = position / (total_chunks - 1) if total_chunks > 1 else 0
            # percentiles[chunk_id] = percentile
            chunk.reranking_score = (chunk.embedding_similarity_score * .3) + (chunk.trigram_similarity_score * .3) + (percentile * 4.0)