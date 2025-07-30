import { theme } from 'antd';

/**
 * Enhanced Ant Design Theme Configuration for 3D Hand Pose Game
 * Dark gaming theme with green accents, glass morphism effects, and gaming-specific components
 */

export const antdTheme = {
  token: {
    // Primary colors - matching the existing green theme
    colorPrimary: '#22c55e', // green-500
    colorPrimaryHover: '#16a34a', // green-600
    colorPrimaryActive: '#15803d', // green-700
    colorPrimaryBg: 'rgba(34, 197, 94, 0.1)', // green with opacity
    colorPrimaryBgHover: 'rgba(34, 197, 94, 0.2)',
    colorPrimaryBorder: '#22c55e',
    colorPrimaryBorderHover: '#16a34a',
    
    // Success colors (keep green theme consistent)
    colorSuccess: '#22c55e',
    colorSuccessHover: '#16a34a',
    colorSuccessActive: '#15803d',
    colorSuccessBg: 'rgba(34, 197, 94, 0.1)',
    colorSuccessBgHover: 'rgba(34, 197, 94, 0.2)',
    colorSuccessBorder: '#22c55e',
    
    // Warning colors
    colorWarning: '#eab308', // yellow-500
    colorWarningHover: '#ca8a04', // yellow-600
    colorWarningActive: '#a16207', // yellow-700
    colorWarningBg: 'rgba(234, 179, 8, 0.1)',
    colorWarningBgHover: 'rgba(234, 179, 8, 0.2)',
    colorWarningBorder: '#eab308',
    
    // Error colors
    colorError: '#ef4444', // red-500
    colorErrorHover: '#dc2626', // red-600
    colorErrorActive: '#b91c1c', // red-700
    colorErrorBg: 'rgba(239, 68, 68, 0.1)',
    colorErrorBgHover: 'rgba(239, 68, 68, 0.2)',
    colorErrorBorder: '#ef4444',
    
    // Info colors
    colorInfo: '#3b82f6', // blue-500
    colorInfoHover: '#2563eb', // blue-600
    colorInfoActive: '#1d4ed8', // blue-700
    colorInfoBg: 'rgba(59, 130, 246, 0.1)',
    colorInfoBgHover: 'rgba(59, 130, 246, 0.2)',
    colorInfoBorder: '#3b82f6',
    
    // Background colors - dark theme
    colorBgBase: '#000000', // black background
    colorBgContainer: 'rgba(255, 255, 255, 0.05)', // glass effect
    colorBgElevated: 'rgba(255, 255, 255, 0.08)', // elevated surfaces
    colorBgLayout: '#000000',
    colorBgSpotlight: 'rgba(255, 255, 255, 0.1)',
    colorBgMask: 'rgba(0, 0, 0, 0.45)',
    
    // Text colors
    colorText: '#ffffff', // white text
    colorTextSecondary: '#d1d5db', // gray-300
    colorTextTertiary: '#9ca3af', // gray-400
    colorTextQuaternary: '#6b7280', // gray-500
    colorTextDescription: '#9ca3af',
    colorTextDisabled: '#6b7280',
    colorTextHeading: '#ffffff',
    colorTextLabel: '#d1d5db',
    colorTextPlaceholder: '#6b7280',
    
    // Border colors
    colorBorder: 'rgba(255, 255, 255, 0.1)', // subtle white border
    colorBorderSecondary: 'rgba(255, 255, 255, 0.05)',
    colorBorderBg: 'rgba(255, 255, 255, 0.08)',
    
    // Fill colors
    colorFill: 'rgba(255, 255, 255, 0.05)',
    colorFillSecondary: 'rgba(255, 255, 255, 0.03)',
    colorFillTertiary: 'rgba(255, 255, 255, 0.02)',
    colorFillQuaternary: 'rgba(255, 255, 255, 0.01)',
    
    // Typography
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontSizeXL: 20,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    fontWeightStrong: 600,
    
    // Layout
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,
    
    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    paddingXXS: 4,
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,
    marginXXS: 4,
    
    // Control heights
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
    controlHeightXS: 16,
    
    // Line heights
    lineHeight: 1.5714285714285714,
    lineHeightLG: 1.5,
    lineHeightSM: 1.66,
    
    // Motion
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
    motionEaseInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    motionEaseOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    motionEaseIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    
    // Box shadow
    boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    boxShadowTertiary: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    
    // Z-index
    zIndexBase: 0,
    zIndexPopupBase: 1000,
  },
  
  // Component-specific overrides
  components: {
    // Button component
    Button: {
      colorPrimary: '#22c55e',
      colorPrimaryHover: '#16a34a',
      colorPrimaryActive: '#15803d',
      primaryShadow: '0 2px 0 rgba(34, 197, 94, 0.1)',
      defaultShadow: '0 2px 0 rgba(255, 255, 255, 0.02)',
      dangerShadow: '0 2px 0 rgba(239, 68, 68, 0.1)',
      borderRadius: 8,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
    },
    
    // Card component
    Card: {
      colorBgContainer: 'rgba(255, 255, 255, 0.05)',
      colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',
      borderRadiusLG: 12,
      boxShadowTertiary: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    
    // Modal component
    Modal: {
      colorBgElevated: 'rgba(0, 0, 0, 0.9)',
      colorBgMask: 'rgba(0, 0, 0, 0.45)',
      borderRadiusLG: 12,
    },
    
    // Drawer component
    Drawer: {
      colorBgElevated: 'rgba(0, 0, 0, 0.95)',
      colorBgMask: 'rgba(0, 0, 0, 0.45)',
    },
    
    // Tooltip component
    Tooltip: {
      colorBgSpotlight: 'rgba(0, 0, 0, 0.85)',
      borderRadius: 6,
    },
    
    // Input component
    Input: {
      colorBgContainer: 'rgba(255, 255, 255, 0.05)',
      colorBorder: 'rgba(255, 255, 255, 0.1)',
      colorBorderHover: '#22c55e',
      colorBgContainerDisabled: 'rgba(255, 255, 255, 0.02)',
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
    },
    
    // Select component
    Select: {
      colorBgContainer: 'rgba(255, 255, 255, 0.05)',
      colorBgElevated: 'rgba(0, 0, 0, 0.9)',
      colorBorder: 'rgba(255, 255, 255, 0.1)',
      colorBorderHover: '#22c55e',
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
    },
    
    // Switch component
    Switch: {
      colorPrimary: '#22c55e',
      colorPrimaryHover: '#16a34a',
      colorTextQuaternary: '#6b7280',
      colorTextTertiary: '#9ca3af',
    },
    
    // Progress component
    Progress: {
      colorSuccess: '#22c55e',
      colorInfo: '#3b82f6',
      colorWarning: '#eab308',
      colorError: '#ef4444',
    },
    
    // Notification component
    Notification: {
      colorBgElevated: 'rgba(0, 0, 0, 0.9)',
      borderRadiusLG: 8,
      boxShadowSecondary: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    },
    
    // Message component
    Message: {
      colorBgElevated: 'rgba(0, 0, 0, 0.9)',
      borderRadius: 8,
    },

    // Gaming-specific components

    // Badge component for gaming indicators
    Badge: {
      colorBgContainer: 'rgba(34, 197, 94, 0.9)',
      colorText: '#ffffff',
      borderRadiusSM: 4,
    },

    // Timeline component for objectives
    Timeline: {
      colorPrimary: '#22c55e',
      colorText: '#ffffff',
      colorTextDescription: '#9ca3af',
    },

    // Steps component for calibration
    Steps: {
      colorPrimary: '#22c55e',
      colorText: '#ffffff',
      colorTextDescription: '#9ca3af',
      colorFillContent: 'rgba(255, 255, 255, 0.05)',
    },

    // Slider component for audio controls
    Slider: {
      colorPrimary: '#22c55e',
      colorPrimaryBorder: '#22c55e',
      colorPrimaryBorderHover: '#16a34a',
      handleColor: '#22c55e',
      handleColorHover: '#16a34a',
      trackBg: 'rgba(255, 255, 255, 0.1)',
      trackHoverBg: 'rgba(255, 255, 255, 0.15)',
      railBg: 'rgba(255, 255, 255, 0.05)',
      railHoverBg: 'rgba(255, 255, 255, 0.08)',
    },

    // List component for objects/objectives
    List: {
      colorBgContainer: 'rgba(255, 255, 255, 0.02)',
      colorBorder: 'rgba(255, 255, 255, 0.05)',
      colorText: '#ffffff',
      colorTextDescription: '#9ca3af',
    },

    // Divider component
    Divider: {
      colorSplit: 'rgba(255, 255, 255, 0.1)',
      colorText: '#9ca3af',
    },

    // Tag component for features/gestures
    Tag: {
      colorBgContainer: 'rgba(255, 255, 255, 0.08)',
      colorBorder: 'rgba(255, 255, 255, 0.1)',
      colorText: '#ffffff',
      borderRadiusSM: 4,
    },

    // Alert component for error boundaries
    Alert: {
      colorErrorBg: 'rgba(239, 68, 68, 0.1)',
      colorWarningBg: 'rgba(234, 179, 8, 0.1)',
      colorInfoBg: 'rgba(59, 130, 246, 0.1)',
      colorSuccessBg: 'rgba(34, 197, 94, 0.1)',
      borderRadiusLG: 8,
    },

    // Spin component for loading states
    Spin: {
      colorPrimary: '#22c55e',
      colorWhite: '#ffffff',
    },

    // Skeleton component for loading placeholders
    Skeleton: {
      colorFill: 'rgba(255, 255, 255, 0.05)',
      colorFillContent: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 6,
    },

    // Gaming-specific components

    // Badge component for gaming indicators
    Badge: {
      colorBgContainer: 'rgba(34, 197, 94, 0.9)',
      colorText: '#ffffff',
      borderRadiusSM: 4,
    },

    // Timeline component for objectives
    Timeline: {
      colorPrimary: '#22c55e',
      colorText: '#ffffff',
      colorTextDescription: '#9ca3af',
    },

    // Steps component for calibration
    Steps: {
      colorPrimary: '#22c55e',
      colorText: '#ffffff',
      colorTextDescription: '#9ca3af',
      colorFillContent: 'rgba(255, 255, 255, 0.05)',
    },

    // Slider component for audio controls
    Slider: {
      colorPrimary: '#22c55e',
      colorPrimaryBorder: '#22c55e',
      colorPrimaryBorderHover: '#16a34a',
      handleColor: '#22c55e',
      handleColorHover: '#16a34a',
      trackBg: 'rgba(255, 255, 255, 0.1)',
      trackHoverBg: 'rgba(255, 255, 255, 0.15)',
      railBg: 'rgba(255, 255, 255, 0.05)',
      railHoverBg: 'rgba(255, 255, 255, 0.08)',
    },

    // List component for objects/objectives
    List: {
      colorBgContainer: 'rgba(255, 255, 255, 0.02)',
      colorBorder: 'rgba(255, 255, 255, 0.05)',
      colorText: '#ffffff',
      colorTextDescription: '#9ca3af',
    },

    // Divider component
    Divider: {
      colorSplit: 'rgba(255, 255, 255, 0.1)',
      colorText: '#9ca3af',
    },

    // Tag component for features/gestures
    Tag: {
      colorBgContainer: 'rgba(255, 255, 255, 0.08)',
      colorBorder: 'rgba(255, 255, 255, 0.1)',
      colorText: '#ffffff',
      borderRadiusSM: 4,
    },

    // Alert component for error boundaries
    Alert: {
      colorErrorBg: 'rgba(239, 68, 68, 0.1)',
      colorWarningBg: 'rgba(234, 179, 8, 0.1)',
      colorInfoBg: 'rgba(59, 130, 246, 0.1)',
      colorSuccessBg: 'rgba(34, 197, 94, 0.1)',
      borderRadiusLG: 8,
    },

    // Spin component for loading states
    Spin: {
      colorPrimary: '#22c55e',
      colorWhite: '#ffffff',
    },

    // Drawer component for mobile UI
    Drawer: {
      colorBgElevated: 'rgba(0, 0, 0, 0.95)',
      colorBgMask: 'rgba(0, 0, 0, 0.6)',
      borderRadiusLG: 12,
    },

    // Statistic component for performance metrics
    Statistic: {
      colorText: '#ffffff',
      colorTextDescription: '#9ca3af',
      fontSizeHeading1: 24,
      fontSizeHeading2: 20,
      fontSizeHeading3: 16,
    },
  },

  // Algorithm for generating theme
  algorithm: theme.darkAlgorithm, // Use Ant Design's built-in dark algorithm
};

export default antdTheme;
