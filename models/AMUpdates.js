const debug = require('debug')('app:model:AMupdate')
const datetime = require('node-datetime')
const query = require(`${process.cwd()}/models/MongoDB`)

class AMUpdates {
    constructor() {
        this.DB = process.env.MONGODB_DBNAME_SMANAGER
        this.collection = 'AcModels'
    }

    //create a new instance
    async createModel(modelName, lang = "", desc = "") {
        let newModel = {
            modelId: modelName,
            lang: lang,
            desc: desc,
            date: datetime.create().format('m/d/Y-H:M:S')
        }
        return await query.findOne(this.DB, this.collection, { modelId: modelName }).then(async (model) => {
            if (model === null) return await query.insertOne(this.DB, this.collection, newModel)
            return -1
        })
    }

    // delete acoustic model by name
    async deleteModel(modelName) {
        return await query.findOne(this.DB, this.collection, { modelId: modelName }).then(async (model) => {
            if (model === null)
                return -1
            return await query.deleteOne(this.DB, this.collection, { modelId: modelName })
        })
    }

    // find acoustic model by name
    async findModel(modelName) {
        return await query.findOne(this.DB, this.collection, { modelId : modelName }).then(async (model) => {
            if (model === null)
                return -1
            return model
        })
    }

    // find all acoustic models
    async findModels(request={}) {
        return await query.findMany(this.DB, this.collection, request).then(async (models) => {
            if (models.length === 0)
                return -1
            return models
        })
    }

}

module.exports = new AMUpdates()