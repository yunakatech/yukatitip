import type { Database } from '$lib/supabase/database';

export const ROUTE_DAY_LABELS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

export const ROUTE_SERVICE_LABELS: Record<Database['public']['Enums']['service_type'], string> = {
	purchase: 'Titip beli',
	pickup: 'Titip ambil',
	delivery: 'Titip kirim'
};
