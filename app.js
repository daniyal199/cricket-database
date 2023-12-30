const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
const app = express()
app.use(express.json())
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const convertPlayerDbToResponse = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
    SELECT
    *
    FROM
    player_details`

  const player = await db.all(getPlayersQuery)
  response.send(player.map((each) => convertPlayerDbToResponse(each))
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
    SELECT 
    *
    FROM
    player_details
    WHERE 
    player_id = ${playerId}`

  const player = await db.get(getPlayerQuery)
  response.send(convertPlayerDbToResponse(player))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body

  const updatePlayerQuery = `
    UPDATE
    player_details
    SET
    player_name = '${playerName}'
    WHERE 
    player_id = ${playerId}`

  await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

const converMatchDetailsObjectToResponseObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchDetails = `
    SELECT 
    *
    FROM 
    match_details
    WHERE 
    match_id = ${matchId}`
  const matchArray = await db.get(getMatchDetails)
  response.send(converMatchDetailsObjectToResponseObject(matchArray))
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getMatchDetailsQuery = `
    SELECT
    *
    FROM player_match_score
    NATURAL JOIN player_details
    WHERE 
    player_id = ${playerId}`
  const playerMatch = await db.all(getMatchDetailsQuery)
  response.send(
    playerMatch.map(each => converMatchDetailsObjectToResponseObject(each)),
  )
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getMatchDetailsQuery = `
    SELECT
    *
    FROM player_match_score
    NATURAL JOIN player_details
    WHERE 
    match_id = ${matchId}`
  const Match = await db.get(getMatchDetailsQuery)
  response.send(Match.map(each => convertPlayerDbToResponse(each)))
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getMatchDetailsQuery = `
    SELECT 
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM
    player_match_score
    NATURAL JOIN player_details
    WHERE
    player_id = ${playerId};
   `

  const Match = await db.get(getMatchDetailsQuery)
  response.send(Match)
})
