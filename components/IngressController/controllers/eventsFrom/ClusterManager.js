const debug = require('debug')(`app:ingresscontroller:eventsFrom:ClusterManager`)

// this is bound to the component
module.exports = function () {
    if (!this.app.components['ClusterManager']) return

    this.app.components['ClusterManager'].on('serviceStarted', async (info) => {
        try {
            this.ingress.addUpStream(info)
            await this.ingress.reloadNginx()
        } catch (err) {
            throw err
        }
    })
    this.app.components['ClusterManager'].on('serviceStopped', async (serviceId) => {
        try {
            this.ingress.removeUpStream(serviceId)
            await this.ingress.reloadNginx()
        } catch (err) {
            throw (err)
        }
    })
    this.app.components['ClusterManager'].on('serviceScaled', async () => {
        try {
            await this.ingress.reloadNginx()
        } catch (err) {
            throw err
        }
    })
    this.app.components['ClusterManager'].on('serviceReloaded', async () => {
    })
}
