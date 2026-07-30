# PWA Test Checklist

## iOS Safari

- [ ] Add to Home Screen
- [ ] Delete any previously installed Kagle Web Clip before reinstalling; confirm the icon uses the muscle graphic instead of the generated letter `K`
- [ ] Launch from home screen without Safari UI
- [ ] Verify `/kagle/` start path
- [ ] Verify safe-area layout on Dynamic Island / notch devices
- [ ] Drag vertically from the top and bottom edges; the whole app must not shift or reveal a white/transparent strip
- [ ] Verify the history view, plan drawer, voice drawer, and more menu still scroll independently
- [ ] Verify the bottom action dock clears the Home Indicator without adding extra page height
- [ ] Verify the primary navigation and the Home Indicator safe area form one continuous `#111827` surface without a contrasting strip
- [ ] Repeat the safe-area checks in portrait, landscape, and 200% text size
- [ ] Verify audio playback after user interaction
- [ ] Verify animation performance
- [ ] Verify pause/resume after backgrounding

## Android Chrome

- [ ] Install PWA
- [ ] Verify standalone mode
- [ ] Verify vibration feedback
- [ ] Verify speech playback

## Desktop

- [ ] Install application
- [ ] Verify offline app shell loading
- [ ] Verify service worker update behavior
