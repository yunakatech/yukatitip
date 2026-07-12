import { json, type RequestEvent } from '@sveltejs/kit';
import packageJson from '../../../../../package.json';

export function GET({ locals }: RequestEvent) {
	return json(
		{
			success: true,
			data: {
				status: 'ok',
				service: 'yukatitip',
				version: packageJson.version,
				timestamp: new Date().toISOString()
			},
			meta: {
				requestId: locals.requestId ?? crypto.randomUUID()
			}
		},
		{
			headers: {
				'cache-control': 'no-store'
			}
		}
	);
}
