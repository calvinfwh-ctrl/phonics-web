# PhonicsTeacher

3–8 岁儿童英语自然拼读 Web App。数据存在浏览器 IndexedDB 里，打开网站即可用，不依赖家里的局域网。

## 远程使用（非局域网）

合并到 `main` 并开启 GitHub Pages 后，用手机流量或任何网络打开：

**https://calvinfwh-ctrl.github.io/phonics-web/**

第一次请用 Chrome / Edge / Safari 打开（需要 HTTPS，语音才能稳定播放）。浏览器可能会提示“添加到主屏幕”，之后就能当 App 用。

仓库设置：Settings → Pages → Source 选 **GitHub Actions**。

## 本地 / 局域网

```bash
npm install
npm run dev
```

开发服务器会监听 `0.0.0.0:3000`，同一 Wi-Fi 下可用电脑 IP 访问。要给公网用，请走上面的 GitHub Pages，不要做端口映射。

```bash
npm run build
npm start
```

## 语音

英语单词和字母音使用 Microsoft 神经语音（Aria）预生成，中文讲解用晓晓；在没有预生成音频时回退到系统语音，并按中/英分段选声。

重新生成音频（需要 Python 包 `edge-tts`）：

```bash
pip install edge-tts
npm run audio
```
