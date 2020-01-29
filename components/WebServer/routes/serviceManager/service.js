const debug = require('debug')('app:router:servicemanager')
let YAML = require('yamljs');
const multer = require('multer')
const form = multer({ dest: process.env.TEMP_FILE_PATH }).none()

const middlewares = require(`${process.cwd()}/components/WebServer/middlewares/index.js`)
const answer = (ans, req) => {
    middlewares.answer(ans, req)
}

/*
function ans(req,res,next){
    webserver.app.components['clusterManager'].once("clusterOk", (data) => {
        timerErr
        res.end()
     })

     webserver.app.components['clusterManager'].once("clusterKo", (data) => {
        res.end()
     })


    timerErr = setTimeout(()=>{
        webserver.app.components['clusterManager'].removeEventListener("clusterOk")
        res.end()
    },1000)
}
*/

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
            }, async (req, res, next) => {
                req.body.serviceId = req.params.serviceId
                webserver.emit("createService", (ans) => { answer(ans, res) }, req.body)
            }]
    },
    {
        path: '/start',
        method: 'post',
        requireAuth: false,
        controller:
            (req, res, next) => {
                webserver.emit("startService", (ans) => { answer(ans, res) }, req.params.serviceId)
            }
    },
    {
        path: '/scale/:replicas',
        method: 'post',
        requireAuth: false,
        controller:
            async (req, res, next) => {
                req.params.replicas = parseInt(req.params.replicas)
                webserver.emit("scaleService", (ans) => { answer(ans, res) }, req.params)
            }
    },
    {
        path: '/stop',
        method: 'post',
        requireAuth: false,
        controller:
            (req, res, next) => {
                webserver.emit("stopService", (ans) => { answer(ans, res) }, req.params.serviceId)
            }
    },
    {
        path: '/reload',
        method: 'post',
        requireAuth: false,
        controller:
            (req, res, next) => {
                webserver.emit("reloadService", (ans) => { answer(ans, res) }, req.params.serviceId)
            }
    },
    {
        path: '/',
        method: 'put',
        requireAuth: false,
        controller:
            [function (req, res, next) {
                form(req, res, function (err) {
                    if (err instanceof multer.MulterError) { res.status(400); res.json({ status: err }) }
                    else next()
                })
            }, (req, res, next) => {
                req.body.serviceId = req.params.serviceId
                webserver.emit("updateService", (ans) => { answer(ans, res) }, req.body)
            }]
    },
    {
        path: '/',
        method: 'delete',
        requireAuth: false,
        controller:
            (req, res, next) => {
                webserver.emit("deleteService", (ans) => { answer(ans, res) }, req.params.serviceId)
            }
    },
    {
        path: '/',
        method: 'get',
        requireAuth: false,
        controller:
            (req, res, next) => {
                webserver.emit("getService", (ans) => { answer(ans, res) }, req.params.serviceId)
            }
    },
    {
        path: '/replicas',
        method: 'get',
        requireAuth: false,
        controller:
            async (req, res, next) => {
                webserver.emit("getReplicasService", (ans) => { answer(ans, res) }, req.params.serviceId)
            }
    },
    {
        path: '/mode',
        method: 'get',
        requireAuth: false,
        controller:
            async (req, res, next) => {
                webserver.emit("getModeService", (ans) => { answer(ans, res) }, req.params.serviceId)
            }
    },
    {
        path: '/test',
        method: 'get',
        requireAuth: false,
        controller:
            async (req, res, next) => {
                webserver.emit("testroute", (ans) => { answer(ans, res) }, req.params.serviceId)
            }
    }]
}