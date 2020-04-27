const debug = require('debug')(`app:clustermanager:dockerswarm`)
const Docker = require('dockerode');
const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET_PATH });
const sleep = require('util').promisify(setTimeout)

class DockerSwarm {
    constructor() {
        this.checkSwarm()
    }

    serviceOption(params) {
        return {
            "Name": params.serviceId,
            "TaskTemplate": {
                "ContainerSpec": {
                    "Image": `${process.env.LINSTT_IMAGE}:${params.tag}`,
                    "Env": [
                        `SERVICE_PORT=${process.env.LINSTT_PORT}`
                    ],
                    "Mounts": [
                        {
                            "ReadOnly": true,
                            "Source": `${process.env.FILESYSTEM}/${process.env.LM_FOLDER_NAME}/${params.LModelId}`,
                            "Target": "/opt/models/LM",
                            "Type": "bind"
                        },
                        {
                            "ReadOnly": true,
                            "Source": `${process.env.FILESYSTEM}/${process.env.AM_FOLDER_NAME}/${params.AModelId}`,
                            "Target": "/opt/models/AM",
                            "Type": "bind"
                        }
                    ],
                    "DNSConfig": {}
                },
                "Networks": [
                    {
                        "Target": process.env.LINSTT_NETWORK
                    }
                ]
            },
            "Mode": {
                "Replicated": {
                    "Replicas": params.replicas
                }
            },
            "EndpointSpec": {
                "mode": "dnsrr"
            }
        }
    }

    checkSwarm() {
        docker.swarmInspect(function (err) {
            if (err) throw err
        })
    }

    async checkServiceOn(params) { //check if service is correctly started
        try {
            const time = 0.5 //in seconds
            let retries = process.env.CHECK_SERVICE_TIMEOUT / time
            let status = {}

            while (retries > 0) {
                await sleep(time * 1000)
                const service = await docker.listContainers({
                    "filters": { "label": [`com.docker.swarm.service.name=${params.serviceId}`] }
                })
                if (service.length == 0)
                    retries = retries - 1
                debug(service.length, params.replicas)
                if (service.length == params.replicas) {
                    status = 1
                    break
                } else if (retries === 0) {
                    status = 0
                    break
                }
            }
            return status
        } catch (err) {
            debug(err)
            return 0
        }
    }

    async checkServiceOff(serviceId) { //check if service is correctly stopped
        try {
            const time = 0.5 //in seconds
            while (true) {
                await sleep(time * 1000)
                const service = await docker.listContainers({
                    "filters": { "label": [`com.docker.swarm.service.name=${serviceId}`] }
                })
                debug(service.length)
                if (service.length === 0) break
            }
            return 1
        } catch (err) {
            debug(err)
            return -1
        }
    }

    async listDockerServices() {
        return new Promise((resolve, reject) => {
            try {
                docker.listServices(function (err, services) {
                    if (err) reject(err)
                    resolve(services)
                })
            } catch (err) {
                reject(err)
            }
        })
    }

    startService(params) {
        return new Promise((resolve, reject) => {
            try {
                const options = this.serviceOption(params)
                docker.createService(options, function (err) {
                    if (err) reject(err)
                    resolve()
                })
            } catch (err) {
                reject(err)
            }
        })
    }

    async scaleService(params) {
        return new Promise(async (resolve, reject) => {
            try {
                const service = await docker.getService(params.serviceId)
                const spec = await service.inspect()
                const newSpec = spec.Spec
                newSpec.version = spec.Version.Index
                newSpec.Mode.Replicated.Replicas = params.replicas
                await service.update(newSpec)
                resolve()
            } catch (err) {
                debug(err)
                reject(err)
            }
        })
    }


    reloadService() {
    }

    async stopService(serviceId) {
        return new Promise(async (resolve, reject) => {
            try {
                const service = await docker.getService(serviceId)
                await service.remove()
                resolve()
            } catch (err) {
                reject(err)
            }
        })
    }

    getServiceInfo(serviceId) {
        return docker.getService(serviceId)
    }

    async serviceIsOn(serviceId) {
        try {
            const info = await docker.listContainers({
                "filters": { "label": [`com.docker.swarm.service.name=${serviceId}`] }
            })
            return info.length
        } catch (err) {
            debug(err)
            return 0
        }
    }

}

module.exports = new DockerSwarm()