const debug = require('debug')('app:router:lmodel')
const multer = require('multer')
const form = multer({ dest: process.env.TEMP_FILE_PATH }).single('file')

function answer(out, res) {
    if (out.bool) res.json(out.msg)
    else { res.status(400); res.json({ status: out.msg }) }
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
                webserver.emit("createLModel", (ans) => { answer(ans, res) }, req.body)
            }]
    },
    {
        path: '/generate/graph',
        method: 'post',
        requireAuth: false,
        controller:
            (req, res, next) => {
                webserver.emit("generateLModel", (ans) => { answer(ans, res) }, req.params.modelId)
            }
    },
    {
        path: '/',
        method: 'delete',
        requireAuth: false,
        controller:
            (req, res, next) => {
                webserver.emit("deleteLModel", (ans) => { answer(ans, res) }, req.params.modelId)
            }
    },
    {
        path: '/',
        method: 'get',
        requireAuth: false,
        controller:
            (req, res, next) => {
                webserver.emit("getLModel", (ans) => { answer(ans, res) }, req.params.modelId)
            }
    }]
}