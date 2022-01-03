# google-photos-uploader todo
## pixivの画像が取得できない
ブラウザから「新しい窓で画像を表示」してもNGなことがあるため
pixiv側でなんかやっていると思われる。

## エラーの通知方法
アップロードエラーとなっても、console.logに出るだけで通知がない
popup.htmlあたりを実装し、そこにエラー表示をさせるのが望ましい


# branch
## master
メインの開発ブランチ

## getImageFromChromeScripting
pixivの問題を解消するためにScriptで取得する方向で改造をしていたもの。
getImage側でblobを取得するところまでは行けた気がするが‥‥
