const debug = require('debug')(`app:ingresscontroller:traefik`)
const Docker = require('dockerode');
const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET_PATH });

class Traefik {
    constructor() {
    }
    async addLabels(serviceId, tag) {
        return new Promise(async (resolve, reject) => {
            try {
                const service = await docker.getService(serviceId)
                const spec = await service.inspect()
                const newSpec = spec.Spec
                newSpec.version = spec.Version.Index
                /** 
                traefik.enable: "true"
                traefik.http.services.linto-platform-stt-service-manager.loadbalancer.server.port: 80
                traefik.http.routers.linto-platform-stt-service-manager.entrypoints: "http"
                traefik.http.routers.linto-platform-stt-service-manager.middlewares: "linto-stt-service-manager-path@file"
                traefik.http.routers.linto-platform-stt-service-manager.rule: "Host(`${LINTO_STACK_DOMAIN}`) && PathPrefix(`/stt-manager`)"
                */

                //services & routers
                const enableLable = `traefik.enable`
                const portLable = `traefik.http.services.${serviceId}.loadbalancer.server.port`
                const entrypointLable = `traefik.http.routers.${serviceId}.entrypoints`
                const ruleLable = `traefik.http.routers.${serviceId}.rule`
                newSpec.Labels[enableLable] = 'true'
                newSpec.Labels[portLable] = process.env.LINSTT_PORT
                newSpec.Labels[entrypointLable] = 'http'
                newSpec.Labels[ruleLable] = `Host(\`${process.env.LINTO_STACK_DOMAIN}\`) && PathPrefix(\`${process.env.LINTO_STACK_LINSTT_PREFIX}/${serviceId}\`)`

                //stack params
                newSpec.Labels["com.docker.stack.image"] = `${process.env.LINSTT_IMAGE}:${tag}`
                newSpec.Labels["com.docker.stack.namespace"] = process.env.LINTO_STACK_NAME

                //middlewares
                const prefixLabel = `traefik.http.middlewares.stt-prefix.stripprefix.prefixes`
                const middlawreLabel = `traefik.http.routers.${serviceId}.middlewares`
                newSpec.Labels[prefixLabel] = `${process.env.LINTO_STACK_LINSTT_PREFIX}/${serviceId}`
                newSpec.Labels[middlawreLabel] = 'stt-prefix@docker'

                await service.update(newSpec)
                resolve()
            } catch (err) {
                debug(err)
                reject(err)
            }
        })
    }

}


module.exports = new Traefik()
