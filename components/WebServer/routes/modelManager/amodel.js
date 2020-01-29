const debug = require('debug')('app:router:amodel')
const multer = require('multer')
const form = multer({ dest: process.env.TEMP_FILE_PATH }).single('file')
const middlewares = require(`${process.cwd()}/components/WebServer/middlewares/index.js`)
const answer = (ans, req) => {
    middlewares.answer(ans, req)
}

module.exports = (webserver) => {
    return [{
        path: '/',
        method: 'post',
        requireAuth: false,
        controller:
            [function (req, res, next) {
                form(req, res, function (err) {
                    if (err instanceof multer.MulterError) { res.status(400); res.json({ status: err }) }
                    else next()
                })
            }, (req, res, next) => {
                req.body.modelId = req.params.modelId
                req.body.file = req.file
                webserver.emit("createAModel", (ans) => { answer(ans, res) }, req.body)
            }]
    },
    {
        path: '/',
        method: 'delete',
        requireAuth: false,
        controller:
            (req, res, next) => {
                webserver.emit("deleteAModel", (ans) => { answer(ans, res) }, req.params.modelId)
            }
    },
    {
        path: '/',
        method: 'get',
        requireAuth: false,
        controller:
            (req, res, next) => {
                webserver.emit("getAModel", (ans) => { answer(ans, res) }, req.params.modelId)
            }
    }]
}