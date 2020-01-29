const debug = require('debug')('app:router:lmodels')

const middlewares = require(`${process.cwd()}/components/WebServer/middlewares/index.js`)
const answer = (ans, req) => {
    middlewares.answer(ans, req)
}

module.exports = (webserver) => {
    return [{
        path: '/',
        method: 'get',
        requireAuth: false,
        controller:
            (req, res, next) => {
                webserver.emit("getLModels", (ans) => { answer(ans, res) })
            }
    }]
}