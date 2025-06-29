from typing import List, Set, Tuple
from app.components.models import Chunk

# --- Trigram Helper Functions ---

def get_trigrams(text: str) -> Set[str]:
    """Generates trigrams from a string."""
    if not text:
        return set()
    # Pad with spaces for beginning/end trigrams
    text = ' ' + text.lower() + ' '
    # Generate unique trigrams
    return {text[i:i+3] for i in range(len(text) - 2)}

def trigram_similarity(set1: Set[str], set2: Set[str]) -> float:
    """Calculates Jaccard similarity between two sets of trigrams."""
    if not set1 or not set2:
        return 0.0
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    # Avoid division by zero
    return float(intersection) / union if union > 0 else 0.0

# --- Expanded Hardcoded Data ---
# Original Fruit/Veggie Data + ~30 Financial/Company Chunks
HARDCODED_CHUNKS = [
    Chunk(id=1, text="Apples are a type of fruit that grows on trees.", source="FruitDB", embedding_similarity_score=0.9),
    Chunk(id=2, text="Bananas are yellow and grow in bunches.", source="FruitDB", embedding_similarity_score=0.8),
    Chunk(id=3, text="Carrots are root vegetables, often orange in color.", source="VeggieDB", embedding_similarity_score=0.3),
    Chunk(id=4, text="Broccoli is a green vegetable resembling a tree.", source="VeggieDB", embedding_similarity_score=0.2),
    Chunk(id=5, text="The history of apples dates back thousands of years.", source="HistoryDocs", embedding_similarity_score=0.7),
    Chunk(id=6, text="Acme Corp reported Q3 revenue of $1.2 billion, exceeding forecasts.", source="EarningsReport_Q3", embedding_similarity_score=0.85),
    Chunk(id=7, text="Globex Inc. announced a new sales strategy targeting emerging markets.", source="PressRelease_Sales", embedding_similarity_score=0.78),
    Chunk(id=8, text="Stark Industries projects a 15% increase in profit for the next fiscal year.", source="InvestorCall_FY24", embedding_similarity_score=0.92),
    Chunk(id=9, text="Wayne Enterprises saw a slight dip in Q2 sales due to supply chain issues.", source="QuarterlyReview_Q2", embedding_similarity_score=0.65),
    Chunk(id=10, text="Cyberdyne Systems is investing heavily in AI research and development.", source="RD_StrategyDoc", embedding_similarity_score=0.88),
    Chunk(id=11, text="Ollivanders Makers of Fine Wands reported steady sales in the magical community.", source="WizardingBiz_Q1", embedding_similarity_score=0.55),
    Chunk(id=12, text="Initech's latest software update aims to improve TPS report efficiency.", source="ProductUpdate_v3", embedding_similarity_score=0.72),
    Chunk(id=13, text="Aperture Science Enrichment Center released new data on portal technology adoption.", source="ResearchPaper_Portal", embedding_similarity_score=0.95),
    Chunk(id=14, text="Sirius Cybernetics Corporation denies issues with their Genuine People Personalities feature.", source="SCC_InternalMemo", embedding_similarity_score=0.40),
    Chunk(id=15, text="MomCorp's friendly robot division forecasts increased demand next quarter.", source="MomCorp_SalesForecast", embedding_similarity_score=0.81),
    Chunk(id=16, text="Revenue at Pied Piper surged after the launch of their compression algorithm.", source="TechCrunch_PiedPiper", embedding_similarity_score=0.90),
    Chunk(id=17, text="Hooli faced challenges integrating their Nucleus platform, impacting Q4 revenue.", source="WSJ_Hooli", embedding_similarity_score=0.68),
    Chunk(id=18, text="Wonka Industries reported a 20% rise in chocolate sales, driven by new products.", source="CandyNews_Wonka", embedding_similarity_score=0.83),
    Chunk(id=19, text="The Umbrella Corporation's pharmaceutical division saw revenue growth of 10%.", source="PharmaTimes_Umbrella", embedding_similarity_score=0.77),
    Chunk(id=20, text="Soylent Corp assures the public about the sustainability of its food products.", source="Soylent_PR", embedding_similarity_score=0.35),
    Chunk(id=21, text="Massive Dynamic's R&D spending increased by 25% year-over-year.", source="MD_Financials_FY23", embedding_similarity_score=0.89),
    Chunk(id=22, text="LexCorp's energy sector reported record profits in the last fiscal year.", source="MetropolisNews_LexCorp", embedding_similarity_score=0.91),
    Chunk(id=23, text="The Tyrell Corporation anticipates high demand for its new line of replicants.", source="Tyrell_SalesProjection", embedding_similarity_score=0.84),
    Chunk(id=24, text="Veridian Dynamics focuses on employee wellness and synergy initiatives.", source="VD_HR_Bulletin", embedding_similarity_score=0.50),
    Chunk(id=25, text="Buy N Large aims to expand its retail operations globally.", source="BNL_ExpansionPlan", embedding_similarity_score=0.79),
    Chunk(id=26, text="Blue Sun Corporation continues to dominate the interplanetary shipping market.", source="GalacticTradeJournal", embedding_similarity_score=0.87),
    Chunk(id=27, text="Weyland-Yutani Corp invests in terraforming technology for off-world colonies.", source="WY_InvestmentReport", embedding_similarity_score=0.93),
    Chunk(id=28, text="Zorg Industries showed strong sales performance in their weapons division.", source="ArmsDealerWeekly", embedding_similarity_score=0.75),
    Chunk(id=29, text="Virtucon's global expansion project requires significant capital investment.", source="Virtucon_FinanceMeeting", embedding_similarity_score=0.80),
    Chunk(id=30, text="Spacely Space Sprockets forecasts growth despite competition from Cogswell Cogs.", source="OrbitCityTimes", embedding_similarity_score=0.71),
    Chunk(id=31, text="Stark Industries Q1 revenue was $2.5 billion, driven by defense contracts.", source="FinancialTimes_StarkQ1", embedding_similarity_score=0.94),
    Chunk(id=32, text="Globex Inc. sales forecast for next year is $500 million.", source="Globex_FY25_Forecast", embedding_similarity_score=0.76),
    Chunk(id=33, text="Wayne Enterprises R&D division focuses on sustainable energy solutions.", source="GothamGazette_Wayne", embedding_similarity_score=0.82),
    Chunk(id=34, text="Acme Corp profit margin improved to 18% in the last quarter.", source="Acme_Q3_Analysis", embedding_similarity_score=0.86),
    Chunk(id=35, text="Cyberdyne's Skynet project timeline remains on schedule according to internal reports.", source="Cyberdyne_ProjectUpdate", embedding_similarity_score=0.60),
    Chunk(id=36, text="Wonka revenues were up 10% in the last quarter to $200 Million.", source="CandyNews_Wonka", embedding_similarity_score=0.83),
    Chunk(id=37, text="Aperture Science introduces new long-fall boots for test subjects.", source="Aperture_ProductRelease", embedding_similarity_score=0.78),
    Chunk(id=38, text="Black Mesa incident containment costs have exceeded initial projections by 300%.", source="BlackMesa_InternalAudit", embedding_similarity_score=0.92),
    Chunk(id=39, text="Omni Consumer Products (OCP) has secured the security contract for Old Detroit.", source="DetroitNews_OCP", embedding_similarity_score=0.95),
    Chunk(id=40, text="Stark Industries' Arc Reactor technology sees a breakthrough in efficiency.", source="TechCrunch_Stark", embedding_similarity_score=0.96),
    Chunk(id=41, text="The Gringotts Wizarding Bank reports a surge in goblin-led security audits.", source="DailyProphet_Finance", embedding_similarity_score=0.65),
    Chunk(id=42, text="CHOAM company profits are intricately linked with spice production on Arrakis.", source="ArrakisEconomicReview", embedding_similarity_score=0.88),
    Chunk(id=43, text="Rekall Inc. faces scrutiny over the psychological impact of memory implants.", source="MarsChronicle_Health", embedding_similarity_score=0.72),
    Chunk(id=44, text="Yoyodyne Propulsion Systems denies rumors of inter-dimensional travel research.", source="GroversMillGazette", embedding_similarity_score=0.68),
    Chunk(id=45, text="Cyberdyne Systems model 101 sales are performing well in the private security sector.", source="Cyberdyne_SalesDeck", embedding_similarity_score=0.81),
    Chunk(id=46, text="Weyland-Yutani xenomorph research budget has been secretly tripled.", source="WY_ClassifiedMemo", embedding_similarity_score=0.97),
    Chunk(id=47, text="The Sirius Cybernetics Corporation's marketing division won an award for their 'Share and Enjoy' campaign.", source="GalacticMarketingAwards", embedding_similarity_score=0.55),
    Chunk(id=48, text="Wayne Enterprises has acquired a new patent for advanced grappling hook technology.", source="WayneTech_IPReport", embedding_similarity_score=0.85),
    Chunk(id=49, text="Soylent Green production is up 15% to meet rising consumer demand.", source="SoylentCorp_Q4Report", embedding_similarity_score=0.89),
    Chunk(id=50, text="Massive Dynamic founder William Bell is scheduled to give a talk on fringe science.", source="HarvardScienceJournal", embedding_similarity_score=0.77),
]

# --- Minimum number of chunks to return ---
MIN_CHUNKS_TO_RETURN = 2

# --- Personal Search Component ---
class PersonalSearch:
    def search(self, query: str) -> List[Chunk]:
        """
        Finds chunks similar to the query using trigram matching.
        Stores the similarity score on the chunk object.
        Always returns at least MIN_CHUNKS_TO_RETURN, sorted by similarity.
        """
        print(f"PersonalSearch: Searching for '{query}' using trigram matching...")


        # Return only the number needed, already sorted by trigram
        return HARDCODED_CHUNKS[:MIN_CHUNKS_TO_RETURN]