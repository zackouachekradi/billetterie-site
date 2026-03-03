import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const DATABASE_ID = process.env.NOTION_DATABASE_ID

export async function getConcerts() {
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      sorts: [{ property: 'Date', direction: 'ascending' }],
    })

    return response.results.map((page) => {
      const props = page.properties
      const getText = (prop) => prop?.rich_text?.[0]?.plain_text || prop?.title?.[0]?.plain_text || ''
      const getSelect = (prop) => prop?.select?.name || ''
      const getNumber = (prop) => prop?.number || 0
      const getDate = (prop) => prop?.date?.start || ''
      const getCheckbox = (prop) => prop?.checkbox || false
      const getFiles = (prop) => prop?.files?.[0]?.file?.url || prop?.files?.[0]?.external?.url || ''

      const dateStr = getDate(props['Date'])
      const dateObj = dateStr ? new Date(dateStr) : null
      const DAYS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
      const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

      return {
        id: page.id,
        artist: getText(props['Artiste']) || getText(props['Name']),
        date: dateStr,
        dateFormatted: dateObj ? `${DAYS[dateObj.getDay()]} ${dateObj.getDate()} ${MONTHS[dateObj.getMonth()]} ${dateObj.getFullYear()}` : '',
        day: dateObj ? String(dateObj.getDate()).padStart(2, '0') : '',
        weekday: dateObj ? DAYS[dateObj.getDay()] : '',
        month: dateObj ? `${MONTHS[dateObj.getMonth()]} ${dateObj.getFullYear()}` : '',
        city: getText(props['Ville']),
        region: getText(props['Région']),
        genre: getSelect(props['Genre'])?.toLowerCase() || 'autre',
        price: getNumber(props['Prix']),
        venue: getText(props['Venue']),
        billetweb: getText(props['BilletwbID']),
        image: getFiles(props['Image']) || '',
        status: getSelect(props['Statut'])?.toLowerCase() || 'disponible',
        featured: getCheckbox(props['Mise en avant']),
      }
    })
  } catch (error) {
    console.error('Erreur Notion:', error)
    return []
  }
}
