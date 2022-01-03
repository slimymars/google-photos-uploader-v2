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
            })
            pl.push(new Promise<void>((resolve => {
                chrome.contextMenus.create({
                    id: this.ID_HEADER + 'open_menu',
                    title: "オプションを開く",
                    contexts: ["image"],
                    parentId: this.ROOT_ITEM_ID
                }, resolve)
            })));
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

    static localStorageAllGet(): Promise<any> {
        return new Promise<any>(resolve => chrome.storage.local.get(null, resolve))
    }
    static localStorageImport(json_data: string): Promise<void> {
        return new Promise<void>((resolve) => chrome.storage.local.clear(resolve))
        .then(() => {
            const data = JSON.parse(json_data);
            return new Promise<void>((resolve) =>{
                chrome.storage.local.set(data, resolve);
            })
        });
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

    static openMenu(): void {
        chrome.tabs.create({'url': 'chrome://extensions/?options=' + chrome.runtime.id});
    }

    static addListener(resolv: (albumId: string, imageUrl: string, tabId?: number) => void) {
        chrome.contextMenus.onClicked.addListener((info, tab) => {
            console.log(info, tab);
            if (this.isMyMenu(info.menuItemId.toString()) === false) return;
            if (info.srcUrl === undefined) return;
            const imageUrl = info.srcUrl;
            const albumId = this.menuIdToAlbumId(info.menuItemId.toString());
            if (albumId === "open_menu") {
                ChromeMenu.openMenu();
                return;
            }
            resolv(albumId, imageUrl, tab?.id);
        })
    }
}

export interface MenuItem {
    id: string;
    title: string;
}
