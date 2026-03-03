import { getConcerts } from '../../lib/notion'

export default async function handler(req, res) {
  try {
    const concerts = await getConcerts()
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
    res.status(200).json(concerts)
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des concerts' })
  }
}
