export const MOBILE_NAVIGATION_DIALOG_ID = 'mobile-navigation-drawer';
export const MOBILE_NAVIGATION_TOGGLE_ID = 'mobile-navigation-toggle';
export const MOBILE_NAVIGATION_TITLE_ID = 'mobile-navigation-title';
export const MOBILE_NAVIGATION_CLOSE_BUTTON_ID = 'mobile-navigation-close-button';

export interface MobileNavigationDialogLike {
	open: boolean;
	showModal: () => void;
	close: () => void;
}

export interface FocusableLike {
	focus: () => void;
}

export function openMobileNavigationDrawer(
	dialog: MobileNavigationDialogLike,
	focusTarget: FocusableLike | null | undefined
): void {
	if (!dialog.open) {
		dialog.showModal();
	}

	focusTarget?.focus();
}

export function closeMobileNavigationDrawer(
	dialog: MobileNavigationDialogLike,
	focusTarget: FocusableLike | null | undefined
): void {
	if (dialog.open) {
		dialog.close();
	}

	focusTarget?.focus();
}

export function isMobileNavigationBackdropClick(
	event: MouseEvent,
	dialog: HTMLDialogElement | null
): boolean {
	return dialog !== null && event.target === dialog;
}

export function cancelMobileNavigationDrawer(event: Event, onClose: () => void): void {
	event.preventDefault();
	onClose();
}
