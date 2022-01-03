import {ChromeMenu} from "./chrome_menu";
import {GooglePhotos} from "./google-photos";

function getImage(imageUrl: string): Promise<Blob> {
    return fetch(imageUrl, {
        credentials: 'include',
        redirect: "follow",

    }).then((resp) => {
        if (resp.ok) return resp.blob();
        resp.text().then((err) => console.log('image get err body text', err));
        throw resp
    });
}

ChromeMenu.addListener(uploadImage);
function uploadImage(albumId: string, imageUrl: string): void {
    const fileName = imageUrl.slice(imageUrl.lastIndexOf("/") + 1);
    const description = imageUrl;

    getImage(imageUrl).then(image=>{
        ChromeMenu.getToken().then(token => GooglePhotos.uploadImage(token, albumId, image, fileName, description))
        .then(result => result ? console.log('upload done: ', imageUrl) : console.log("アップロードに失敗しました: " + imageUrl))
        .catch((err) => {
            console.log("err obj", err);
            console.log("アップロードに失敗しました");
        })
    })
}

chrome.runtime.onInstalled.addListener(async () => {
    const items = await ChromeMenu.getChromeMenu();
    console.log(items);
    await ChromeMenu.makeMenu(items);
});
