const debug = require('debug')('app:model:AMupdate')
const query = require(`./mongoDB`)


class AMUpdates {
    constructor() {
        this.am = 'AcModels'
        this.config = 'ymlConfig'
        this.worker = 'workerInstances'
        query.showUpdate = false
    }


}
