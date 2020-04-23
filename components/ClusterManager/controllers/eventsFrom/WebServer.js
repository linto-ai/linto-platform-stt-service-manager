const debug = require('debug')(`app:dockerswarm:eventsFrom:WebServer`)

// this is bound to the component
module.exports = function () {
    if (!this.app.components['WebServer']) return

    this.app.components['WebServer'].on('startService', async (cb, serviceId) => {
        /**
          * Create a docker service by service Object
          * @param serviceId
          * @returns {Object}
        */
        try {
            const service = await this.db.service.findService(serviceId)
            if (!service) throw `Service '${serviceId}' does not exist`
            if (service.isOn) throw `Service '${serviceId}' is already started`
            const lmodel = await this.db.lm.findModel(service.LModelId)
            if (!lmodel) throw `Language Model used by this service has been removed`
            if (!lmodel.isGenerated) throw `Service '${serviceId}' could not be started (Language Model '${service.LModelId}' has not been generated yet)`


            await this.cluster.startService(service)
            const check = await this.cluster.checkServiceOn(service)
            if (check) {
                this.emit("serviceStarted", { service: serviceId, port: process.env.LINSTT_PORT, tag: service.tag })
                await this.db.service.updateService(serviceId, { isOn: 1 })
            }
            else {
                await this.cluster.stopService(serviceId)
                throw `Something went wrong. Service '${serviceId}' is not started`
            }
            return cb({ bool: true, msg: `Service '${serviceId}' is successfully started` })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

    this.app.components['WebServer'].on('stopService', async (cb, serviceId) => {
        /**
          * delete a docker service by service Object
          * @param serviceId
          * @returns {Object}
        */
        try {
            const service = await this.db.service.findService(serviceId)
            if (service === -1) throw `Service '${serviceId}' does not exist`
            if (!service.isOn) throw `Service '${serviceId}' is not running`
            await this.cluster.stopService(serviceId)
            await this.cluster.checkServiceOff(serviceId)
            await this.db.service.updateService(serviceId, { isOn: 0 })
            this.emit("serviceStopped", serviceId)
            return cb({ bool: true, msg: `Service '${serviceId}' is successfully stopped` })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

    this.app.components['WebServer'].on('scaleService', async (cb, payload) => {
        /**
          * Update a docker service by service Object
          * @param {Object}: {serviceId, replicas}
          * @returns {Object}
        */
        try {
            payload.replicas = parseInt(payload.replicas)
            const service = await this.db.service.findService(payload.serviceId)
            if (!service) throw `Service '${payload.serviceId}' does not exist`
            if (payload.replicas < 1) throw 'The scale must be greater or equal to 1'
            await this.cluster.scaleService(payload)
            await this.cluster.checkServiceOn(payload)
            await this.db.service.updateService(payload.serviceId, { replicas: payload.replicas })
            this.emit("serviceScaled")
            return cb({ bool: true, msg: `Service '${payload.serviceId}' is successfully scaled` })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

    this.app.components['WebServer'].on('reloadService', async (cb, serviceId) => {
        try {
            const service = await this.db.service.findService(serviceId)
            if (!service) throw `Service '${serviceId}' does not exist`
            return cb({ bool: true, msg: `It has not been developped yet` })
            this.emit("serviceReloaded")
            return cb({ bool: true, msg: `Service '${serviceId}' is successfully reloaded` })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

    this.app.components['WebServer'].on('getReplicasService', async (cb, serviceId) => {
        /**
          * get number of replicas for a giving service
          * @param serviceId
          * @returns {Object}
        */
        try {
            const service = await this.db.service.findService(serviceId)
            if (!service) throw `Service '${serviceId}' does not exist`
            return cb({ bool: true, msg: service.replicas })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

    this.app.components['WebServer'].on('getModeService', async (cb, serviceId) => {
        /**
          * get number of replicas for a giving service
          * @param serviceId
          * @returns {Object}
        */
        try {
            const service = await this.db.service.findService(serviceId)
            if (!service) throw `Service '${serviceId}' does not exist`
            return cb({ bool: true, msg: service.tag })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

    this.app.components['WebServer'].on('getRunningServices', async (cb) => {
        /**
          * Find running docker services
          * @param None
          * @returns {Object}
        */
        try {
            const res = await this.db.service.findServices({ isOn: 1 })
            return cb({ bool: true, msg: res })
        } catch (err) {
            return cb({ bool: false, msg: err })
        }
    })

}
