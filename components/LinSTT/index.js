const Component = require(`../component.js`)
const debug = require('debug')(`app:linstt`)
const compressing = require('compressing');

const am = require(`${process.cwd()}/models/AMUpdates`)
const lm = require(`${process.cwd()}/models/LMUpdates`)
const service = require(`${process.cwd()}/models/ServiceUpdates`)

class LinSTT extends Component {
    constructor(app) {
        super(app)
        this.id = this.constructor.name
        this.app = app
        this.db = { am: am, lm: lm, service: service }
        switch (process.env.LINSTT_SYS) {
            case 'kaldi':
                this.stt = require(`./Kaldi`)
                break
            case '': this.stt = ''; break
            default: throw 'Undefined LinSTT system'
        }
        return this.init()
    }

    /**
     * Other functions used by Acoustic and Language Model events
     */
    async uncompressFile(type, src, dest) {
        return new Promise(async (resolve, rejection) => {
            try {
                switch (type) {
                    case 'application/zip': // .zip
                        await compressing.zip.uncompress(src, dest); break
                    case 'application/gzip': // .tar.gz
                        await compressing.tar.uncompress(src, dest); break
                    case 'application/x-gzip': // .tar.gz
                        await compressing.tgz.uncompress(src, dest); break
                    default:
                        rejection('Undefined file format. Please use one of the following format: zip or tar.gz')
                }
                resolve('uncompressed')
            } catch (err) {
                rejection(err)
            }
        })
    }

    async checkExists(payload, type, isTrue) {
        const res = await this.db.lm.findModel(payload.modelId)
        if (res === -1)
            throw `Language Model '${payload.modelId}' does not exist`
        if (isTrue) {
            return new Promise((resolve, rejection) => {
                res[type].forEach((obj, idx) => {
                    obj.idx = idx
                    if (obj.name === payload.name)
                        resolve(obj)
                })
                rejection(`${payload.name} does not exist`)
            })
        } else {
            return new Promise((resolve, rejection) => {
                res[type].forEach((obj) => {
                    if (obj.name === payload.name)
                        rejection(`${payload.name} already exists`)
                })
                resolve()
            })
        }
    }

}

module.exports = app => new LinSTT(app)