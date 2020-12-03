const debug = require('debug')(`app:dockerswarm:eventsFrom:myself`)

// this is bound to the component
module.exports = function () {
    this.on('verifServices', async () => {
        try {
            const services = await this.db.service.findServices()
            if (services !== -1) {
                services.forEach(async service => {
                    if (service.isOn) { //check if the service is running
                        const replicas = await this.cluster.serviceIsOn(service.serviceId)
                        if (replicas !== service.replicas) {
                            await this.cluster.stopService(service.serviceId).catch(err => {})
                            await this.cluster.startService(service)
                            //const check = await this.cluster.checkServiceOn(service)
                            const check = true
                            if (check && service.externalAccess) {
                                this.emit("serviceStarted", { service: service.serviceId, tag: service.tag })
                            }
                        } else {
                            if (service.externalAccess)
                                this.emit("serviceStarted", { service: service.serviceId, tag: service.tag })
                        }
                    } else { //
                        const replicas = await this.cluster.serviceIsOn(service.serviceId)
                        if (replicas > 0) {
                            await this.cluster.stopService(service.serviceId)
                        }
                    }
                })
            }
        } catch (err) {
            console.error(err)
            throw err
        }
    })
}