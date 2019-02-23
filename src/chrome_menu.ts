import Oauth2 from './oauth';

export class ChromeMenu {
    static readonly ID_HEADER = 'google-photos-uploader-';
    static readonly ROOT_ITEM_ID = ChromeMenu.ID_HEADER + 'root';
    static readonly ROOT_NAME = 'Google Photosにアップロードするやつ';

    static removeMenu(): Promise<void> {
        return new Promise<void>((resolve => {
            chrome.contextMenus.removeAll(resolve)
        }))
    }

    static makeMenu(data: { id: string; title: string; }[]): Promise<void> {
        return this.removeMenu().then(() => {
            return new Promise<void>((resolve => {
                chrome.contextMenus.create({
                    id: this.ROOT_ITEM_ID,
                    title: this.ROOT_NAME,
                    contexts: ["image"]
                }, resolve)
            }))
        }).then(() => {
            let pl: Promise<void>[] = [];
            data.forEach((d) => {
                pl.push(new Promise<void>((resolve => {
                    chrome.contextMenus.create({
                        id: this.ID_HEADER + d.id,
                        title: d.title,
                        contexts: ["image"],
                        parentId: this.ROOT_ITEM_ID
                    }, resolve)
                })))
            });
            return Promise.all(pl);
        }).then((() => {
        }))
    }

    static isMyMenu(menuId: string): boolean {
        return menuId.indexOf(this.ID_HEADER) === 0
    }

    static menuIdToAlbumId(menuId: string): string {
        if (this.isMyMenu(menuId) === false) {
            throw "not menu id"
        }
        return menuId.slice(this.ID_HEADER.length)
    }

    static localStorageGet(key: string): Promise<any> {
        return new Promise<any>(resolve => chrome.storage.local.get(key, resolve))
            .then(obj => obj[key])
    }

    static getChromeMenu(): Promise<MenuItem[]> {
        return this.localStorageGet('menuItem')
            .then(obj => obj === undefined ? [] : <MenuItem[]>obj)
    }

    static saveAuthInfo(authInfo: any): Promise<typeof authInfo> {
        return new Promise<typeof authInfo>(resolve => {
            chrome.storage.local.set({'authInfo': authInfo}, () => resolve(authInfo))
        })
    }

    static authClear(): Promise<void> {
        return new Promise<void>(resolve => chrome.storage.local.remove('authInfo', resolve))
    }

    static getToken(): Promise<string> {
        return this.localStorageGet('authInfo')
            .then(obj => Oauth2.getAccessToken(obj, ChromeMenu.saveAuthInfo));
    }

    static addListener(resolv: (albumId: string, imageUrl: string) => void) {
        chrome.contextMenus.onClicked.addListener((info) => {
            console.log(info);
            if (this.isMyMenu(info.menuItemId) === false) return;
            if (info.srcUrl === undefined) return;
            const imageUrl = info.srcUrl;
            const albumId = this.menuIdToAlbumId(info.menuItemId);
            resolv(albumId, imageUrl);
        })
    }
}

export interface MenuItem {
    id: string;
    title: string;
}
