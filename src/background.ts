import {ChromeMenu} from "./chrome_menu";
import {GooglePhotos} from "./google-photos";

ChromeMenu.addListener(uploadImage);
function uploadImage(albumId: string, imageUrl: string): void {
    ChromeMenu.getToken().then(token => GooglePhotos.uploadImage(token, albumId, imageUrl))
        .then(result => result ? console.log('upload done: ', imageUrl) : alert("アップロードに失敗しました: " + imageUrl))
        .catch((err) => {
            console.log("err obj", err);
            alert("アップロードに失敗しました");
        })
}

chrome.runtime.onInstalled.addListener(async () => {
    const items = await ChromeMenu.getChromeMenu();
    console.log(items);
    await ChromeMenu.makeMenu(items);
});
