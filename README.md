# React + Vite

## 语音辅助

语音辅助由训练引擎的权威状态驱动，不使用独立计时器：

```tsx
const voice = useVoiceAssistant();
const engine = useKegelEngine({
  onVoiceEvent: voice.emit,
  countdownFrom: voice.settings.mode === 'countdown'
    ? voice.settings.countdownFrom
    : 0,
});
```

实现仅使用浏览器本地语音合成、Web Audio 提示音和可选振动；不申请麦克风权限，不录音或上传训练数据。浏览器语音合成无法稳定实现精确暂停，因此训练暂停时会停止当前语音，恢复时播报继续提示，而不会从句中恢复。

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
