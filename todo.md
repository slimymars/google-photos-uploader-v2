# google-photos-uploader todo
## pixivの画像が取得できない
ブラウザから「新しい窓で画像を表示」してもNGなことがあるため
pixiv側でなんかやっていると思われる。

どうやらリファラーを送信すればOKっぽいが、
backgroud.jsからだとどうやってもリファラを送ってくれない。

## エラーの通知方法
アップロードエラーとなっても、console.logに出るだけで通知がない
popup.htmlあたりを実装し、そこにエラー表示をさせるのが望ましい


# branch
## master
メインの開発ブランチ

## getImageFromChromeScripting
pixivの問題を解消するためにScriptで取得する方向で改造をしていたもの。
結局CORSに阻まれてうまくいかない
```
Access to fetch at 'https://i.pximg.net/img-original/img/2021/12/29/00/02/22/95096647_p0.jpg' from origin 'https://www.pixiv.net' has been blocked by CORS policy: Cross origin requests are not allowed by request mode.
```
background.jsから実行すればCORS無効化できるのだが
pixivからは弾かれる‥‥
