import { describe, expect, it, vi } from 'vitest';

import {
	cancelMobileNavigationDrawer,
	closeMobileNavigationDrawer,
	isMobileNavigationBackdropClick,
	openMobileNavigationDrawer
} from './mobile-navigation';

describe('mobile navigation drawer helpers', () => {
	function createMouseEvent(target: EventTarget | null): MouseEvent {
		return { target } as unknown as MouseEvent;
	}

	function createEvent(): Event & { preventDefault: ReturnType<typeof vi.fn> } {
		const preventDefault = vi.fn();
		return { preventDefault } as unknown as Event & { preventDefault: ReturnType<typeof vi.fn> };
	}

	it('opens the drawer and focuses the close control', () => {
		const showModal = vi.fn();
		const close = vi.fn();
		const focus = vi.fn();

		openMobileNavigationDrawer(
			{
				open: false,
				showModal,
				close
			},
			{
				focus
			}
		);

		expect(showModal).toHaveBeenCalledTimes(1);
		expect(close).not.toHaveBeenCalled();
		expect(focus).toHaveBeenCalledTimes(1);
	});

	it('closes the drawer and restores focus to the trigger', () => {
		const showModal = vi.fn();
		const close = vi.fn();
		const focus = vi.fn();

		closeMobileNavigationDrawer(
			{
				open: true,
				showModal,
				close
			},
			{
				focus
			}
		);

		expect(close).toHaveBeenCalledTimes(1);
		expect(showModal).not.toHaveBeenCalled();
		expect(focus).toHaveBeenCalledTimes(1);
	});

	it('detects backdrop clicks only on the dialog element', () => {
		const dialog = {} as HTMLDialogElement;
		expect(isMobileNavigationBackdropClick(createMouseEvent(dialog), dialog)).toBe(true);
		expect(isMobileNavigationBackdropClick(createMouseEvent({} as EventTarget), dialog)).toBe(false);
		expect(isMobileNavigationBackdropClick(createMouseEvent(dialog), null)).toBe(false);
	});

	it('cancels the native dialog close and delegates to the parent', () => {
		const onClose = vi.fn();
		const event = createEvent();

		cancelMobileNavigationDrawer(event, onClose);

		expect(event.preventDefault).toHaveBeenCalledTimes(1);
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
