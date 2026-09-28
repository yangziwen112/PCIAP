const { RunnableLambda } = require('@langchain/core/runnables')
const { rankEvidence } = require('../evidence-ranking')

function toLinks(evidence) {
  return evidence.slice(0, 3).map(item => ({
    type: 'content', id: item.id, title: item.title, summary: item.summary,
    sourceName: item.sourceName, sourceUrl: item.sourceUrl
  }))
}

function dedupeEvidence(items, query = '') {
  return rankEvidence(items, query, { keywords: query ? undefined : [] }).slice(0, 4)
}

function createRetrievalAgent(repository) {
  return RunnableLambda.from(async state => {
    let evidence = []
    let retrievalError = ''
    try {
      if (state.intent.route === 'upcoming') evidence = await repository.getUpcoming(state.intent, state.query)
      else if (state.intent.route === 'campus_info') evidence = await repository.searchContents(state.query, state.intent)
    } catch (error) {
      retrievalError = String(error?.message || 'RETRIEVAL_FAILED').slice(0, 120)
      console.warn('RAG_RETRIEVAL_DEGRADED', { route: state.intent.route, error: retrievalError })
    }
    evidence = dedupeEvidence(evidence.length ? evidence : state.evidence, state.query)
    return {
      evidence,
      links: toLinks(evidence),
      stage: 'A',
      trace: [...state.trace, {
        stage: 'A',
        agent: 'retrieval',
        evidenceCount: evidence.length,
        status: retrievalError ? 'unavailable' : (evidence.length ? 'grounded' : 'no_match'),
        degraded: !!retrievalError,
        error: retrievalError || undefined
      }]
    }
  })
}

module.exports = { createRetrievalAgent, dedupeEvidence }
