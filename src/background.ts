import {ChromeMenu} from "./chrome_menu";
import {GooglePhotos} from "./google-photos";

function uploadImage(albumId: string, imageUrl: string): void {
    ChromeMenu.getToken().then(token => GooglePhotos.uploadImage(token, albumId, imageUrl))
        .then(result => result ? console.log('upload done: ', imageUrl) : alert("アップロードに失敗しました: " + imageUrl))
        .catch((err) => {
            console.log("err obj", err);
            alert("アップロードに失敗しました");
        })
}

chrome.runtime.onInstalled.addListener(() => {
    ChromeMenu.getChromeMenu().then((items) => {
        console.log(items);
        return ChromeMenu.makeMenu(items)
    }).then(() => {
        ChromeMenu.addListener(uploadImage)
    })
});
