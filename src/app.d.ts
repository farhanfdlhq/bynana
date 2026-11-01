import type { AdminUser } from '$lib/server/auth';
import type { Theme } from '$lib/server/settings';

declare global {
	namespace App {
		interface Locals {
			user: AdminUser | null;
			theme: Theme;
		}
		interface Error {
			message: string;
			number?: number;
		}
	}
}

export {};
