export default class ChromeMenu {
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
}
