import config from './config';

export default class TelegramAPI {
    initialize() {
        telegramApi.setConfig({
            app: {
                id: config.api_id,
                hash: config.api_hash,
                version: config.version
            },
            server: {
                test: [
                    {
                        id: config.test_dc_id, /* DC ID */
                        host: config.test_host,
                        port: config.test_port
                    }
                ],
                production: [
                    {
                        id: config.prod_dc_id, /* DC ID */
                        host: config.prod_host,
                        port: config.prod_port
                    }
                ]
            }
        });
    }
}