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

                //Service Prefix
                const prefix= `/${process.env.LINTO_STACK_LINSTT_PREFIX}/${serviceId}`

                //services & routers
                const enableLable = `traefik.enable`
                const portLable = `traefik.http.services.${serviceId}.loadbalancer.server.port`
                const entrypointLable = `traefik.http.routers.${serviceId}.entrypoints`
                const ruleLable = `traefik.http.routers.${serviceId}.rule`
                newSpec.Labels[enableLable] = 'true'
                newSpec.Labels[portLable] = process.env.LINSTT_PORT
                newSpec.Labels[entrypointLable] = 'http'
                newSpec.Labels[ruleLable] = `Host(\`${process.env.LINTO_STACK_DOMAIN}\`) && PathPrefix(\`${prefix}\`)`

                //stack params
                newSpec.Labels["com.docker.stack.image"] = `${process.env.LINSTT_IMAGE}:${tag}`
                newSpec.Labels["com.docker.stack.namespace"] = process.env.LINTO_STACK_NAME

                //middlewares
                const prefixLabel = `traefik.http.middlewares.stt-prefix.stripprefix.prefixes`
                const middlawreLabel = `traefik.http.routers.${serviceId}.middlewares`
                newSpec.Labels[prefixLabel] = prefix
                newSpec.Labels[middlawreLabel] = 'stt-prefix@docker'

                //ssl
                const secureentrypoints = `traefik.http.routers.${serviceId}-secure.entrypoints`
                const securetls = `traefik.http.routers.${serviceId}-secure.tls`
                const securemiddleware = `traefik.http.routers.${serviceId}-secure.middlewares`
                const securerule = `traefik.http.routers.${serviceId}-secure.rule`

                if (process.env.LINTO_STACK_USE_SSL != undefined && process.env.LINTO_STACK_USE_SSL == 'true') {
                    newSpec.Labels[secureentrypoints] = "https"
                    newSpec.Labels[securetls] = "true"
                    newSpec.Labels[securemiddleware] = "stt-prefix@docker"
                    newSpec.Labels[securerule] = `Host(\`${process.env.LINTO_STACK_DOMAIN}\`) && PathPrefix(\`${prefix}\`)`
                    newSpec.Labels[middlawreLabel] = "ssl-redirect@file, stt-prefix@docker"
                }

                //basicAuth
                if (process.env.LINTO_STACK_HTTP_USE_AUTH != undefined && process.env.LINTO_STACK_HTTP_USE_AUTH == 'true') {
                    if (process.env.LINTO_STACK_USE_SSL != undefined && process.env.LINTO_STACK_USE_SSL == 'true')
                        newSpec.Labels[securemiddleware] = 'basic-auth@file, stt-prefix@docker'
                    else
                        newSpec.Labels[middlawreLabel] = "basic-auth@file, stt-prefix@docker"
                }

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
