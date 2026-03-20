/**
 * ABN Lookup Cloud Function
 * ==========================
 * Proxies requests to the Australian Business Register (ABR) API.
 * Requires a registered GUID from abr.business.gov.au.
 *
 * Config: firebase functions:config:set abr.guid="YOUR_GUID"
 */

import * as functions from 'firebase-functions'
import cors from 'cors'
import fetch from 'node-fetch'

const corsHandler = cors({ origin: true })

interface AbnResult {
  abn: string
  entityName: string
  entityType: string
  status: string
  state: string
  postcode: string
  isActive: boolean
}

/**
 * Unified ABN lookup — searches by ABN number OR company name.
 * Query params:
 *   ?abn=12345678901       → Search by ABN (11 digits)
 *   ?name=Hollis+Pty       → Search by company name
 *   ?name=Hollis&state=NSW → Search by name filtered by state
 */
export const abnLookup = functions.region('australia-southeast1').https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { abn, name, state: stateFilter } = req.query as { abn?: string; name?: string; state?: string }

      if (!abn && !name) {
        res.status(400).json({ error: 'Either "abn" or "name" parameter required' })
        return
      }

      const guid = functions.config().abr?.guid
      if (!guid) {
        res.status(500).json({ error: 'ABR API GUID not configured. Run: firebase functions:config:set abr.guid="YOUR_GUID"' })
        return
      }

      // Helper to extract XML tag value
      const getName = (xml: string, tag: string) => {
        const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
        return match ? match[1] : ''
      }

      // ── SEARCH BY ABN ──
      if (abn) {
        const cleanAbn = abn.replace(/\s/g, '')
        if (!/^\d{11}$/.test(cleanAbn)) {
          res.status(400).json({ error: 'ABN must be 11 digits' })
          return
        }

        const url = `https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/SearchByABNv202001?searchString=${cleanAbn}&includeHistoricalDetails=N&authenticationGuid=${guid}`
        const response = await fetch(url)
        const xml = await response.text()

        if (xml.includes('<exception>') || xml.includes('Search text is not a valid ABN')) {
          res.status(404).json({ error: 'ABN not found or invalid' })
          return
        }

        let entityName = getName(xml, 'organisationName')
        if (!entityName) {
          const givenName = getName(xml, 'givenName')
          const familyName = getName(xml, 'familyName')
          entityName = `${givenName} ${familyName}`.trim()
        }

        const result: AbnResult = {
          abn: cleanAbn,
          entityName,
          entityType: getName(xml, 'entityDescription'),
          status: getName(xml, 'entityStatusCode'),
          state: getName(xml, 'stateCode'),
          postcode: getName(xml, 'postcode'),
          isActive: getName(xml, 'entityStatusCode') === 'Active',
        }

        res.json(result)
        return
      }

      // ── SEARCH BY NAME ──
      if (name) {
        const searchName = name.trim()
        if (searchName.length < 2) {
          res.status(400).json({ error: 'Name must be at least 2 characters' })
          return
        }

        // ABR SearchByName API
        const stateParam = stateFilter ? `&searchState=${encodeURIComponent(stateFilter)}` : ''
        const url = `https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/ABRSearchByNameAdvancedSimpleProtocol2017?name=${encodeURIComponent(searchName)}&postcode=&legalName=Y&tradingName=Y&NSW=Y&SA=Y&ACT=Y&VIC=Y&WA=Y&NT=Y&QLD=Y&TAS=Y${stateParam}&authenticationGuid=${guid}&searchWidth=typical&minimumScore=80&maxSearchResults=10`

        const response = await fetch(url)
        const xml = await response.text()

        if (xml.includes('<exception>')) {
          const errMsg = getName(xml, 'exceptionDescription')
          res.status(400).json({ error: errMsg || 'Search failed' })
          return
        }

        // Parse multiple results from ABR XML
        const results: AbnResult[] = []
        const recordRegex = /<searchResultsRecord>([\s\S]*?)<\/searchResultsRecord>/g
        let match
        while ((match = recordRegex.exec(xml)) !== null) {
          const record = match[1]
          const recordAbn = getName(record, 'ABN') || getName(record, 'identifierValue')
          let recordName = getName(record, 'organisationName')
          if (!recordName) {
            const g = getName(record, 'givenName')
            const f = getName(record, 'familyName')
            recordName = `${g} ${f}`.trim()
          }
          // Also check mainName
          if (!recordName) {
            recordName = getName(record, 'mainName')
          }

          if (recordAbn) {
            results.push({
              abn: recordAbn.replace(/\s/g, ''),
              entityName: recordName || 'Unknown',
              entityType: getName(record, 'entityDescription') || getName(record, 'entityTypeCode'),
              status: getName(record, 'entityStatusCode') || 'Unknown',
              state: getName(record, 'stateCode') || '',
              postcode: getName(record, 'postcode') || '',
              isActive: getName(record, 'entityStatusCode') === 'Active',
            })
          }
        }

        res.json({ results, count: results.length, query: searchName })
        return
      }
    } catch (err: any) {
      console.error('ABN lookup error:', err)
      res.status(500).json({ error: err.message || 'ABN lookup failed' })
    }
  })
})
