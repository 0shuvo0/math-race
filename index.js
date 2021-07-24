const { LOADIPHLPAPI } = require('dns')
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const path = require('path')
const PORT = process.env.PORT || 3000
const { Server } = require("socket.io");
const io = new Server(server)

let games = {}

io.on('connection', (socket) => {
    socket.on('join', (gameId) => {
        if(!games[gameId]){
            games[gameId] = []
        }else{
            //inform new racer about existing racers
            socket.emit("joined-racers", games[gameId])
        }
        //inform existing racers about new racer
        games[gameId].map(racerId => {
            io.sockets.sockets.get(racerId).emit("joined-racers", [socket.id])
        })

        games[gameId].push(socket.id)
    })

    socket.on("current-user-answered", ({ answered, gameId }) => {
        games[gameId].map(racerId => {
            if(racerId == socket.id) return
            io.sockets.sockets.get(racerId).emit("racer-answered", {
                answered,
                racerId: socket.id
            })
        })
    })
    
    socket.on('disconnect', () => {
        io.emit("racer-left", socket.id)
        for(game in games) {
            let id = games[game].indexOf(socket.id)
            if(id > -1) {
                games[game].splice(games[game].indexOf(socket.id), 1)
                if(games[game].length == 0) delete games[game]
            }
        }
    })
})

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('/new', (req, res) => {
    //generate random id consisting letters and numbers
    const id = Math.random().toString(36).substr(2, 9)
    res.redirect(`/game/${id}`)
})

app.get('/game/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game.html'))
})


server.listen(PORT, () => console.log(`Listening on port ${PORT}`))