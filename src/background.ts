import {ChromeMenu} from "./chrome_menu";
import {GooglePhotos} from "./google-photos";

ChromeMenu.addListener(uploadImage);

async function getImage(imageUrl: string, extension_id: string, albumId: string): Promise<Blob> {
    let resp: Response;
    try {
        resp = await fetch(imageUrl, {
            redirect: 'follow',
            mode: 'same-origin',
        });
    } catch(e) {
        const status = "fetch error";
        const r = {imageUrl, albumId, status, undefined};
        chrome.runtime.sendMessage(extension_id, r);
        console.log("send_done");
        return new Blob();
    }
    if (!resp.ok) {
        const status = "get error";
        const r = {imageUrl, albumId, status, undefined};
        chrome.runtime.sendMessage(extension_id, r);
        console.log("send_done");
        return new Blob();
    }
    const b = await resp.blob();
    if (extension_id === "") {
        return b;
    }
    const status = "ok";
    const r = {imageUrl, albumId, status, b};
    chrome.runtime.sendMessage(extension_id, r);
    console.log("send_done");
    return b;
}

// getImageからblobを受けとり処理を行う
chrome.runtime.onMessage.addListener(
    (message: {imageUrl:string, albumId:string, status:string, data: Blob}, sender: chrome.runtime.MessageSender, sendResponse: ()=>void) => {
        console.log("get message", message);
        if (message.status !== "ok" || message.data === undefined) {
            console.log("画像ダウンロードに失敗しました");
            return
        }
        const b:Blob = message.data;
        ChromeMenu.getToken().then(token=>GooglePhotos.uploadImage(token, message.albumId, message.imageUrl, b))
        .then(result=> result ? console.log('upload done: ', message.imageUrl) : console.log("アップロードに失敗しました: " + message.imageUrl));
    }
);

async function uploadImage(albumId: string, imageUrl: string, tabId: number | undefined): Promise<void> {
    if (tabId === undefined) {
        const token = await ChromeMenu.getToken();
        const b = await getImage(imageUrl, "", albumId);
        console.log('image get fetch end.');
        const result = await GooglePhotos.uploadImage(token, albumId, imageUrl, b);
        result ? console.log('upload done: ', imageUrl) : console.log("アップロードに失敗しました: " + imageUrl);
        return
    } 
    const injectionResults = await chrome.scripting.executeScript( {
        target: {tabId: tabId},
        func: getImage,
        args: [imageUrl, chrome.runtime.id, albumId]
    });
}

chrome.runtime.onInstalled.addListener(async () => {
    const items = await ChromeMenu.getChromeMenu();
    console.log(items);
    await ChromeMenu.makeMenu(items);
});
