import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'laptop' | 'desktop';

export interface ResponsiveConfig {
    isMobile: boolean;
    isTablet: boolean;
    isLaptop: boolean;
    isDesktop: boolean;
    deviceType: DeviceType;
    sidebarWidth: number;
    chatbotWidth: number;
    shouldShowSidebarOverlay: boolean;
    shouldShowChatbotOverlay: boolean;
}

export function useResponsive(): ResponsiveConfig {
    const [config, setConfig] = useState<ResponsiveConfig>({
        isMobile: false,
        isTablet: false,
        isLaptop: false,
        isDesktop: true,
        deviceType: 'desktop',
        sidebarWidth: 256,
        chatbotWidth: 600,
        shouldShowSidebarOverlay: false,
        shouldShowChatbotOverlay: false,
    });

    useEffect(() => {
        const updateConfig = () => {
            const width = window.innerWidth;

            let deviceType: DeviceType;
            let sidebarWidth: number;
            let chatbotWidth: number;
            let shouldShowSidebarOverlay: boolean;
            let shouldShowChatbotOverlay: boolean;

            if (width < 768) {
                // Mobile (iPhone)
                deviceType = 'mobile';
                sidebarWidth = width; // 全屏
                chatbotWidth = width; // 全屏
                shouldShowSidebarOverlay = true;
                shouldShowChatbotOverlay = true;
            } else if (width < 1024) {
                // Tablet (iPad)
                deviceType = 'tablet';
                sidebarWidth = 280;
                chatbotWidth = Math.min(400, width * 0.4);
                shouldShowSidebarOverlay = true;
                shouldShowChatbotOverlay = false;
            } else if (width < 1280) {
                // Laptop
                deviceType = 'laptop';
                sidebarWidth = 200;
                chatbotWidth = Math.min(400, width * 0.3);
                shouldShowSidebarOverlay = false;
                shouldShowChatbotOverlay = false;
            } else {
                // Desktop (大屏幕)
                deviceType = 'desktop';
                sidebarWidth = 256;
                chatbotWidth = Math.min(600, width * 0.25);
                shouldShowSidebarOverlay = false;
                shouldShowChatbotOverlay = false;
            }

            setConfig({
                isMobile: deviceType === 'mobile',
                isTablet: deviceType === 'tablet',
                isLaptop: deviceType === 'laptop',
                isDesktop: deviceType === 'desktop',
                deviceType,
                sidebarWidth,
                chatbotWidth,
                shouldShowSidebarOverlay,
                shouldShowChatbotOverlay,
            });
        };

        updateConfig();
        window.addEventListener('resize', updateConfig);

        return () => {
            window.removeEventListener('resize', updateConfig);
        };
    }, []);

    return config;
}
