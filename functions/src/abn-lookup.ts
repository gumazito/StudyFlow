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

export const abnLookup = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { abn } = req.query as { abn?: string }
      if (!abn) {
        res.status(400).json({ error: 'ABN parameter required' })
        return
      }

      // Strip spaces from ABN
      const cleanAbn = abn.replace(/\s/g, '')
      if (!/^\d{11}$/.test(cleanAbn)) {
        res.status(400).json({ error: 'ABN must be 11 digits' })
        return
      }

      const guid = functions.config().abr?.guid
      if (!guid) {
        res.status(500).json({ error: 'ABR API GUID not configured. Run: firebase functions:config:set abr.guid="YOUR_GUID"' })
        return
      }

      // ABR API returns JSON when callback=callback is omitted and we use the JSON endpoint
      const url = `https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx/SearchByABNv202001?searchString=${cleanAbn}&includeHistoricalDetails=N&authenticationGuid=${guid}`

      const response = await fetch(url)
      const xml = await response.text()

      // Parse key fields from XML response
      const getName = (tag: string) => {
        const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
        return match ? match[1] : ''
      }

      // Check if ABN was found
      if (xml.includes('<exception>') || xml.includes('Search text is not a valid ABN')) {
        res.status(404).json({ error: 'ABN not found or invalid' })
        return
      }

      // Extract entity name (try organisation name first, then individual name)
      let entityName = getName('organisationName')
      if (!entityName) {
        const givenName = getName('givenName')
        const familyName = getName('familyName')
        entityName = `${givenName} ${familyName}`.trim()
      }

      const entityType = getName('entityDescription')
      const status = getName('entityStatusCode')
      const state = getName('stateCode')
      const postcode = getName('postcode')

      const result: AbnResult = {
        abn: cleanAbn,
        entityName,
        entityType,
        status,
        state,
        postcode,
        isActive: status === 'Active',
      }

      res.json(result)
    } catch (err: any) {
      console.error('ABN lookup error:', err)
      res.status(500).json({ error: err.message || 'ABN lookup failed' })
    }
  })
})
