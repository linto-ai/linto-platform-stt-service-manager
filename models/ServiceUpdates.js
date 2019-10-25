const debug = require('debug')('app:model:serviceupdates')
const datetime = require('node-datetime')
const query = require(`${process.cwd()}/models/MongoDB`)

class ServiceUpdates {
    constructor() {
        this.DB = process.env.MONGODB_DBNAME_SMANAGER
        this.collection = 'Services'
    }

    //create a new instance
    async createService(obj) {
        let newService = {
            serviceId: obj.serviceId,
            tag: obj.tag,
            replicas: obj.replicas,
            LModelId: obj.LModelId,
            AModelId: obj.AModelId,
            lang: obj.lang,
            isOn: 0,
            isDirty: 0,
            date: datetime.create().format('m/d/Y-H:M:S')
        }
        return await query.findOne(this.DB, this.collection, { serviceId: obj.serviceId }).then(async (service) => {
            if (service === null) return await query.insertOne(this.DB, this.collection, newService)
            return -1
        })
    }

    // find acoustic model by name
    async findService(id) {
        return await query.findOne(this.DB, this.collection, { serviceId: id }).then(async (service) => {
            if (service === null)
                return -1
            service.replicas = parseInt(service.replicas)
            return service
        })
    }

    // find all acoustic models
    async findServices(request = {}) {
        return await query.findMany(this.DB, this.collection, request).then(async (services) => {
            if (services.length === 0)
                return -1
            return services
        })
    }

    async updateService(id, obj) {
        return await query.findOne(this.DB, this.collection, { serviceId: id }).then(async (service) => {
            if (service === null)
                return -1
            if (service.isOn && obj.LModelId != undefined && service.LModelId != obj.LModelId)
                obj.isDirty = 1
            obj.date = datetime.create().format('m/d/Y-H:M:S')
            return await query.updateOne(this.DB, this.collection, { serviceId: id }, { mode: '$set', value: obj })
        })
    }

    async updateServicebyParam(param, obj) {
        return await query.updateMany(this.DB, this.collection, param, { mode: '$set', value: obj })
    }

    async deleteService(id) {
        return await query.findOne(this.DB, this.collection, { serviceId: id }).then(async (service) => {
            if (service === null)
                return -1
            return await query.deleteOne(this.DB, this.collection, { serviceId: id })
        })
    }
}

module.exports = new ServiceUpdates()