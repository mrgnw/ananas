# Mobile Requirements for Translation App

## Overview
This document outlines the specific mobile UX requirements and implementation details for the translation application's mobile interface.

## Layout Requirements

### Desktop Layout (Top → Bottom Flow)
- **Input Position**: Fixed at top of page
- **Content Flow**: Natural top-to-bottom document flow
- **Translation Order**: Standard chronological order (oldest first)
- **Grid Structure**: `grid-template-rows: auto 1fr`
  - Row 1 (auto): Input section
  - Row 2 (1fr): Scrollable content

### Mobile Layout (Bottom ← Top Flow)
- **Input Position**: Fixed at bottom of screen for thumb accessibility
- **Content Flow**: Reversed for mobile UX optimization
- **Translation Order**: Newest translations appear first (closest to input)
- **Grid Structure**: `grid-template-rows: 1fr auto` with CSS `order` reordering
  - Row 1 (1fr): Scrollable content (order: 1)
  - Row 2 (auto): Input section (order: 2)

## Mobile-Specific Features

### Fixed Positioning & Layout
- **Viewport Lock**: Layout grid fixed to viewport (`position: fixed; top: 0; left: 0; right: 0; bottom: 0`)
- **No Overlap**: CSS Grid prevents input from covering content
- **Proper Scrolling**: Content section has `overflow-y: auto` within grid area

### Visual Connection
- **Input-to-Translation Link**: Decorative gradient line connecting newest translation to input
- **Seamless Flow**: No gaps between newest translation and input area
- **Visual Hierarchy**: Clear distinction between input and content areas

### UI Element Management
- **Hidden Elements**: "View All" button hidden on mobile to focus on recent translations
- **Debug Controls**: Debug buttons hidden on mobile (`display: none` at `max-width: 767px`)
- **Responsive Sizing**: Adjusted padding, margins, and font sizes for mobile

## Touch & Zoom Prevention

### Global Prevention (app.pcss)
```css
html, body {
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-text-size-adjust: 100%;
  -webkit-user-select: none;
  user-select: none;
  overscroll-behavior: contain;
}
```

### Component-Level Prevention
- **Layout Container**: Full touch restrictions on mobile grid
- **Input Section**: Prevents zoom and callouts
- **Translation Cards**: Prevents double-tap zoom on individual cards
- **Content Areas**: Scroll and overscroll prevention

### Smart Text Selection
- **Disabled**: On containers, UI elements, and interactive areas
- **Enabled**: Inside translation text content (`.translation-text`, `[contenteditable]`)
- **Input Fields**: Text selection allowed for user input

### Viewport Meta Tag
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, shrink-to-fit=no" />
```

## Animation System

### Flip Animations
- **Library**: Svelte's `animate:flip` for smooth position changes
- **Duration**: 400ms for position transitions
- **Trigger**: When new translations are added and existing items reorder

### Initial Load Animations
- **Staggered Entry**: Progressive item appearance with 120ms delays
- **Fade In**: 300-400ms fade duration
- **Smart Timing**: Different timing for initial load vs. new additions

### Animation State Management
- **Load Flag**: `hasLoadedInitialAnimations` to differentiate initial vs. ongoing animations
- **Keyed Items**: Translations keyed by `timestamp` for proper animation tracking

## Responsive Breakpoints

### Mobile
- **Range**: `max-width: 767px`
- **Layout**: Fixed grid with bottom input
- **Features**: All mobile-specific optimizations active

### Tablet/Desktop
- **Range**: `min-width: 768px`
- **Layout**: Natural document flow with top input
- **Features**: Standard desktop UX patterns

## Input Behavior

### Text Clearing
- **Auto-Clear**: Input text clears after successful translation
- **Implementation**: `text = '';` after `translationHistoryStore.addTranslation()`

### Touch Optimization
- **Thumb Zone**: Input positioned in natural thumb reach area
- **No Zoom**: Prevents accidental zoom when focusing input
- **Quick Access**: Always visible and accessible without scrolling

## Content Management

### Translation Flow
- **Mobile**: Reverse chronological (newest → oldest, top → bottom)
- **Desktop**: Chronological (oldest → newest, top → bottom)
- **Visual Logic**: Newest translation connects directly to input on mobile

### Scrolling Behavior
- **Mobile**: Content scrolls within fixed grid area
- **Contained**: `overscroll-behavior: contain` prevents page bounce
- **Smooth**: Native scroll performance maintained

## Implementation Status

### ✅ Completed Features
1. **Fixed Layout Grid**: CSS Grid-based responsive layout
2. **Input Positioning**: Bottom-fixed on mobile, top on desktop
3. **Zoom Prevention**: Comprehensive pinch/tap/scroll restrictions
4. **Flip Animations**: Smooth reordering when new translations added
5. **Input Clearing**: Text clears after successful translation
6. **Debug Controls**: Hidden on mobile to prevent overlap
7. **Visual Connection**: Gradient line connecting newest translation to input
8. **Touch Restrictions**: Granular control over touch interactions
9. **Staggered Load**: Progressive appearance of initial translations
10. **Responsive Flow**: Different ordering logic for mobile vs. desktop

### 🏗️ Architecture Decisions
- **CSS Grid over Fixed Positioning**: Cleaner, more maintainable layout
- **Order Property**: Elegant reordering without DOM manipulation
- **Component-Level Touch Control**: Granular zoom prevention
- **Smart Text Selection**: Preserve usability while preventing accidents
- **Animation State Management**: Efficient handling of different animation contexts

## File Locations

### Primary Implementation
- `/src/routes/+page.svelte` - Main home page with mobile layout
- `/src/app.pcss` - Global mobile touch prevention CSS
- `/src/app.html` - Viewport meta tag configuration

### Supporting Components
- `/src/jibs/TranslationInput.svelte` - Input component with clearing logic
- `/src/routes/+layout.svelte` - Debug controls positioning
- `/src/lib/stores/translationHistory.svelte.js` - State management

### Related Pages
- `/src/routes/review/+page.svelte` - Review page (similar mobile optimizations)

## Testing Considerations

### Mobile Testing
- **Touch Behavior**: Verify no accidental zoom/scroll
- **Input Accessibility**: Thumb reach and keyboard behavior
- **Animation Performance**: Smooth 60fps animations
- **Layout Stability**: No content jumping or overlap

### Cross-Device Testing
- **Responsive Breakpoints**: Clean transitions between mobile/desktop
- **Viewport Variations**: Different mobile screen sizes
- **Orientation Changes**: Portrait/landscape handling
- **Browser Differences**: iOS Safari vs. Android Chrome behavior

## Future Enhancements

### Potential Improvements
- **Haptic Feedback**: Subtle vibration on successful translation
- **Gesture Support**: Swipe gestures for translation management
- **Progressive Enhancement**: Graceful degradation for older devices
- **Performance Optimization**: Further animation and scroll optimizations

### Accessibility
- **Screen Reader**: Proper ARIA labels for mobile layout changes
- **High Contrast**: Ensure visual indicators work in high contrast mode
- **Reduced Motion**: Respect user's motion preferences
- **Focus Management**: Proper focus handling in fixed layout
