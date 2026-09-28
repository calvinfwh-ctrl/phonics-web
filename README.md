# PhonicsTeacher

3–8 岁儿童英语自然拼读 Web App。学习记录在手机浏览器里，不依赖家里的局域网。

## 在中国大陆打开（不要用 GitHub）

`github.com` 和 `github.io` 在中国大陆打不开，而且这个仓库是私有的，GitHub Pages 部署会 404。

请用国内 CDN 镜像打开（页面文件在 `web` 分支，不经过 GitHub 网页）：

**https://cdn.jsdmirror.com/gh/calvinfwh-ctrl/phonics-web@web/index.html**

打不开时换下面两个备用地址（内容相同）：

- https://jsd.onmicrosoft.cn/gh/calvinfwh-ctrl/phonics-web@web/index.html
- https://cdn.jsdmirror.cn/gh/calvinfwh-ctrl/phonics-web@web/index.html

这些镜像只能读取**公开**仓库。请到 GitHub 仓库 Settings → General → Danger Zone → Change repository visibility，把仓库改成 **Public**。仓库里没有密钥，只是拼读页面和语音文件。

改成公开后，首次打开可能要等一两分钟。用手机 Chrome / Edge / Safari 打开，点一下页面后再听发音。

## 本地 / 局域网

```bash
npm install
npm run dev
```

开发服务器监听 `0.0.0.0:3000`，同一 Wi-Fi 下可用电脑 IP 访问。

## 语音

英语单词和字母音使用 Microsoft 神经语音（Aria）预生成，中文讲解用晓晓。重新生成：

```bash
pip install edge-tts
npm run audio
```
