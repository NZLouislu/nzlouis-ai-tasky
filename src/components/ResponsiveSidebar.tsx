"use client";
import { ReactNode } from 'react';
import { useResponsive } from '@/hooks/use-responsive';

interface ResponsiveSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

export default function ResponsiveSidebar({
    isOpen,
    onClose,
    children,
}: ResponsiveSidebarProps) {
    const { shouldShowSidebarOverlay, sidebarWidth, isMobile } = useResponsive();

    if (!isOpen && shouldShowSidebarOverlay) {
        return null;
    }

    return (
        <>
            {/* Overlay for mobile/tablet */}
            {shouldShowSidebarOverlay && isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`
          ${shouldShowSidebarOverlay ? 'fixed' : 'relative'}
          ${shouldShowSidebarOverlay ? 'z-50' : 'z-10'}
          ${isMobile ? 'inset-0' : 'top-0 left-0 h-screen'}
          bg-white border-r border-gray-200
          transition-transform duration-300 ease-in-out
          ${shouldShowSidebarOverlay && !isOpen ? '-translate-x-full' : 'translate-x-0'}
        `}
                style={{
                    width: shouldShowSidebarOverlay ? sidebarWidth : undefined,
                }}
            >
                {children}
            </div>
        </>
    );
}
