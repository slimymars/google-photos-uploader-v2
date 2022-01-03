import {ChromeMenu} from "./chrome_menu";
import {GooglePhotos} from "./google-photos";

// referrerを送らないと取れないサイト(pixiv)があり、うまくいかない
function uploadImageForNonTabId(albumId: string, imageUrl: string): void {
    const fileName = imageUrl.slice(imageUrl.lastIndexOf("/") + 1);
    const description = imageUrl;
    function getImage(imageUrl: string): Promise<Blob> {
        let options: RequestInit;
        options = {
            credentials: 'include',
            redirect: "follow",
        }
        console.log('options', options);
        return fetch(imageUrl, options).then((resp) => {
            if (resp.ok) return resp.blob();
            resp.text().then((err) => console.log('image get err body text', err));
            throw resp
        });
    }
    getImage(imageUrl).then(image=>{
        ChromeMenu.getToken().then(token => GooglePhotos.uploadImage(token, albumId, image, fileName, description))
        .then(result => result ? console.log('upload done: ', imageUrl) : console.log("アップロードに失敗しました: " + imageUrl))
        .catch((err) => {
            console.log("err obj", err);
            console.log("アップロードに失敗しました");
        })
    })
}

// corsできないサイト(pixiv)が多く、結局うまくいかない
function uploadImageForScripting(albumId: string, imageUrl: string, tabId: number) {
    async function getImageForScripting(imageUrl: string, extension_id: string) {
        let options: RequestInit;
        options = {
            redirect: "follow",
            mode: 'cors'
        }
        let resp: Response;
        try {
            resp = await fetch(imageUrl, options);
        } catch (e) {
            chrome.runtime.sendMessage(extension_id, 'image get err' + e, (resp)=>{
                console.log("send err. response", resp);
            });
            return
        }
        console.log("response", resp);
        if (!resp.ok) {
            const err = await resp.text();
            chrome.runtime.sendMessage(extension_id, 'image get err body text' + err, (resp)=>{
                console.log("send err", err);
                console.log("resp", resp);
            });
        } else {
            const b = await resp.blob();
            const reader = new FileReader();
            reader.addEventListener('loadend', ()=>{
                const data = {
                    data: reader.result,
                    type: b.type
                }
                chrome.runtime.sendMessage(extension_id, data, (resp)=>{
                    console.log("send blob", b);
                    console.log("resp", resp);
                });
            });
            reader.readAsDataURL(b);
        }
    }
    chrome.runtime.onMessage.addListener(
        (message:any, sender:chrome.runtime.MessageSender, sendResponse:()=>void) => {
            if (typeof message === 'string') {
                console.log("get error", message);
            } else if (typeof message !== 'object') {
                console.log("get non object", message);
            }
            const data: {data: string; type: string} = message;
            const byteString = atob(data.data.split(',')[1]);
            let content = new Uint8Array(byteString.length);
            for (let i=0; byteString.length > i; i++) {
                content[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([content], {type: data.type});
            const fileName = imageUrl.slice(imageUrl.lastIndexOf("/") + 1);
            const description = imageUrl;
            ChromeMenu.getToken().then(token => GooglePhotos.uploadImage(token, albumId, blob, fileName, description))
            .then(result => result ? console.log('upload done: ', imageUrl) : console.log("アップロードに失敗しました: " + imageUrl))
            .catch((err) => {
                console.log("err obj", err);
                console.log("アップロードに失敗しました");
            })
            sendResponse();
        }
    );
    chrome.scripting.executeScript(
        {
            target: {tabId: tabId},
            func: getImageForScripting,
            args: [imageUrl, chrome.runtime.id],
        }
    );
}

ChromeMenu.addListener(uploadImage);
function uploadImage(albumId: string, imageUrl: string, tabId?: number): void {
    if (tabId === undefined) {
        uploadImageForNonTabId(albumId, imageUrl);
    } else {
        uploadImageForScripting(albumId, imageUrl, tabId);
    }
}

chrome.runtime.onInstalled.addListener(async () => {
    const items = await ChromeMenu.getChromeMenu();
    console.log(items);
    await ChromeMenu.makeMenu(items);
});
