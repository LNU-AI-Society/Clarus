from typing import List
from app.schemas import Document
from app.data.legislation import LEGISLATION_DOCS

def retrieve_context(query: str) -> List[Document]:
    """
    Simple keyword-based retrieval from the mock legislation database.
    In a real app, this would query a vector database or search engine.
    """
    query_lower = query.lower()
    results = []
    
    # Simple keyword matching
    keywords = {
        "uppsäg": ["uppsägning", "las"],
        "avsked": ["avsked", "las"],
        "semester": ["semester"],
        "ledig": ["semester", "ledig"],
        "saklig": ["saklig grund", "las"],
    }

    # If query matches a keyword concept, grab all relevant docs
    # Otherwise, do a naive text search
    
    found_concepts = False
    for concept, terms in keywords.items():
        if concept in query_lower:
            # Concept match - find docs with these terms in title/snippet
            for doc in LEGISLATION_DOCS:
                if any(term in doc.title.lower() or term in doc.snippet.lower() for term in terms):
                    if doc not in results:
                        results.append(doc)
            found_concepts = True
    
    # Fallback to broad search if no specific concept logic triggered
    if not results:
        for doc in LEGISLATION_DOCS:
            if query_lower in doc.title.lower() or query_lower in doc.snippet.lower():
                 results.append(doc)

    # Limit to top 3
    return results[:3]
